const BASE_URL = 'http://localhost:5000/api/v1';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('====================================================');
  console.log(' CMP SYSTEM: LIVE BACKEND & DATABASE CRUD & SYNC AUDIT');
  console.log(' Target DB: Neon PostgreSQL (SSL Enabled)');
  console.log(' Target API: Express v1 Server on port 5000');
  console.log('====================================================\n');

  let adminToken = '';
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. AUTHENTICATION
  console.log('--- 1. Testing Admin Authentication ---');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@college.edu', password: 'Password@123' }),
  });
  assert(loginRes.ok && loginRes.data.success, 'Admin logged in successfully');
  adminToken = loginRes.data.token;
  assert(!!adminToken, 'JWT Bearer token issued');

  // Fetch initial departments for references
  const deptsRes = await request('/departments', { token: adminToken });
  const cseDept = deptsRes.data.data?.find((d) => d.code === 'CSE') || deptsRes.data.data?.[0];
  const cseDeptId = cseDept?.id;
  assert(!!cseDeptId, `Identified CSE Department ID: ${cseDeptId}`);

  // 2. DEPARTMENTS CRUD
  console.log('\n--- 2. Testing Departments CRUD ---');
  const newDeptCode = `AERO_${Math.floor(100 + Math.random() * 900)}`;
  const createDeptRes = await request('/departments', {
    method: 'POST',
    token: adminToken,
    body: JSON.stringify({
      code: newDeptCode,
      name: 'Aerospace Engineering',
      building: 'Armstrong Hangar',
      establishedYear: 2026,
    }),
  });
  assert(createDeptRes.status === 201 && createDeptRes.data.success, `CREATE Department (${newDeptCode})`);
  const createdDeptId = createDeptRes.data.data?.id;

  const getDeptRes = await request(`/departments/${createdDeptId}`, { token: adminToken });
  assert(getDeptRes.ok && getDeptRes.data.data?.code === newDeptCode, `READ Single Department (${createdDeptId})`);

  const updateDeptRes = await request(`/departments/${createdDeptId}`, {
    method: 'PUT',
    token: adminToken,
    body: JSON.stringify({ name: 'Aerospace and Astronautical Systems' }),
  });
  assert(updateDeptRes.ok && updateDeptRes.data.data?.name.includes('Astronautical'), 'UPDATE Department name');

  const deleteDeptRes = await request(`/departments/${createdDeptId}`, {
    method: 'DELETE',
    token: adminToken,
  });
  assert(deleteDeptRes.ok && deleteDeptRes.data.success, 'DELETE Department');

  const verifyDeptDel = await request(`/departments/${createdDeptId}`, { token: adminToken });
  assert(verifyDeptDel.status === 404, 'Verified Department is 404 deleted');

  // 3. COURSES CRUD
  console.log('\n--- 3. Testing Courses CRUD ---');
  const newCourseCode = `CS_${Math.floor(400 + Math.random() * 500)}`;
  const createCourseRes = await request('/courses', {
    method: 'POST',
    token: adminToken,
    body: JSON.stringify({
      code: newCourseCode,
      title: 'Distributed Systems & Cloud Computing',
      departmentId: cseDeptId,
      credits: 4,
      semester: 5,
    }),
  });
  assert(createCourseRes.status === 201 && createCourseRes.data.success, `CREATE Course (${newCourseCode})`);
  const createdCourseId = createCourseRes.data.data?.id;

  const getCourseRes = await request(`/courses/${createdCourseId}`, { token: adminToken });
  assert(getCourseRes.ok && getCourseRes.data.data?.code === newCourseCode, `READ Single Course (${createdCourseId})`);

  const updateCourseRes = await request(`/courses/${createdCourseId}`, {
    method: 'PUT',
    token: adminToken,
    body: JSON.stringify({ title: 'Advanced Distributed Systems & Microservices' }),
  });
  assert(updateCourseRes.ok && updateCourseRes.data.data?.title.includes('Advanced'), 'UPDATE Course title');

  const deleteCourseRes = await request(`/courses/${createdCourseId}`, {
    method: 'DELETE',
    token: adminToken,
  });
  assert(deleteCourseRes.ok && deleteCourseRes.data.success, 'DELETE Course');

  const verifyCourseDel = await request(`/courses/${createdCourseId}`, { token: adminToken });
  assert(verifyCourseDel.status === 404, 'Verified Course is 404 deleted');

  // 4. FACULTY CRUD
  console.log('\n--- 4. Testing Faculty CRUD (with Separate Password & Reset) ---');
  const facEmail = `faculty.shannon.${Date.now()}@college.edu`;
  const facInitialPass = 'ShannonSecureKey@7788';
  const createFacRes = await request('/faculty', {
    method: 'POST',
    token: adminToken,
    body: JSON.stringify({
      firstName: 'Claude',
      lastName: 'Shannon',
      email: facEmail,
      departmentId: cseDeptId,
      designation: 'Associate Professor',
      qualification: 'Ph.D. Information Theory',
      password: facInitialPass,
    }),
  });
  assert(createFacRes.status === 201 && createFacRes.data.success, `CREATE Faculty (${facEmail})`);
  const createdFacId = createFacRes.data.data?.id;

  // Authenticate as new faculty with their separate password
  const facAuthRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: facEmail, password: facInitialPass }),
  });
  assert(facAuthRes.ok && facAuthRes.data.success, 'AUTHENTICATE Faculty using separate custom password');

  const getFacRes = await request(`/faculty/${createdFacId}`, { token: adminToken });
  assert(getFacRes.ok && getFacRes.data.data?.email === facEmail, `READ Single Faculty (${createdFacId})`);

  const updateFacRes = await request(`/faculty/${createdFacId}`, {
    method: 'PUT',
    token: adminToken,
    body: JSON.stringify({ designation: 'Distinguished Chair Professor' }),
  });
  assert(updateFacRes.ok && updateFacRes.data.data?.designation.includes('Distinguished'), 'UPDATE Faculty designation');

  // Reset Faculty Password
  const newFacPass = 'NewShannonPass@9900!';
  const resetFacPassRes = await request(`/faculty/${createdFacId}/reset-password`, {
    method: 'POST',
    token: adminToken,
    body: JSON.stringify({ newPassword: newFacPass }),
  });
  assert(resetFacPassRes.ok && resetFacPassRes.data.success, 'RESET Faculty password via admin');

  // Authenticate with new reset password
  const facReauthRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: facEmail, password: newFacPass }),
  });
  assert(facReauthRes.ok && facReauthRes.data.success, 'AUTHENTICATE Faculty with newly reset password');

  // Delete Faculty
  const deleteFacRes = await request(`/faculty/${createdFacId}`, {
    method: 'DELETE',
    token: adminToken,
  });
  assert(deleteFacRes.ok && deleteFacRes.data.success, 'DELETE Faculty Profile and User account');

  const verifyFacDel = await request(`/faculty/${createdFacId}`, { token: adminToken });
  assert(verifyFacDel.status === 404, 'Verified Faculty is 404 deleted');

  // 5. STUDENTS CRUD
  console.log('\n--- 5. Testing Students CRUD (with Separate Password & Reset) ---');
  const stuEmail = `student.ada.${Date.now()}@college.edu`;
  const stuInitialPass = 'AdaLovelaceKey@5544';
  const createStuRes = await request('/students', {
    method: 'POST',
    token: adminToken,
    body: JSON.stringify({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: stuEmail,
      departmentId: cseDeptId,
      currentSemester: 3,
      password: stuInitialPass,
    }),
  });
  assert(createStuRes.status === 201 && createStuRes.data.success, `CREATE Student (${stuEmail})`);
  const createdStuId = createStuRes.data.data?.id;

  // Authenticate as new student with separate password
  const stuAuthRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: stuEmail, password: stuInitialPass }),
  });
  assert(stuAuthRes.ok && stuAuthRes.data.success, 'AUTHENTICATE Student using separate custom password');

  const getStuRes = await request(`/students/${createdStuId}`, { token: adminToken });
  assert(getStuRes.ok && getStuRes.data.data?.email === stuEmail, `READ Single Student (${createdStuId})`);

  const updateStuRes = await request(`/students/${createdStuId}`, {
    method: 'PUT',
    token: adminToken,
    body: JSON.stringify({ currentSemester: 4, phone: '+1-555-4321' }),
  });
  assert(updateStuRes.ok && updateStuRes.data.data?.current_semester === 4, 'UPDATE Student semester');

  // Reset Student Password
  const newStuPass = 'NewAdaPass@3322!';
  const resetStuPassRes = await request(`/students/${createdStuId}/reset-password`, {
    method: 'POST',
    token: adminToken,
    body: JSON.stringify({ newPassword: newStuPass }),
  });
  assert(resetStuPassRes.ok && resetStuPassRes.data.success, 'RESET Student password via admin');

  // Authenticate with new reset password
  const stuReauthRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: stuEmail, password: newStuPass }),
  });
  assert(stuReauthRes.ok && stuReauthRes.data.success, 'AUTHENTICATE Student with newly reset password');

  // 6. ATTENDANCE CRUD & LIVE SYNC
  console.log('\n--- 6. Testing Attendance CRUD & Foreign Key Integrity Sync ---');
  // Get active course assignments
  const assignRes = await request('/attendance/assignments', { token: adminToken });
  assert(assignRes.ok && assignRes.data.data?.length > 0, `FETCH Course Assignments (${assignRes.data.data?.length} found)`);
  const targetAssignment = assignRes.data.data[0];
  const targetAssignmentId = targetAssignment.id;

  // Fetch roster
  const rosterRes = await request(`/attendance/roster/${targetAssignmentId}`, { token: adminToken });
  assert(rosterRes.ok && Array.isArray(rosterRes.data.data), `FETCH Roster for Section (${rosterRes.data.data?.length} students)`);

  // Build attendance records containing valid students (including Ada)
  const sessionDate = new Date().toISOString().split('T')[0];
  const period = 3;
  const attendancePayload = {
    courseAssignmentId: targetAssignmentId,
    sessionDate,
    periodNumber: period,
    topic: 'Relational Schema Normalization (3NF & BCNF)',
    records: [
      { studentId: createdStuId, status: 'PRESENT', remarks: 'Active engagement' },
      ...(rosterRes.data.data.slice(0, 3).map((s) => ({
        studentId: s.studentId,
        status: 'PRESENT',
      }))),
    ],
  };

  const recordAttendanceRes = await request('/attendance/sessions', {
    method: 'POST',
    token: adminToken,
    body: JSON.stringify(attendancePayload),
  });
  assert(
    recordAttendanceRes.status === 201 && recordAttendanceRes.data.success,
    `CREATE / RECORD Attendance Session (Persisted ${recordAttendanceRes.data.recordsCount} student records to DB)`
  );
  const createdSessionId = recordAttendanceRes.data.data?.id;

  // Read recorded sessions list
  const listSessionsRes = await request('/attendance/sessions', { token: adminToken });
  assert(
    listSessionsRes.ok && listSessionsRes.data.data?.some((s) => s.id === createdSessionId),
    'READ Attendance Sessions List (Verified new session appears in Neon DB)'
  );

  // Read single session detail
  const singleSessionRes = await request(`/attendance/sessions/${createdSessionId}`, { token: adminToken });
  assert(
    singleSessionRes.ok && singleSessionRes.data.data?.records?.length > 0,
    `READ Single Attendance Session with ${singleSessionRes.data.data?.records?.length} student records`
  );

  // Read student attendance metrics
  const stuAttendanceStatsRes = await request(`/attendance/student/${createdStuId}`, { token: adminToken });
  assert(
    stuAttendanceStatsRes.ok && stuAttendanceStatsRes.data.summary?.total_sessions >= 1,
    `READ Student Attendance Percentage (${stuAttendanceStatsRes.data.summary?.attendance_percentage}%)`
  );

  // Delete Attendance Session
  const deleteSessionRes = await request(`/attendance/sessions/${createdSessionId}`, {
    method: 'DELETE',
    token: adminToken,
  });
  assert(deleteSessionRes.ok && deleteSessionRes.data.success, 'DELETE Attendance Session');

  // Purge test student now that attendance is tested
  const deleteStuRes = await request(`/students/${createdStuId}`, {
    method: 'DELETE',
    token: adminToken,
  });
  assert(deleteStuRes.ok && deleteStuRes.data.success, 'DELETE Student Profile and User account');

  const verifyStuDel = await request(`/students/${createdStuId}`, { token: adminToken });
  assert(verifyStuDel.status === 404, 'Verified Student is 404 deleted');

  // 7. NOTICES CRUD
  console.log('\n--- 7. Testing Notices CRUD ---');
  const createNoticeRes = await request('/notices', {
    method: 'POST',
    token: adminToken,
    body: JSON.stringify({
      title: 'Annual Tech Symposium 2026',
      content: 'Call for student papers and technical project exhibitions.',
      priority: 'HIGH',
      audience: 'COLLEGE_WIDE',
    }),
  });
  assert(createNoticeRes.status === 201 && createNoticeRes.data.success, 'CREATE Institutional Notice');
  const createdNoticeId = createNoticeRes.data.data?.id;

  const getNoticeRes = await request(`/notices/${createdNoticeId}`, { token: adminToken });
  assert(getNoticeRes.ok && getNoticeRes.data.data?.title.includes('Symposium'), `READ Single Notice (${createdNoticeId})`);

  const updateNoticeRes = await request(`/notices/${createdNoticeId}`, {
    method: 'PUT',
    token: adminToken,
    body: JSON.stringify({ title: 'Annual International Tech Symposium 2026' }),
  });
  assert(updateNoticeRes.ok && updateNoticeRes.data.data?.title.includes('International'), 'UPDATE Notice');

  const deleteNoticeRes = await request(`/notices/${createdNoticeId}`, {
    method: 'DELETE',
    token: adminToken,
  });
  assert(deleteNoticeRes.ok && deleteNoticeRes.data.success, 'DELETE Notice');

  const verifyNoticeDel = await request(`/notices/${createdNoticeId}`, { token: adminToken });
  assert(verifyNoticeDel.status === 404, 'Verified Notice is 404 deleted');

  // SUMMARY
  console.log('\n====================================================');
  console.log(` AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
