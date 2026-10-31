const BASE_URL = 'http://localhost:5000/api/v1';

async function run() {
  console.log('--- TESTING FACULTY & ADMIN STUDENT REGISTER CONTROL ---');

  // 1. Faculty Login
  console.log('\n[1] Logging in as Faculty (faculty.alan@college.edu)...');
  const facultyLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'faculty.alan@college.edu',
      password: 'Password@123',
    }),
  });
  const facultyLoginData = await facultyLoginRes.json();
  const facultyToken = facultyLoginData.token || facultyLoginData.data?.token;
  const facultyUser = facultyLoginData.user || facultyLoginData.data?.user;
  if (!facultyLoginData.success || !facultyToken) {
    throw new Error(`Faculty login failed: ${JSON.stringify(facultyLoginData)}`);
  }
  console.log('✓ Faculty authenticated successfully. Role:', facultyUser?.role);

  // 2. Fetch Departments to get a valid departmentId
  const deptRes = await fetch(`${BASE_URL}/departments`, {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  const deptData = await deptRes.json();
  const departmentId = deptData.data[0]?.id;
  console.log('✓ Department ID resolved:', departmentId);

  // 3. Faculty Registers a new Student
  console.log('\n[2] Faculty registering new student...');
  const testStudentEmail = `faculty.test.student.${Date.now()}@college.edu`;
  const initialPassword = 'TestStudent#Pass123';

  const regRes = await fetch(`${BASE_URL}/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${facultyToken}`,
    },
    body: JSON.stringify({
      firstName: 'Testy',
      lastName: 'FacultyEnrolled',
      email: testStudentEmail,
      departmentId,
      currentSemester: 2,
      phone: '9876543210',
      dob: '2004-05-15',
      password: initialPassword,
    }),
  });
  const regData = await regRes.json();
  console.log('Registration HTTP status:', regRes.status);
  console.log('Registration response:', JSON.stringify(regData, null, 2));

  if (regRes.status !== 201 || !regData.success) {
    throw new Error(`Faculty student registration failed: ${JSON.stringify(regData)}`);
  }
  const studentId = regData.data.id;
  console.log('✓ Student registered by Faculty with ID:', studentId);
  console.log('✓ Admission Number issued:', regData.admissionNumber);
  console.log('✓ Separate Password assigned:', regData.credentials?.password);

  // 4. Test Student Login with initial separate password
  console.log('\n[3] Testing new student login with initial separate password...');
  const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testStudentEmail,
      password: initialPassword,
    }),
  });
  const studentLoginData = await studentLoginRes.json();
  console.log('Student Login HTTP status:', studentLoginRes.status);
  if (!studentLoginData.success) {
    throw new Error(`Student login failed with initial password: ${JSON.stringify(studentLoginData)}`);
  }
  const studentUser = studentLoginData.user || studentLoginData.data?.user;
  console.log('✓ Student successfully logged in with separate password! Role:', studentUser?.role);

  // 5. Faculty Resets Student Password
  console.log('\n[4] Faculty resetting student password...');
  const newResetPassword = 'NewResetPassword#456';
  const resetRes = await fetch(`${BASE_URL}/students/${studentId}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${facultyToken}`,
    },
    body: JSON.stringify({
      newPassword: newResetPassword,
    }),
  });
  const resetData = await resetRes.json();
  console.log('Reset Password HTTP status:', resetRes.status);
  console.log('Reset Password response:', JSON.stringify(resetData, null, 2));

  if (!resetData.success) {
    throw new Error(`Password reset by faculty failed: ${JSON.stringify(resetData)}`);
  }
  console.log('✓ Faculty successfully reset student password.');

  // 6. Test Student Login with new reset password
  console.log('\n[5] Testing student login with reset password...');
  const studentLogin2Res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testStudentEmail,
      password: newResetPassword,
    }),
  });
  const studentLogin2Data = await studentLogin2Res.json();
  if (!studentLogin2Data.success) {
    throw new Error(`Student login failed with reset password: ${JSON.stringify(studentLogin2Data)}`);
  }
  console.log('✓ Student verified login with updated credentials!');

  // 7. Faculty Updates Student Record
  console.log('\n[6] Faculty updating student profile...');
  const updateRes = await fetch(`${BASE_URL}/students/${studentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${facultyToken}`,
    },
    body: JSON.stringify({
      currentSemester: 3,
      phone: '9998887776',
    }),
  });
  const updateData = await updateRes.json();
  if (!updateData.success) {
    throw new Error(`Faculty student update failed: ${JSON.stringify(updateData)}`);
  }
  console.log('✓ Faculty successfully updated student current semester to 3.');

  // 8. Security verification: Faculty should NOT be able to delete student (Admin only)
  console.log('\n[7] Verifying security isolation: Faculty DELETE should be 403 Forbidden...');
  const facultyDeleteRes = await fetch(`${BASE_URL}/students/${studentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  console.log('Faculty DELETE HTTP status:', facultyDeleteRes.status);
  if (facultyDeleteRes.status !== 403) {
    throw new Error(`Security breach: Faculty should NOT have permission to delete student, got status: ${facultyDeleteRes.status}`);
  }
  console.log('✓ Security check passed: Faculty cannot delete student (HTTP 403 Forbidden as required).');

  // 9. Admin Logs in and Cleans up / deletes test student
  console.log('\n[8] Logging in as Admin (admin@college.edu) to remove test student...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@college.edu',
      password: 'Password@123',
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token || adminLoginData.data?.token;

  const adminDeleteRes = await fetch(`${BASE_URL}/students/${studentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminDeleteData = await adminDeleteRes.json();
  console.log('Admin DELETE HTTP status:', adminDeleteRes.status);
  console.log('Admin DELETE response:', JSON.stringify(adminDeleteData));
  if (!adminDeleteData.success) {
    throw new Error(`Admin failed to delete test student: ${JSON.stringify(adminDeleteData)}`);
  }
  console.log('✓ Admin successfully purged test student record and associated user account.');

  console.log('\n======================================================');
  console.log('ALL FACULTY & ADMIN STUDENT CONTROL TESTS PASSED! (8/8)');
  console.log('======================================================\n');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
