const BASE_URL = 'http://localhost:5000/api/v1';

async function testSessionPinCheckIn() {
  console.log('--- TESTING STUDENT SESSION PIN CHECK-IN FOR ATTENDANCE ---');

  // 1. Authenticate Faculty
  console.log('\n[1] Authenticating Faculty (faculty.alan@college.edu)...');
  const facLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'faculty.alan@college.edu',
      password: 'Password@123',
    }),
  });
  const facLoginData = await facLoginRes.json();
  const facToken = facLoginData.token || facLoginData.data?.token;
  if (!facToken) throw new Error('Faculty login failed');
  console.log('✓ Faculty logged in.');

  // 2. Fetch Assignments
  const assignRes = await fetch(`${BASE_URL}/attendance/assignments`, {
    headers: { Authorization: `Bearer ${facToken}` },
  });
  const assignData = await assignRes.json();
  const assignment = assignData.data[0];
  const assignmentId = assignment.id;
  console.log(`✓ Target Course Assignment: ${assignment.course_code} Sec ${assignment.section} (${assignmentId})`);

  // 3. Faculty Generates Session PIN
  const testDate = new Date().toISOString().split('T')[0];
  const testPeriod = 6;
  console.log(`\n[2] Faculty generating Session PIN for Date: ${testDate}, Period: ${testPeriod}...`);
  const pinRes = await fetch(`${BASE_URL}/attendance/generate-pin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${facToken}`,
    },
    body: JSON.stringify({
      courseAssignmentId: assignmentId,
      sessionDate: testDate,
      periodNumber: testPeriod,
      topic: 'Live PIN Check-In Test Lecture',
    }),
  });
  const pinData = await pinRes.json();
  console.log('Generate PIN response:', pinData);
  if (!pinData.success || !pinData.pin) {
    throw new Error(`Failed to generate PIN: ${JSON.stringify(pinData)}`);
  }
  const generatedPin = pinData.pin;
  const rawPin = pinData.rawPin;
  const sessionId = pinData.sessionId;
  console.log(`✓ Active Session PIN generated: "${generatedPin}" (Raw: "${rawPin}") for session ${sessionId}`);

  // 4. Authenticate Student (Alex Mercer)
  console.log('\n[3] Authenticating Student (student.alex@college.edu)...');
  const stuLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'student.alex@college.edu',
      password: 'Password@123',
    }),
  });
  const stuLoginData = await stuLoginRes.json();
  const stuToken = stuLoginData.token || stuLoginData.data?.token;
  if (!stuToken) throw new Error('Student login failed');
  console.log('✓ Student logged in as Alex Mercer.');

  // 5. Test Invalid PIN check-in (should return 400 Bad Request)
  console.log('\n[4] Testing invalid PIN entry ("999-999")...');
  const badCheckInRes = await fetch(`${BASE_URL}/attendance/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${stuToken}`,
    },
    body: JSON.stringify({ pin: '999-999' }),
  });
  const badCheckInData = await badCheckInRes.json();
  console.log('Invalid PIN HTTP status:', badCheckInRes.status);
  console.log('Invalid PIN response:', badCheckInData.message);
  if (badCheckInRes.status !== 400 || badCheckInData.success) {
    throw new Error('Expected 400 error for invalid PIN!');
  }
  console.log('✓ Rejection confirmed for invalid PIN.');

  // 6. Student Enters Valid Session PIN
  console.log(`\n[5] Student entering valid Session PIN "${generatedPin}"...`);
  const validCheckInRes = await fetch(`${BASE_URL}/attendance/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${stuToken}`,
    },
    body: JSON.stringify({ pin: generatedPin }),
  });
  const validCheckInData = await validCheckInRes.json();
  console.log('Valid Check-In HTTP status:', validCheckInRes.status);
  console.log('Valid Check-In response:', JSON.stringify(validCheckInData, null, 2));

  if (!validCheckInData.success) {
    throw new Error(`Check-in failed with valid PIN: ${JSON.stringify(validCheckInData)}`);
  }
  console.log('✓ Student successfully checked in via Session PIN!');
  console.log(`✓ Status: ${validCheckInData.data?.attendanceRecord?.status}`);
  console.log(`✓ Remarks: ${validCheckInData.data?.attendanceRecord?.remarks}`);

  // 7. Verify Attendance in Database via Faculty Session endpoint
  console.log('\n[6] Verifying session record in Neon PostgreSQL...');
  const verifyRes = await fetch(`${BASE_URL}/attendance/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${facToken}` },
  });
  const verifyData = await verifyRes.json();
  const alexRecord = verifyData.data?.records?.find((r) => r.admission_number === 'CMP-2025-CSE-0001' || r.student_name.includes('Alex'));
  console.log('Verified student record in DB:', alexRecord);
  if (!alexRecord || alexRecord.status !== 'PRESENT') {
    throw new Error('Alex Mercer not marked PRESENT in session records!');
  }
  console.log('✓ Student attendance confirmed PRESENT in database.');

  // 8. Clean up test session
  console.log('\n[7] Cleaning up test session...');
  await fetch(`${BASE_URL}/attendance/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${facToken}` },
  });
  console.log('✓ Test session deleted.');

  console.log('\n============================================================');
  console.log('ALL STUDENT SESSION PIN CHECK-IN TESTS PASSED! (7/7)');
  console.log('============================================================\n');
}

testSessionPinCheckIn().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
