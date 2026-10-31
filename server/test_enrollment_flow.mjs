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

async function runEnrollmentTests() {
  console.log('====================================================');
  console.log(' CMP SYSTEM: COURSE ENROLLMENT FLOW & SYNC AUDIT');
  console.log(' Target DB: Neon PostgreSQL (SSL Enabled)');
  console.log('====================================================\n');

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

  // 1. STUDENT AUTHENTICATION
  console.log('--- 1. Testing Student Authentication (Alex Mercer) ---');
  const stuLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'student.alex@college.edu', password: 'Password@123' }),
  });
  assert(stuLogin.ok && stuLogin.data.success, 'Student logged in successfully');
  const studentToken = stuLogin.data.token;
  const alexUserId = stuLogin.data.user?.id;
  assert(!!studentToken, `JWT Bearer token issued for student ${alexUserId}`);

  // 2. FETCH AVAILABLE COURSES AS STUDENT
  console.log('\n--- 2. Fetching Available Courses for Student ---');
  let avCoursesRes = await request('/enrollments/available-courses', { token: studentToken });
  assert(avCoursesRes.ok && avCoursesRes.data.count >= 3, `Catalog returned ${avCoursesRes.data.count} available course sections`);

  // Ensure CS302 is clean (not yet enrolled) before starting test
  let cs302 = avCoursesRes.data.data.find((c) => c.course_code === 'CS302');
  if (cs302 && cs302.is_enrolled && cs302.my_enrollment_id) {
    await request(`/enrollments/${cs302.my_enrollment_id}`, { method: 'DELETE', token: studentToken });
    avCoursesRes = await request('/enrollments/available-courses', { token: studentToken });
    cs302 = avCoursesRes.data.data.find((c) => c.course_code === 'CS302');
  }

  const cs301 = avCoursesRes.data.data.find((c) => c.course_code === 'CS301');
  assert(cs301 && cs301.is_enrolled === true, 'Identified Alex is already enrolled in CS301 (Sec A)');
  assert(cs302 && cs302.is_enrolled === false, 'Identified Alex is NOT yet enrolled in CS302 (Sec A)');

  // 3. STUDENT SELF-ENROLLMENT INTO CS302
  console.log('\n--- 3. Testing Student Self-Enrollment into CS302 ---');
  const enrollRes = await request('/enrollments', {
    method: 'POST',
    token: studentToken,
    body: JSON.stringify({ courseAssignmentId: cs302.course_assignment_id }),
  });
  assert(enrollRes.status === 201 && enrollRes.data.success, `Student self-enrolled into ${cs302.course_code}: ${cs302.course_title}`);
  const cs302EnrollmentId = enrollRes.data.data?.id;

  // Verify duplicate enrollment rejection (409 Conflict)
  const dupEnrollRes = await request('/enrollments', {
    method: 'POST',
    token: studentToken,
    body: JSON.stringify({ courseAssignmentId: cs302.course_assignment_id }),
  });
  assert(dupEnrollRes.status === 409, 'Duplicate course enrollment properly prevented (409 Conflict)');

  // 4. VERIFY STUDENT'S ENROLLED COURSES
  console.log('\n--- 4. Verifying Student Enrolled Courses ---');
  // Resolve Alex's student ID
  const alexStuId = '51111111-1111-1111-1111-111111111101';
  const myCoursesRes = await request(`/enrollments/student/${alexStuId}`, { token: studentToken });
  assert(
    myCoursesRes.ok && myCoursesRes.data.data.some((c) => c.course_code === 'CS302'),
    `Student courses list now includes CS302 (Total Credits: ${myCoursesRes.data.totalCredits} CR)`
  );

  // 5. STUDENT DROPS / UNENROLLS FROM CS302
  console.log('\n--- 5. Testing Student Drop Course / Unenroll ---');
  const dropRes = await request(`/enrollments/${cs302EnrollmentId}`, {
    method: 'DELETE',
    token: studentToken,
  });
  assert(dropRes.ok && dropRes.data.success, 'Student dropped / unenrolled from CS302');

  const verifyDropRes = await request(`/enrollments/student/${alexStuId}`, { token: studentToken });
  assert(
    verifyDropRes.ok && !verifyDropRes.data.data.some((c) => c.course_code === 'CS302'),
    'Verified CS302 removed from student enrolled courses'
  );

  // 6. ADMIN BATCH ENROLLMENT
  console.log('\n--- 6. Testing Admin Batch Enrollment ---');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@college.edu', password: 'Password@123' }),
  });
  const adminToken = adminLogin.data.token;

  // Batch enroll Alex and Priya into CS303
  const cs303 = avCoursesRes.data.data.find((c) => c.course_code === 'CS303');
  const priyaStuId = '51111111-1111-1111-1111-111111111102';

  // Ensure clean state for CS303
  const existingCs303 = await request(`/enrollments?courseAssignmentId=${cs303.course_assignment_id}`, { token: adminToken });
  if (existingCs303.data?.data) {
    for (const enr of existingCs303.data.data) {
      await request(`/enrollments/${enr.id}`, { method: 'DELETE', token: adminToken });
    }
  }

  const batchRes = await request('/enrollments/batch', {
    method: 'POST',
    token: adminToken,
    body: JSON.stringify({
      courseAssignmentId: cs303.course_assignment_id,
      studentIds: [alexStuId, priyaStuId],
    }),
  });
  assert(batchRes.status === 201 && batchRes.data.enrolledCount >= 1, `Batch enrolled ${batchRes.data.enrolledCount} students into ${cs303.course_code}`);

  // 7. QUERY ALL ENROLLMENTS (ADMIN)
  console.log('\n--- 7. Querying Global Enrollment Register ---');
  const allEnrRes = await request('/enrollments', { token: adminToken });
  assert(allEnrRes.ok && allEnrRes.data.count >= 3, `Global enrollment roster contains ${allEnrRes.data.count} registered seats`);

  console.log('\n====================================================');
  console.log(` ENROLLMENT AUDIT: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runEnrollmentTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
