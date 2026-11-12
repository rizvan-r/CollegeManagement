import { query, withTransaction, pool } from '../config/db.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(message);
  }
  passed++;
  console.log(`  ✓ PASSED: ${message}`);
}

async function runDatabaseTests() {
  console.log('====================================================');
  console.log(' CMP DATABASE INTEGRITY & TRANSACTION TEST SUITE');
  console.log('====================================================\n');

  // --- 1. Primary Key Uniqueness ---
  console.log('[TEST 1] Primary Key Uniqueness Constraint...');
  let pkRejected = false;
  try {
    await query(
      `INSERT INTO users (id, email, password_hash, role)
       VALUES ('11111111-1111-1111-1111-111111111101', 'duplicate.admin@college.edu', 'hash', 'ADMIN')`
    );
  } catch (err) {
    if (err.code === '23505') { // PostgreSQL unique_violation
      pkRejected = true;
    }
  }
  assert(pkRejected, 'Duplicate Primary Key ID correctly rejected by PostgreSQL (code 23505)');

  // --- 2. Foreign Key Constraint Enforcement ---
  console.log('\n[TEST 2] Foreign Key Constraint Enforcement...');
  let fkRejected = false;
  try {
    await query(
      `INSERT INTO students (id, user_id, admission_number, first_name, last_name, dob, gender, department_id, academic_year_id, current_semester)
       VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'CMP-INVALID-99', 'Ghost', 'Student', '2004-01-01', 'Male', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 1)`
    );
  } catch (err) {
    if (err.code === '23503') { // PostgreSQL foreign_key_violation
      fkRejected = true;
    }
  }
  assert(fkRejected, 'Non-existent user_id foreign key correctly rejected by PostgreSQL (code 23503)');

  // --- 3. Unique Composite Constraints ---
  console.log('\n[TEST 3] Composite Unique Constraints (Duplicate Enrollment)...');
  // Attempt duplicate enrollment for existing enrollment
  const existingEnr = await query('SELECT student_id, course_assignment_id FROM enrollments LIMIT 1');
  let duplicateRejected = false;
  if (existingEnr.rows.length > 0) {
    const { student_id, course_assignment_id } = existingEnr.rows[0];
    try {
      await query(
        `INSERT INTO enrollments (id, student_id, course_assignment_id, status)
         VALUES (gen_random_uuid(), $1, $2, 'ENROLLED')`,
        [student_id, course_assignment_id]
      );
    } catch (err) {
      if (err.code === '23505') {
        duplicateRejected = true;
      }
    }
  }
  assert(duplicateRejected, 'Duplicate student course enrollment rejected by unique composite constraint');

  // --- 4. Transaction Rollback Integrity ---
  console.log('\n[TEST 4] Database Atomic Transaction Rollback...');
  const rollbackCode = `TX${Date.now().toString().slice(-6)}`;
  let rolledBackProperly = false;

  try {
    await withTransaction(async (client) => {
      // Step 1: Insert department
      await client.query(
        `INSERT INTO departments (code, name, building, established_year)
         VALUES ($1, 'Temporary Department', 'Block X', 2026)`,
        [rollbackCode]
      );

      // Step 2: Intentionally trigger unhandled error to force abort
      throw new Error('INTENTIONAL_SIMULATED_TRANSACTION_FAILURE');
    });
  } catch (txErr) {
    console.log('    [Transaction Caught Error]:', txErr.message);
    if (txErr.message === 'INTENTIONAL_SIMULATED_TRANSACTION_FAILURE') {
      // Verify in DB that Step 1 was not persisted
      const verifyCheck = await query('SELECT id FROM departments WHERE code = $1', [rollbackCode]);
      rolledBackProperly = verifyCheck.rows.length === 0;
    }
  }
  assert(rolledBackProperly, 'Multi-statement transaction aborted and rolled back completely without data pollution');

  // --- 5. Audit Log Table Consistency ---
  console.log('\n[TEST 5] Audit Logs Integrity & Schema...');
  const auditRes = await query(`
    SELECT id, action, entity_name, entity_id, created_at 
    FROM audit_logs 
    ORDER BY created_at DESC 
    LIMIT 10
  `);
  assert(Array.isArray(auditRes.rows) && auditRes.rows.length > 0, 'Audit logs records retrieved from database');
  const sampleLog = auditRes.rows[0];
  assert(Boolean(sampleLog.action && sampleLog.entity_name && sampleLog.created_at), 'Audit logs preserve action, entity name, and timestamp');

  // --- 6. Notification Ownership & Referential Integrity ---
  console.log('\n[TEST 6] Notification Ownership Integrity...');
  const notifOrphanCheck = await query(`
    SELECT n.id 
    FROM notifications n 
    LEFT JOIN users u ON u.id = n.user_id 
    WHERE u.id IS NULL
  `);
  assert(notifOrphanCheck.rows.length === 0, 'Zero orphaned notification records (referential integrity validated)');

  console.log('\n====================================================');
  console.log(` 🎉 DATABASE INTEGRITY AUDIT COMPLETE: ${passed}/${total} TESTS PASSED!`);
  console.log('====================================================');

  await pool.end();
}

runDatabaseTests().catch((err) => {
  console.error('\n❌ Database integrity test suite failed:', err);
  process.exit(1);
});
