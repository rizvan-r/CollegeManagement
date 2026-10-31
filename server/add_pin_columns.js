import { query, pool } from './config/db.js';

async function migrate() {
  try {
    console.log('Adding session_pin and pin_expires_at columns to attendance_sessions...');
    await query(`
      ALTER TABLE attendance_sessions 
      ADD COLUMN IF NOT EXISTS session_pin VARCHAR(10),
      ADD COLUMN IF NOT EXISTS pin_expires_at TIMESTAMP WITH TIME ZONE;
    `);
    console.log('✓ Migration succeeded: session_pin and pin_expires_at columns verified.');

    const colRes = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'attendance_sessions'
      ORDER BY ordinal_position;
    `);
    console.log('Columns in attendance_sessions:');
    colRes.rows.forEach((c) => console.log(` - ${c.column_name}: ${c.data_type}`));
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();
