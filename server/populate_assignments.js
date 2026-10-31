import { query, pool } from './config/db.js';

async function populate() {
  try {
    const res = await query(`
      INSERT INTO course_assignments (id, course_id, faculty_id, academic_year_id, section)
      VALUES 
        ('ca111111-1111-1111-1111-111111111102', 'c1111111-1111-1111-1111-111111111102', 'f1111111-1111-1111-1111-111111111103', 'a0000000-0000-0000-0000-000000000001', 'A'),
        ('ca111111-1111-1111-1111-111111111103', 'c1111111-1111-1111-1111-111111111103', 'f1111111-1111-1111-1111-111111111101', 'a0000000-0000-0000-0000-000000000001', 'A')
      ON CONFLICT (course_id, academic_year_id, section) DO NOTHING
      RETURNING *;
    `);
    console.log('Assignments added:', res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

populate();
