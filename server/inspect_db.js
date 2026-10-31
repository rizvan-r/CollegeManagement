import { query, pool } from './config/db.js';

async function check() {
  try {
    const tables = [
      'departments',
      'users',
      'faculty',
      'students',
      'courses',
      'course_assignments',
      'enrollments',
      'attendance_sessions',
      'attendance_records',
      'notices',
    ];

    console.log('=== Neon PostgreSQL Table Rows ===');
    for (const t of tables) {
      const res = await query(`SELECT COUNT(*)::int as count FROM ${t}`);
      console.log(`${t.padEnd(22)}: ${res.rows[0].count}`);
    }

    console.log('\n=== Course Assignments ===');
    const caRes = await query(`
      SELECT ca.id, ca.section, c.code as course_code, c.title as course_title,
             f.first_name, f.last_name, ca.academic_year_id
      FROM course_assignments ca
      JOIN courses c ON c.id = ca.course_id
      JOIN faculty f ON f.id = ca.faculty_id
    `);
    console.log(JSON.stringify(caRes.rows, null, 2));

    console.log('\n=== Students ===');
    const stuRes = await query(`
      SELECT s.id, s.admission_number, s.first_name, s.last_name, s.current_semester, d.code as dept_code
      FROM students s
      JOIN departments d ON d.id = s.department_id
    `);
    console.log(JSON.stringify(stuRes.rows, null, 2));

    console.log('\n=== Enrollments ===');
    const enrRes = await query(`
      SELECT e.id, e.student_id, e.course_assignment_id, s.admission_number, c.code as course_code
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN course_assignments ca ON ca.id = e.course_assignment_id
      JOIN courses c ON c.id = ca.course_id
    `);
    console.log(JSON.stringify(enrRes.rows, null, 2));

  } catch (err) {
    console.error('Error querying db:', err);
  } finally {
    await pool.end();
  }
}

check();
