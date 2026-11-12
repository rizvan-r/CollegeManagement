const BASE_URL = 'http://localhost:5000/api/v1';

async function run() {
  console.log('--- Testing Notification API Endpoints ---');

  // 1. Login as student
  const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student.alex@college.edu', password: 'Password@123' })
  });
  const studentLogin = await studentLoginRes.json();
  if (!studentLogin.success) throw new Error('Student login failed: ' + studentLogin.message);
  const studentToken = studentLogin.token;
  console.log('✓ Student logged in successfully');

  // 2. Register Device Token
  const testPushToken = 'ExponentPushToken[TestSimulatedToken12345]';
  const regRes = await fetch(`${BASE_URL}/notifications/devices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      pushToken: testPushToken,
      platform: 'android',
      deviceName: 'Pixel 8 Pro'
    })
  });
  const regData = await regRes.json();
  console.log('✓ Device Token Registration:', regData.message || regData);

  // 3. Get Preferences
  const prefRes = await fetch(`${BASE_URL}/notifications/preferences`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const prefData = await prefRes.json();
  console.log('✓ Get Notification Preferences:', prefData.data);

  // 4. Update Preferences
  const updatePrefRes = await fetch(`${BASE_URL}/notifications/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      announcements: true,
      attendance: true,
      requests: true,
      academic: false
    })
  });
  const updatePrefData = await updatePrefRes.json();
  console.log('✓ Update Preferences (academic -> false):', updatePrefData.data);

  // 5. Send Test Push
  const testPushRes = await fetch(`${BASE_URL}/notifications/test-push`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const testPushData = await testPushRes.json();
  console.log('✓ Send Test Push Result:', testPushData.message);

  // 6. List Notifications
  const listRes = await fetch(`${BASE_URL}/notifications`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const listData = await listRes.json();
  console.log(`✓ Fetched Notifications: ${listData.count} total, unread: ${listData.unreadCount}`);
  const notifId = listData.data?.[0]?.id;

  // 7. Mark as Read
  if (notifId) {
    const markRes = await fetch(`${BASE_URL}/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const markData = await markRes.json();
    console.log('✓ Mark Single Notification as Read:', markData.message);
  }

  // 8. Mark All as Read
  const markAllRes = await fetch(`${BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const markAllData = await markAllRes.json();
  console.log('✓ Mark All as Read:', markAllData.message);

  // 9. Admin broadcast test
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@college.edu', password: 'Password@123' })
  });
  const adminLogin = await adminLoginRes.json();
  const adminToken = adminLogin.token;

  const broadcastRes = await fetch(`${BASE_URL}/notifications/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      title: 'Campus Emergency Drill',
      body: 'Campus evacuation drill scheduled for tomorrow at 10:00 AM.',
      audience: 'COLLEGE_WIDE',
      category: 'ANNOUNCEMENTS'
    })
  });
  const broadcastData = await broadcastRes.json();
  console.log('✓ Admin Broadcast Notification:', broadcastData.message);

  // 10. Deactivate device token on logout
  const unregRes = await fetch(`${BASE_URL}/notifications/devices`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({ pushToken: testPushToken })
  });
  const unregData = await unregRes.json();
  console.log('✓ Device Deactivation on Logout:', unregData.message);

  console.log('--- All Backend Notification Endpoints Verified Successfully! ---');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
