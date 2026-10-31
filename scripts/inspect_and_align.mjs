import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('test-artifacts/playwright-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runVisualAlignmentAudit() {
  console.log('====================================================');
  console.log(' PLAYWRIGHT VISUAL ALIGNMENT & RESPONSIVENESS AUDIT');
  console.log(' Target Frontend: http://localhost:5173');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const alignmentIssues = [];

  async function checkPageAlignment(pageName, url) {
    console.log(`Checking ${pageName} (${url})...`);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 1. Check for unintended horizontal scroll (page overflow)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    if (scrollWidth > clientWidth + 2) {
      alignmentIssues.push({
        page: pageName,
        issue: `Horizontal page overflow detected: content width (${scrollWidth}px) exceeds viewport (${clientWidth}px)`,
      });
      console.warn(`  [ALIGNMENT WARNING] Horizontal overflow on ${pageName}: ${scrollWidth}px > ${clientWidth}px`);
    } else {
      console.log(`  [PASS] No horizontal page overflow (${clientWidth}px)`);
    }

    // 2. Check main containers and cards alignment
    const cards = await page.$$('.card-stitch, table, .badge-mono');
    console.log(`  [INFO] Analyzed ${cards.length} key structural components on ${pageName}`);

    // Capture screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, `${pageName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_desktop.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`  [SCREENSHOT] Saved screenshot: ${screenshotPath}`);
  }

  try {
    // 1. Login Page
    await checkPageAlignment('Login_Page', 'http://localhost:5173/login');

    // 2. Perform Login as Admin
    console.log('\nLogging in as Admin (admin@college.edu)...');
    await page.fill('input[type="email"]', 'admin@college.edu');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('  [PASS] Successfully authenticated and navigated to Dashboard');

    // 3. Admin Dashboard
    await checkPageAlignment('Dashboard', 'http://localhost:5173/dashboard');

    // 4. Students Directory
    await checkPageAlignment('Students_Directory', 'http://localhost:5173/students');

    // 5. Faculty Workload
    await checkPageAlignment('Faculty_Workload', 'http://localhost:5173/faculty');

    // 6. Course Catalog
    await checkPageAlignment('Courses_Catalog', 'http://localhost:5173/courses');

    // 7. Course Registration / Enrollments
    await checkPageAlignment('Course_Enrollment', 'http://localhost:5173/enrollments');

    // 8. Lecture Roll Call / Attendance
    await checkPageAlignment('Attendance_RollCall', 'http://localhost:5173/attendance');

    // 9. Academic Departments
    await checkPageAlignment('Departments', 'http://localhost:5173/departments');

    // 10. Notices & Circulars
    await checkPageAlignment('Notices', 'http://localhost:5173/notices');

    // Mobile Viewport Check (390 x 844 iPhone 14 style)
    console.log('\n--- Checking Mobile Viewport Alignment (390 x 844) ---');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/enrollments', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const mobileScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const mobileClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    if (mobileScrollWidth > mobileClientWidth + 2) {
      alignmentIssues.push({
        page: 'Enrollments_Mobile',
        issue: `Mobile horizontal overflow: ${mobileScrollWidth}px > ${mobileClientWidth}px`,
      });
      console.warn(`  [ALIGNMENT WARNING] Mobile overflow on Enrollments: ${mobileScrollWidth}px > ${mobileClientWidth}px`);
    } else {
      console.log(`  [PASS] Mobile enrollments layout fits viewport cleanly (${mobileClientWidth}px)`);
    }

    const mobileScreenshot = path.join(SCREENSHOT_DIR, 'enrollments_mobile.png');
    await page.screenshot({ path: mobileScreenshot, fullPage: true });

    console.log('\n====================================================');
    console.log(` PLAYWRIGHT AUDIT COMPLETE: ${alignmentIssues.length} ISSUES FOUND`);
    console.log('====================================================');
    if (alignmentIssues.length > 0) {
      console.log(JSON.stringify(alignmentIssues, null, 2));
    }

  } catch (err) {
    console.error('Playwright execution error:', err);
  } finally {
    await browser.close();
  }
}

runVisualAlignmentAudit();
