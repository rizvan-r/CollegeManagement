import { query, pool } from './config/db.js';

async function auditSchemaAndDataHandling() {
  console.log('====================================================');
  console.log(' DATABASE SCHEMA & DATA HANDLING AUDIT');
  console.log(' Target: Neon Remote PostgreSQL');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, label, detail = '') {
    total++;
    if (condition) {
      console.log(`  [PASS] ${label}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${label}`);
      if (detail) console.error(`         Detail: ${detail}`);
    }
  }

  try {
    // 1. Table Inventory & Physical Structure
    console.log('--- 1. Table Inventory & Extension Audit ---');
    const extRes = await query("SELECT extname FROM pg_extension WHERE extname = 'pgcrypto'");
    assert(extRes.rows.length > 0, "Extension 'pgcrypto' active for UUID generation");

    const expectedTables = [
      'users',
      'departments',
      'academic_years',
      'faculty',
      'students',
      'courses',
      'course_assignments',
      'enrollments',
      'attendance_sessions',
      'attendance_records',
      'notices',
      'audit_logs',
    ];

    const tablesRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const existingTables = tablesRes.rows.map(r => r.table_name);

    for (const t of expectedTables) {
      assert(existingTables.includes(t), `Table '${t}' exists in public schema`);
    }

    // 2. Foreign Key Referential Integrity Check
    console.log('\n--- 2. Foreign Key & Constraint Integrity ---');
    const fkRes = await query(`
      SELECT
        tc.table_name, kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `);

    assert(fkRes.rows.length >= 10, `Active Foreign Keys verified in schema (${fkRes.rows.length} FK constraints detected)`);

    // Check specific critical FK rules
    const userStudentCascade = fkRes.rows.find(r => r.table_name === 'students' && r.column_name === 'user_id');
    assert(userStudentCascade && userStudentCascade.delete_rule === 'CASCADE', "students.user_id has ON DELETE CASCADE constraint");

    const userFacultyCascade = fkRes.rows.find(r => r.table_name === 'faculty' && r.column_name === 'user_id');
    assert(userFacultyCascade && userFacultyCascade.delete_rule === 'CASCADE', "faculty.user_id has ON DELETE CASCADE constraint");

    const sessionRecordCascade = fkRes.rows.find(r => r.table_name === 'attendance_records' && r.column_name === 'session_id');
    assert(sessionRecordCascade && sessionRecordCascade.delete_rule === 'CASCADE', "attendance_records.session_id has ON DELETE CASCADE constraint");

    // 3. Unique Constraints (Duplicate Prevention)
    console.log('\n--- 3. Unique Constraints Audit ---');
    const uqRes = await query(`
      SELECT tc.table_name, tc.constraint_name
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
    `);
    const uqNames = uqRes.rows.map(r => r.constraint_name);

    assert(uqNames.some(n => n.includes('users_email')), 'users.email UNIQUE constraint present');
    assert(uqNames.some(n => n.includes('departments_code')), 'departments.code UNIQUE constraint present');
    assert(uqNames.some(n => n.includes('students_admission_number')), 'students.admission_number UNIQUE constraint present');
    assert(uqNames.some(n => n.includes('courses_code')), 'courses.code UNIQUE constraint present');
    assert(uqNames.some(n => n.includes('unique_student_course_enrollment') || n.includes('enrollments_student_id')), 'enrollments(student_id, course_assignment_id) composite UNIQUE constraint present');
    assert(uqNames.some(n => n.includes('unique_session_student') || n.includes('attendance_records_session_id')), 'attendance_records(session_id, student_id) composite UNIQUE constraint present');

    // 4. Data Hygiene & Orphan Records Audit
    console.log('\n--- 4. Data Hygiene & Orphan Records Audit ---');
    // A: Check for orphan students (students without valid user)
    const orphanStu = await query(`
      SELECT s.id, s.admission_number 
      FROM students s 
      LEFT JOIN users u ON u.id = s.user_id 
      WHERE u.id IS NULL
    `);
    assert(orphanStu.rows.length === 0, `Orphan student records: ${orphanStu.rows.length} detected`);

    // B: Check for orphan faculty (faculty without valid user)
    const orphanFac = await query(`
      SELECT f.id, f.first_name 
      FROM faculty f 
      LEFT JOIN users u ON u.id = f.user_id 
      WHERE u.id IS NULL
    `);
    assert(orphanFac.rows.length === 0, `Orphan faculty records: ${orphanFac.rows.length} detected`);

    // C: Check for orphan enrollments
    const orphanEnr = await query(`
      SELECT e.id 
      FROM enrollments e 
      LEFT JOIN students s ON s.id = e.student_id 
      LEFT JOIN course_assignments ca ON ca.id = e.course_assignment_id 
      WHERE s.id IS NULL OR ca.id IS NULL
    `);
    assert(orphanEnr.rows.length === 0, `Orphan enrollment records: ${orphanEnr.rows.length} detected`);

    // D: Check for orphan attendance records
    const orphanAtt = await query(`
      SELECT r.id 
      FROM attendance_records r 
      LEFT JOIN attendance_sessions s ON s.id = r.session_id 
      LEFT JOIN students st ON st.id = r.student_id 
      WHERE s.id IS NULL OR st.id IS NULL
    `);
    assert(orphanAtt.rows.length === 0, `Orphan attendance records: ${orphanAtt.rows.length} detected`);

    // 5. Check Constraints Audit (Value Boundaries)
    console.log('\n--- 5. Check Constraints & Value Bounds ---');
    const chkRes = await query(`
      SELECT constraint_name, check_clause 
      FROM information_schema.check_constraints
      WHERE constraint_schema = 'public'
    `);
    const chkClauses = chkRes.rows.map(r => r.check_clause);

    assert(chkClauses.some(c => c.includes('current_semester') && c.includes('12')), 'Semester boundary check constraint verified (1 to 12)');
    assert(chkClauses.some(c => c.includes('credits') && c.includes('10')), 'Course credits boundary check constraint verified (1 to 10)');
    assert(chkClauses.some(c => c.includes('period_number') && c.includes('10')), 'Period number boundary check constraint verified (1 to 10)');

    // 6. Performance Indexing Audit
    console.log('\n--- 6. Performance Indexing Audit ---');
    const idxRes = await query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    const indexNames = idxRes.rows.map(r => r.indexname);

    assert(indexNames.includes('idx_users_role'), "Index 'idx_users_role' exists on users");
    assert(indexNames.includes('idx_students_dept'), "Index 'idx_students_dept' exists on students");
    assert(indexNames.includes('idx_enrollments_student'), "Index 'idx_enrollments_student' exists on enrollments");
    assert(indexNames.includes('idx_attendance_session'), "Index 'idx_attendance_session' exists on attendance_records");
    assert(indexNames.includes('idx_sessions_assignment_date'), "Composite Index 'idx_sessions_assignment_date' exists on attendance_sessions");

    console.log('\n====================================================');
    console.log(` SCHEMA & DATA AUDIT: ${passed}/${total} CHECKS PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log('====================================================');

    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal schema audit error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

auditSchemaAndDataHandling();
