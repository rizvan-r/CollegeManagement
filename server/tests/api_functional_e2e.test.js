const BASE_URL = 'http://localhost:5000/api/v1';

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, headers: res.headers, data: json };
}

async function login(email, password = 'Password@123') {
  const res = await request('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bypass-rate-limit': 'test-suite',
    },
    body: JSON.stringify({ email, password }),
  });
  if (res.status !== 200 || !res.data?.token) {
    throw new Error(`Login failed for ${email}`);
  }
  return res.data.token;
}

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(message);
  }
  passed++;
  console.log(`  ✓ PASSED: ${message}`);
}

async function runE2E() {
  console.log('====================================================');
  console.log(' CMP MULTI-ROLE FUNCTIONAL E2E TEST SUITE');
  console.log('====================================================\n');

  // Authenticate all 4 roles
  const studentToken = await login('student.alex@college.edu');
  const facultyToken = await login('faculty.alan@college.edu');
  const hodToken = await login('hod.cse@college.edu');
  const adminToken = await login('admin@college.edu');

  // --- MODULE 1: STUDENT FUNCTIONAL FLOW ---
  console.log('[MODULE 1] Student Portal Functional Verification...');
  
  // 1.1 Student Dashboard
  const stuDash = await request('/dashboard/student', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(stuDash.status === 200 && stuDash.data?.success, 'Student dashboard retrieved with 200 OK');
  assert(typeof stuDash.data?.data?.overallAttendance === 'number', 'Student dashboard includes overall attendance metric');

  // 1.2 Student Profile
  const stuProfile = await request('/students/profile', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(stuProfile.status === 200, 'Student profile retrieved with 200 OK');
  assert(Boolean(stuProfile.data?.data?.admission_number), 'Student admission number present in profile');

  // 1.3 Enrolled Courses
  const stuCourses = await request('/enrollments/my', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(stuCourses.status === 200 && Array.isArray(stuCourses.data?.data), 'Enrolled courses array retrieved');

  // 1.4 Student Attendance Records
  const stuAtt = await request('/attendance/my', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(stuAtt.status === 200 && (stuAtt.data?.summary || stuAtt.data?.data?.summary), 'Student attendance summary retrieved');

  // 1.5 PIN Check-in Validation (Invalid pin format rejection)
  const badCheckIn = await request('/attendance/check-in', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '12' }),
  });
  assert(badCheckIn.status === 400, 'Check-in rejects malformed PIN (<6 digits) with HTTP 400');

  // --- MODULE 2: FACULTY FUNCTIONAL FLOW ---
  console.log('\n[MODULE 2] Faculty Portal Functional Verification...');

  // 2.1 Faculty Dashboard
  const facDash = await request('/dashboard/faculty', {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  assert(facDash.status === 200 && facDash.data?.success, 'Faculty dashboard retrieved with 200 OK');

  // 2.2 Assigned Courses
  const facCourses = await request('/faculty/courses', {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  assert(facCourses.status === 200 && Array.isArray(facCourses.data?.data), 'Faculty assigned courses list retrieved');
  const assignmentId = facCourses.data.data[0]?.id || 'a1111111-1111-1111-1111-111111111101';

  // 2.3 Course Students Roster
  const rosterRes = await request(`/faculty/courses/${assignmentId}/students`, {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  assert(rosterRes.status === 200, 'Course roster retrieved for faculty assigned section');

  // 2.4 Dynamic PIN Generation
  const pinRes = await request('/attendance/generate-pin', {
    method: 'POST',
    headers: { Authorization: `Bearer ${facultyToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseAssignmentId: assignmentId,
      sessionDate: new Date().toISOString().split('T')[0],
      periodNumber: 4,
      topic: 'Automated Testing Best Practices',
    }),
  });
  assert(pinRes.status === 200 && Boolean(pinRes.data?.pin), 'Dynamic 6-digit session PIN generated successfully');

  // 2.5 Active PIN Query
  const activePinRes = await request(`/attendance/active-pin?courseAssignmentId=${assignmentId}&sessionDate=${new Date().toISOString().split('T')[0]}&periodNumber=4`, {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  assert(activePinRes.status === 200 && activePinRes.data?.hasActivePin === true, 'Active PIN status queried and verified');

  // 2.6 Submit Attendance Session
  const recordSessionRes = await request('/attendance/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${facultyToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseAssignmentId: assignmentId,
      sessionDate: new Date().toISOString().split('T')[0],
      periodNumber: 5,
      topic: 'Network Sockets & REST Architecture',
      records: [
        { studentId: '51111111-1111-1111-1111-111111111101', status: 'PRESENT', remarks: 'Active engagement' },
        { studentId: '51111111-1111-1111-1111-111111111102', status: 'PRESENT', remarks: 'Present' },
      ],
    }),
  });
  assert(recordSessionRes.status === 201, 'Attendance session submitted successfully (HTTP 201 Created)');
  const sessionId = recordSessionRes.data?.data?.id;

  // 2.7 Read Recorded Session Details
  if (sessionId) {
    const sessionDetailRes = await request(`/attendance/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    assert(sessionDetailRes.status === 200 && sessionDetailRes.data?.data?.records?.length > 0, 'Session details retrieved with student records');
  }

  // --- MODULE 3: HOD FUNCTIONAL FLOW ---
  console.log('\n[MODULE 3] HOD Portal Functional Verification...');

  // 3.1 HOD Dashboard
  const hodDash = await request('/hod/dashboard', {
    headers: { Authorization: `Bearer ${hodToken}` },
  });
  assert(hodDash.status === 200 && hodDash.data?.success, 'HOD departmental dashboard retrieved with 200 OK');

  // 3.2 Department Faculty
  const hodFaculty = await request('/hod/faculty', {
    headers: { Authorization: `Bearer ${hodToken}` },
  });
  assert(hodFaculty.status === 200 && Array.isArray(hodFaculty.data?.data), 'HOD departmental faculty roster retrieved');

  // 3.3 Department Students
  const hodStudents = await request('/hod/students', {
    headers: { Authorization: `Bearer ${hodToken}` },
  });
  assert(hodStudents.status === 200 && Array.isArray(hodStudents.data?.data), 'HOD departmental students roster retrieved');

  // 3.4 Department Attendance & Low Attendance Alerts
  const hodAtt = await request('/hod/attendance', {
    headers: { Authorization: `Bearer ${hodToken}` },
  });
  assert(hodAtt.status === 200 && hodAtt.data?.data?.summary, 'Department attendance overview and low-attendance alerts retrieved');

  // 3.5 Academic Requests
  const hodRequests = await request('/hod/requests', {
    headers: { Authorization: `Bearer ${hodToken}` },
  });
  assert(hodRequests.status === 200 && Array.isArray(hodRequests.data?.data), 'Department academic/OD requests retrieved');

  // 3.6 Approve Request
  const patchReq = await request('/hod/requests/req-leave-002', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${hodToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'APPROVED', remarks: 'Verified medical certificate.' }),
  });
  assert(patchReq.status === 200 && patchReq.data?.data?.status === 'APPROVED', 'HOD successfully processed and approved academic request');

  // 3.7 Publish Department Notice
  const hodNotice = await request('/hod/notices', {
    method: 'POST',
    headers: { Authorization: `Bearer ${hodToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'CSE Department Colloquium 2026',
      content: 'Guest lecture on Artificial Intelligence architectures this Friday at 2:00 PM.',
      priority: 'HIGH',
      audience: 'DEPARTMENT_ONLY',
    }),
  });
  assert(hodNotice.status === 201 && Boolean(hodNotice.data?.data?.id), 'HOD published department notice (HTTP 201 Created)');

  // --- MODULE 4: ADMIN FUNCTIONAL FLOW ---
  console.log('\n[MODULE 4] College Administrator Portal Functional Verification...');

  // 4.1 Admin Institutional Dashboard
  const adminDash = await request('/admin/dashboard', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminDash.status === 200 && adminDash.data?.success, 'Admin institutional dashboard KPIs retrieved with 200 OK');

  // 4.2 List & Create Department
  const deptCode = `TEST${Date.now().toString().slice(-4)}`;
  const createDept = await request('/departments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: deptCode,
      name: `Test Department ${deptCode}`,
      building: 'Cyber Hall',
      establishedYear: 2026,
    }),
  });
  assert(createDept.status === 201, `Department ${deptCode} created successfully`);
  const createdDeptId = createDept.data?.data?.id;

  // 4.3 List & Create Course
  const courseCode = `CS${Date.now().toString().slice(-4)}`;
  const createCourse = await request('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: courseCode,
      title: `Advanced Cloud Computing ${courseCode}`,
      credits: 4,
      semester: 5,
      departmentId: createdDeptId || 'd0000000-0000-0000-0000-000000000001',
    }),
  });
  assert(createCourse.status === 201, `Course ${courseCode} created successfully`);

  // 4.4 List User Accounts
  const usersRes = await request('/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(usersRes.status === 200 && Array.isArray(usersRes.data?.data), 'Admin user accounts list retrieved');
  const targetUser = usersRes.data.data.find((u) => u.email === 'student.priya@college.edu');

  // 4.5 Toggle User Status (Deactivate & Re-activate)
  if (targetUser) {
    const toggleDeactivate = await request(`/admin/users/${targetUser.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });
    assert(toggleDeactivate.status === 200 && toggleDeactivate.data?.data?.is_active === false, 'User account deactivated');

    const toggleReactivate = await request(`/admin/users/${targetUser.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    });
    assert(toggleReactivate.status === 200 && toggleReactivate.data?.data?.is_active === true, 'User account re-activated');
  }

  // 4.6 Audit Logs
  const auditRes = await request('/admin/audit-logs', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(auditRes.status === 200 && Array.isArray(auditRes.data?.data), 'Institutional audit logs retrieved');

  // 4.7 Institutional Attendance Reports
  const reportsRes = await request('/admin/attendance/reports', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(reportsRes.status === 200 && (reportsRes.data?.data?.summary || reportsRes.data?.data?.overview), 'Institutional attendance analytics report retrieved');

  console.log('\n====================================================');
  console.log(` 🎉 MULTI-ROLE FUNCTIONAL E2E COMPLETE: ${passed}/${total} TESTS PASSED!`);
  console.log('====================================================');
}

runE2E().catch((err) => {
  console.error('\n❌ E2E test suite failed:', err);
  process.exit(1);
});
