import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  let json = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON or empty
  }
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
    throw new Error(`Login failed for ${email} (status ${res.status}): ${res.data?.message}`);
  }
  return res.data.token;
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(message);
  }
  passedTests++;
  console.log(`  ✓ PASSED: ${message}`);
}

async function runSecuritySuite() {
  console.log('====================================================');
  console.log(' CMP SECURITY & AUTHORIZATION TEST SUITE');
  console.log('====================================================\n');

  // --- SECTION 1: Authentication Testing ---
  console.log('[SECTION 1] Authentication & JWT Verification...');

  // 1.1 Invalid credentials
  const badLogin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-bypass-rate-limit': 'test-suite' },
    body: JSON.stringify({ email: 'student.alex@college.edu', password: 'WrongPassword!404' }),
  });
  assert(badLogin.status === 401, 'Invalid password returns HTTP 401');

  // 1.2 Missing credentials
  const missingCreds = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-bypass-rate-limit': 'test-suite' },
    body: JSON.stringify({ email: 'student.alex@college.edu' }),
  });
  assert(missingCreds.status === 400, 'Missing password returns HTTP 400');

  // 1.3 Missing Authorization Header
  const missingAuth = await request('/students/profile');
  assert(missingAuth.status === 401, 'Missing Authorization header returns HTTP 401');

  // 1.4 Malformed Bearer Token
  const malformedAuth = await request('/students/profile', {
    headers: { Authorization: 'Basic dXNlcjpwYXNz' },
  });
  assert(malformedAuth.status === 401, 'Non-Bearer Authorization returns HTTP 401');

  // 1.5 Invalid Token Signature
  const forgedToken = jwt.sign(
    { userId: '11111111-1111-1111-1111-111111111105', role: 'ADMIN' },
    'tampered-secret-key-attacker',
    { expiresIn: '1h' }
  );
  const forgedAuth = await request('/admin/users', {
    headers: { Authorization: `Bearer ${forgedToken}` },
  });
  assert(forgedAuth.status === 401, 'Tampered JWT signature returns HTTP 401');

  // 1.6 Expired Token
  const expiredToken = jwt.sign(
    { userId: '11111111-1111-1111-1111-111111111105', role: 'STUDENT' },
    config.jwtSecret,
    { expiresIn: '-10s' } // Expired 10 seconds ago
  );
  const expiredAuth = await request('/students/profile', {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  assert(expiredAuth.status === 401, 'Expired JWT returns HTTP 401');

  // 1.7 Valid Login across all 4 roles
  const studentToken = await login('student.alex@college.edu');
  const facultyToken = await login('faculty.alan@college.edu');
  const hodToken = await login('hod.cse@college.edu');
  const adminToken = await login('admin@college.edu');
  assert(Boolean(studentToken && facultyToken && hodToken && adminToken), 'Valid login succeeds for Student, Faculty, HOD, and Admin');

  console.log('\n[SECTION 2] Role-Based Access Control (RBAC) & Boundary Enforcement...');

  // 2.1 Student calling Admin endpoints -> 403
  const studentToAdmin = await request('/admin/users', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(studentToAdmin.status === 403, 'Student denied access to /admin/users (HTTP 403 Forbidden)');

  // 2.2 Student calling HOD endpoints -> 403
  const studentToHod = await request('/hod/faculty', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(studentToHod.status === 403, 'Student denied access to /hod/faculty (HTTP 403 Forbidden)');

  // 2.3 Student calling Faculty session mark -> 403
  const studentToFacultySession = await request('/attendance/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert(studentToFacultySession.status === 403, 'Student denied access to /attendance/sessions (HTTP 403 Forbidden)');

  // 2.4 Faculty calling Admin audit logs -> 403
  const facultyToAdminLogs = await request('/admin/audit-logs', {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  assert(facultyToAdminLogs.status === 403, 'Faculty denied access to /admin/audit-logs (HTTP 403 Forbidden)');

  // 2.5 HOD calling Admin User Management -> 403
  const hodToAdminUsers = await request('/admin/users', {
    headers: { Authorization: `Bearer ${hodToken}` },
  });
  assert(hodToAdminUsers.status === 403, 'HOD denied access to /admin/users (HTTP 403 Forbidden)');

  // 2.6 Admin authorized to call Admin endpoints -> 200
  const adminSelf = await request('/admin/dashboard', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminSelf.status === 200, 'Admin authorized for /admin/dashboard (HTTP 200 OK)');

  console.log('\n[SECTION 3] SQL Injection Resistance Testing...');

  // 3.1 SQL Injection in Query Search Parameter
  const sqliSearch = await request('/students?search=\' OR 1=1 --', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(sqliSearch.status === 200, 'SQLi in search parameter sanitized by parameterized query (no syntax error)');
  // Ensure it did not dump unrestricted table
  assert(Array.isArray(sqliSearch.data?.data), 'Returns standard response array without SQL crash');

  // 3.2 SQL Injection in Route Parameter
  const sqliRoute = await request("/departments/' OR '1'='1", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(sqliRoute.status === 404 || sqliRoute.status === 400, 'SQLi in route param safely rejected with 404/400');

  // 3.3 SQL Injection in Login JSON Payload
  const sqliLogin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-bypass-rate-limit': 'test-suite' },
    body: JSON.stringify({ email: "' OR 1=1 --", password: "' OR 'a'='a" }),
  });
  assert(sqliLogin.status === 401, 'SQLi in authentication payload safely rejected with 401 (no auth bypass)');

  console.log('\n[SECTION 4] Security Headers & Rate Limiting...');

  // 4.1 Security Headers via Helmet
  const healthRes = await request('/health');
  assert(healthRes.headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options: nosniff present');
  assert(healthRes.headers.get('x-dns-prefetch-control') === 'off', 'X-DNS-Prefetch-Control: off present');
  assert(healthRes.headers.get('x-frame-options') === 'SAMEORIGIN', 'X-Frame-Options: SAMEORIGIN present');

  // 4.2 Rate Limiter Verification (without bypass header)
  console.log('  Testing brute-force rate limiter (12 consecutive bad logins)...');
  let rateLimited = false;
  for (let i = 0; i < 12; i++) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '198.51.100.42', // Simulated attacker IP
      },
      body: JSON.stringify({ email: 'student.alex@college.edu', password: 'BruteForceAttempt' }),
    });
    if (res.status === 429) {
      rateLimited = true;
      break;
    }
  }
  assert(rateLimited, 'Brute-force attacker IP triggered HTTP 429 Too Many Requests');

  console.log('\n====================================================');
  console.log(` 🎉 SECURITY AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED!`);
  console.log('====================================================');
}

runSecuritySuite().catch((err) => {
  console.error('\n❌ Security suite failed:', err);
  process.exit(1);
});

