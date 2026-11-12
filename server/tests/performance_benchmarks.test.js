const BASE_URL = 'http://localhost:5000/api/v1';

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const start = performance.now();
  const res = await fetch(url, options);
  const duration = performance.now() - start;
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, duration, data: json };
}

async function login(email, password = 'Password@123') {
  const res = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-bypass-rate-limit': 'test-suite' },
    body: JSON.stringify({ email, password }),
  });
  return res.data.token;
}

function calculatePercentiles(durations) {
  const sorted = [...durations].sort((a, b) => a - b);
  const min = Math.round(sorted[0]);
  const p50 = Math.round(sorted[Math.floor(sorted.length * 0.5)]);
  const p95 = Math.round(sorted[Math.floor(sorted.length * 0.95)]);
  const p99 = Math.round(sorted[Math.floor(sorted.length * 0.99)]);
  const max = Math.round(sorted[sorted.length - 1]);
  const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
  return { min, p50, p95, p99, max, avg };
}

async function runBenchmarks() {
  console.log('====================================================');
  console.log(' CMP API PERFORMANCE & LATENCY PROFILER');
  console.log(' Remote Neon PostgreSQL & Express REST Engine');
  console.log('====================================================\n');

  // Authenticate tokens
  const studentToken = await login('student.alex@college.edu');
  const facultyToken = await login('faculty.alan@college.edu');
  const hodToken = await login('hod.cse@college.edu');
  const adminToken = await login('admin@college.edu');

  const benchmarkEndpoints = [
    { name: 'Health Check', path: '/health', headers: {} },
    { name: 'Student Dashboard', path: '/dashboard/student', headers: { Authorization: `Bearer ${studentToken}` } },
    { name: 'Student Profile', path: '/students/profile', headers: { Authorization: `Bearer ${studentToken}` } },
    { name: 'Student Enrollments', path: '/enrollments/my', headers: { Authorization: `Bearer ${studentToken}` } },
    { name: 'Student Attendance', path: '/attendance/my', headers: { Authorization: `Bearer ${studentToken}` } },
    { name: 'Faculty Dashboard', path: '/dashboard/faculty', headers: { Authorization: `Bearer ${facultyToken}` } },
    { name: 'Faculty Courses', path: '/faculty/courses', headers: { Authorization: `Bearer ${facultyToken}` } },
    { name: 'Attendance Assignments', path: '/attendance/assignments', headers: { Authorization: `Bearer ${facultyToken}` } },
    { name: 'HOD Dashboard', path: '/hod/dashboard', headers: { Authorization: `Bearer ${hodToken}` } },
    { name: 'HOD Faculty List', path: '/hod/faculty', headers: { Authorization: `Bearer ${hodToken}` } },
    { name: 'HOD Students List', path: '/hod/students', headers: { Authorization: `Bearer ${hodToken}` } },
    { name: 'HOD Attendance Overview', path: '/hod/attendance', headers: { Authorization: `Bearer ${hodToken}` } },
    { name: 'HOD Requests List', path: '/hod/requests', headers: { Authorization: `Bearer ${hodToken}` } },
    { name: 'Admin Dashboard', path: '/admin/dashboard', headers: { Authorization: `Bearer ${adminToken}` } },
    { name: 'Departments List', path: '/departments', headers: { Authorization: `Bearer ${adminToken}` } },
    { name: 'Courses List', path: '/courses', headers: { Authorization: `Bearer ${adminToken}` } },
    { name: 'Admin Users List', path: '/admin/users', headers: { Authorization: `Bearer ${adminToken}` } },
    { name: 'Admin Attendance Reports', path: '/admin/attendance/reports', headers: { Authorization: `Bearer ${adminToken}` } },
    { name: 'Notifications History', path: '/notifications?limit=20', headers: { Authorization: `Bearer ${studentToken}` } },
    { name: 'Notification Preferences', path: '/notifications/preferences', headers: { Authorization: `Bearer ${studentToken}` } },
  ];

  const results = [];
  const WARMUP_RUNS = 1;
  const SAMPLE_RUNS = 4;

  console.log(`Profiling ${benchmarkEndpoints.length} endpoints (${SAMPLE_RUNS} runs each)...`);

  for (const ep of benchmarkEndpoints) {
    // Warmup
    for (let i = 0; i < WARMUP_RUNS; i++) {
      await request(ep.path, { headers: ep.headers });
    }

    const durations = [];
    for (let i = 0; i < SAMPLE_RUNS; i++) {
      const res = await request(ep.path, { headers: ep.headers });
      if (res.status !== 200) {
        console.warn(`Endpoint ${ep.name} returned status ${res.status}`);
      }
      durations.push(res.duration);
    }

    const stats = calculatePercentiles(durations);
    results.push({ name: ep.name, path: ep.path, ...stats });
    console.log(`  ✓ ${ep.name.padEnd(26)} Avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | Max: ${stats.max}ms`);
  }

  console.log('\n====================================================');
  console.log(' LATENCY BENCHMARK SUMMARY TABLE (ms)');
  console.log('====================================================');
  console.log('| Endpoint Name              | p50 (ms) | p95 (ms) | Avg (ms) | Max (ms) | Status |');
  console.log('|----------------------------|----------|----------|----------|----------|--------|');
  for (const r of results) {
    const status = r.p95 < 300 ? 'EXCELLENT' : r.p95 < 600 ? 'GOOD' : 'FAIR';
    console.log(`| ${r.name.padEnd(26)} | ${String(r.p50).padStart(8)} | ${String(r.p95).padStart(8)} | ${String(r.avg).padStart(8)} | ${String(r.max).padStart(8)} | ${status.padEnd(6)} |`);
  }
  console.log('====================================================\n');
}

runBenchmarks().catch((err) => {
  console.error('\n❌ Benchmark profiler error:', err);
  process.exit(1);
});

