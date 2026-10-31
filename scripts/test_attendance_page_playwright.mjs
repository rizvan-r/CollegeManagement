import { chromium } from 'playwright';

async function runPlaywrightAttendanceTest() {
  console.log('Launching browser to test Attendance Submit & Update UI...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Login as Faculty
  console.log('Navigating to login page...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'faculty.alan@college.edu');
  await page.fill('input[type="password"]', 'Password@123');
  await page.click('button[type="submit"]');

  // Wait for dashboard navigation
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('✓ Logged in as Faculty, dashboard reached.');

  // 2. Navigate to Attendance Page
  console.log('Navigating to /attendance...');
  await page.goto('http://localhost:5173/attendance', { waitUntil: 'networkidle' });
  await page.waitForSelector('table', { timeout: 10000 });
  console.log('✓ Attendance page loaded with roster table.');

  // 3. Verify Header Submit Button
  const headerBtn = page.locator('button:has-text("Submit")').first();
  await headerBtn.waitFor({ state: 'visible', timeout: 5000 });
  const headerBtnText = await headerBtn.textContent();
  console.log('✓ Top Header Submit Button verified:', headerBtnText.trim());

  // 4. Verify Toolbar Submit Button
  const toolbarSubmitBtn = page.locator('button:has-text("Submit Update for Current Session"), button:has-text("Submit Attendance")').first();
  await toolbarSubmitBtn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✓ Toolbar Submit Button verified:', (await toolbarSubmitBtn.textContent()).trim());

  // 5. Verify Bottom Table Action Bar
  const bottomSubmitBtn = page.locator('div:has-text("Current Session") button:has-text("Submit")').last();
  await bottomSubmitBtn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✓ Table Bottom Action Footer Submit Button verified:', (await bottomSubmitBtn.textContent()).trim());

  // 6. Test interaction: Click "Mark All Present"
  const markAllBtn = page.locator('button:has-text("Mark All Present")').first();
  await markAllBtn.click();
  console.log('✓ Clicked "Mark All Present".');

  // 7. Click Submit Update / Submit Attendance
  await bottomSubmitBtn.click();
  console.log('✓ Clicked Submit button at bottom of roster table.');

  // 8. Wait for success notification
  const successNotice = page.locator('div:has-text("successfully")').first();
  await successNotice.waitFor({ state: 'visible', timeout: 8000 });
  console.log('✓ Success notification appeared:', (await successNotice.textContent()).trim());

  // Take screenshot for visual confirmation
  await page.screenshot({ path: 'scripts/test-artifacts/attendance_submit_update.png', fullPage: true });
  console.log('✓ Full page screenshot saved to scripts/test-artifacts/attendance_submit_update.png');

  await browser.close();
  console.log('Playwright test completed successfully!');
}

runPlaywrightAttendanceTest().catch((err) => {
  console.error('Playwright test failed:', err);
  process.exit(1);
});
