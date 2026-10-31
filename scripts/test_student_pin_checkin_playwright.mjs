import { chromium } from 'playwright';

async function runStudentPinCheckInTest() {
  console.log('Launching browser to test full Faculty PIN Generation -> Student Check-In flow...');
  const browser = await chromium.launch({ headless: true });

  // CONTEXT 1: Faculty
  const facultyContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const facultyPage = await facultyContext.newPage();

  console.log('[Faculty] Logging in as faculty.alan@college.edu...');
  await facultyPage.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await facultyPage.fill('input[type="email"]', 'faculty.alan@college.edu');
  await facultyPage.fill('input[type="password"]', 'Password@123');
  await facultyPage.click('button[type="submit"]');
  await facultyPage.waitForURL('**/dashboard');

  console.log('[Faculty] Navigating to /attendance...');
  await facultyPage.goto('http://localhost:5173/attendance', { waitUntil: 'networkidle' });
  await facultyPage.waitForSelector('table');

  // Faculty generates Session PIN
  const pinBtn = facultyPage.locator('button:has-text("Session PIN"), button:has-text("Regenerate PIN")').first();
  await pinBtn.click();
  console.log('[Faculty] Clicked Session PIN button.');

  // Wait for the active PIN banner to appear and extract the PIN
  const pinHeader = facultyPage.locator('h3.font-mono').first();
  await pinHeader.waitFor({ state: 'visible', timeout: 8000 });
  const generatedPin = (await pinHeader.textContent()).trim();
  console.log(`[Faculty] Live PIN displayed on projector banner: "${generatedPin}"`);

  // CONTEXT 2: Student
  const studentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const studentPage = await studentContext.newPage();

  console.log('\n[Student] Logging in via /login/student as student.alex@college.edu...');
  await studentPage.goto('http://localhost:5173/login/student', { waitUntil: 'networkidle' });
  await studentPage.fill('input[type="email"]', 'student.alex@college.edu');
  await studentPage.fill('input[type="password"]', 'Password@123');
  await studentPage.click('button[type="submit"]');
  await studentPage.waitForURL('**/dashboard');
  await studentPage.waitForLoadState('networkidle');
  console.log('[Student] Reached Student Dashboard.');

  // Print current page titles and headings
  const headings = await studentPage.locator('h1, h2').allTextContents();
  console.log('[Student] Headings found on page:', headings);

  // Take debug screenshot of what student page looks like
  await studentPage.screenshot({ path: 'scripts/test-artifacts/student_debug.png' });

  // Verify Live Lecture Check-In Widget is visible on student dashboard
  const checkInWidget = studentPage.locator('text=Live Lecture Check-In').first();
  await checkInWidget.waitFor({ state: 'visible', timeout: 15000 });
  console.log('[Student] Live Lecture Check-In widget is visible on dashboard.');

  // Student inputs the PIN
  const pinInput = studentPage.locator('input[placeholder="000-000"]');
  await pinInput.fill(generatedPin);
  console.log(`[Student] Typed Session PIN "${generatedPin}".`);

  // Student clicks Submit
  const submitBtn = studentPage.locator('button:has-text("Submit Session PIN")');
  await submitBtn.click();
  console.log('[Student] Clicked Submit Session PIN.');

  // Wait for Attendance Confirmed card
  const confirmMsg = studentPage.locator('text=Attendance Confirmed! Marked PRESENT');
  await confirmMsg.waitFor({ state: 'visible', timeout: 15000 });
  console.log('✓ [Student] Attendance Confirmed card displayed successfully!');

  // Take screenshot of student dashboard with verified check-in
  await studentPage.screenshot({ path: 'scripts/test-artifacts/student_pin_checkin_success.png', fullPage: true });
  console.log('✓ Saved screenshot to scripts/test-artifacts/student_pin_checkin_success.png');

  // Verify student attendance page also has the widget
  console.log('\n[Student] Navigating to /attendance...');
  await studentPage.goto('http://localhost:5173/attendance', { waitUntil: 'networkidle' });
  await studentPage.waitForSelector('h2:has-text("Live Lecture Check-In")');
  console.log('✓ [Student] Live Lecture Check-In widget also verified on student /attendance page.');

  await browser.close();
  console.log('\nAll Playwright Student PIN Check-In tests passed cleanly!');
}

runStudentPinCheckInTest().catch((err) => {
  console.error('Playwright test failed:', err);
  process.exit(1);
});
