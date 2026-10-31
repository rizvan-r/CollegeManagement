const BASE_URL = 'http://localhost:5000/api/v1';

async function testAttendanceUpdate() {
  console.log('--- TESTING ATTENDANCE SUBMIT AND UPDATE FOR CURRENT SESSION ---');

  // 1. Authenticate Faculty
  console.log('\n[1] Authenticating Faculty (faculty.alan@college.edu)...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'faculty.alan@college.edu',
      password: 'Password@123',
    }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token || loginData.data?.token;
  if (!token) throw new Error('Faculty login failed');
  console.log('✓ Faculty logged in.');

  // 2. Fetch Assignments & Students
  console.log('\n[2] Fetching active course assignments and students...');
  const assignRes = await fetch(`${BASE_URL}/attendance/assignments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const assignData = await assignRes.json();
  const assignment = assignData.data[0];
  const assignmentId = assignment.id;
  console.log(`✓ Using Course Assignment: ${assignment.course_code} Sec ${assignment.section} (ID: ${assignmentId})`);

  const stuRes = await fetch(`${BASE_URL}/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const stuData = await stuRes.json();
  const students = stuData.data.slice(0, 2);
  if (students.length < 2) throw new Error('Need at least 2 students for test');
  console.log(`✓ Target students: ${students[0].first_name} (${students[0].id}) and ${students[1].first_name} (${students[1].id})`);

  const testDate = new Date().toISOString().split('T')[0];
  const testPeriod = 5; // Use period 5 for isolation

  // 3. Check current-session before creating
  console.log(`\n[3] Checking GET /attendance/current-session before creation for Date: ${testDate}, Period: ${testPeriod}...`);
  const initialCheckRes = await fetch(
    `${BASE_URL}/attendance/current-session?courseAssignmentId=${assignmentId}&sessionDate=${testDate}&periodNumber=${testPeriod}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const initialCheckData = await initialCheckRes.json();
  console.log('Initial check exists:', initialCheckData.exists);

  // 4. Submit Attendance for the current session (student 0 = PRESENT, student 1 = ABSENT)
  console.log('\n[4] Submitting initial attendance session...');
  const submitRes = await fetch(`${BASE_URL}/attendance/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      courseAssignmentId: assignmentId,
      sessionDate: testDate,
      periodNumber: testPeriod,
      topic: 'Initial Session Topic: Distributed Transactions',
      records: [
        { studentId: students[0].id, status: 'PRESENT' },
        { studentId: students[1].id, status: 'ABSENT' },
      ],
    }),
  });
  const submitData = await submitRes.json();
  console.log('Submit HTTP status:', submitRes.status);
  if (!submitData.success) throw new Error(`Failed to submit attendance: ${JSON.stringify(submitData)}`);
  const sessionId = submitData.data.id;
  console.log(`✓ Session created/saved with ID: ${sessionId}`);

  // 5. Query GET /attendance/current-session to verify records loaded
  console.log('\n[5] Verifying session and student records via GET /attendance/current-session...');
  const loadedRes = await fetch(
    `${BASE_URL}/attendance/current-session?courseAssignmentId=${assignmentId}&sessionDate=${testDate}&periodNumber=${testPeriod}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const loadedData = await loadedRes.json();
  if (!loadedData.exists || !loadedData.data) {
    throw new Error('Current session was not found after creation!');
  }
  console.log('✓ Found recorded session:', loadedData.data.id);
  console.log('✓ Recorded topic:', loadedData.data.topic);
  const student1Initial = loadedData.data.records.find((r) => r.student_id === students[1].id);
  console.log(`✓ Student 1 initial status: ${student1Initial?.status} (Expected: ABSENT)`);
  if (student1Initial?.status !== 'ABSENT') {
    throw new Error(`Expected ABSENT but got ${student1Initial?.status}`);
  }

  // 6. Submit UPDATE for current session via PUT /attendance/sessions/:id (changing student 1 to PRESENT)
  console.log('\n[6] Submitting UPDATE for current session (updating student 1 from ABSENT to PRESENT)...');
  const updateRes = await fetch(`${BASE_URL}/attendance/sessions/${sessionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      topic: 'Updated Topic: Distributed Transactions & Two-Phase Commit',
      records: [
        { studentId: students[0].id, status: 'PRESENT' },
        { studentId: students[1].id, status: 'PRESENT' }, // changed to PRESENT!
      ],
    }),
  });
  const updateData = await updateRes.json();
  console.log('Update HTTP status:', updateRes.status);
  console.log('Update response message:', updateData.message);
  if (!updateData.success) throw new Error(`Failed to update session: ${JSON.stringify(updateData)}`);
  console.log('✓ Session updated successfully.');

  // 7. Verify the update persisted in Neon PostgreSQL
  console.log('\n[7] Verifying updated attendance persisted in Neon PostgreSQL...');
  const verifyRes = await fetch(
    `${BASE_URL}/attendance/current-session?courseAssignmentId=${assignmentId}&sessionDate=${testDate}&periodNumber=${testPeriod}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const verifyData = await verifyRes.json();
  const student1Updated = verifyData.data.records.find((r) => r.student_id === students[1].id);
  console.log(`✓ Student 1 updated status: ${student1Updated?.status} (Expected: PRESENT)`);
  console.log(`✓ Updated session topic: ${verifyData.data.topic}`);
  if (student1Updated?.status !== 'PRESENT') {
    throw new Error(`Expected PRESENT after update, got ${student1Updated?.status}`);
  }

  // 8. Clean up test session
  console.log('\n[8] Cleaning up test session...');
  const delRes = await fetch(`${BASE_URL}/attendance/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const delData = await delRes.json();
  console.log('Delete status:', delData.success);

  console.log('\n=============================================================');
  console.log('ALL CURRENT SESSION SUBMIT & UPDATE TESTS PASSED! (8/8)');
  console.log('=============================================================\n');
}

testAttendanceUpdate().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
