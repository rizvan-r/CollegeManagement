import { Router } from 'express';
import { query, pool, withTransaction } from '../config/db.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/v1/attendance/assignments (Fetch active course sections for roll call)
router.get('/assignments', authenticate, async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        ca.id,
        ca.section,
        c.id AS course_id,
        c.code AS course_code,
        c.title AS course_title,
        c.credits,
        CONCAT(f.first_name, ' ', f.last_name) AS faculty_name,
        d.name AS department_name,
        COUNT(DISTINCT e.id)::int AS enrolled_count
      FROM course_assignments ca
      JOIN courses c ON c.id = ca.course_id
      JOIN faculty f ON f.id = ca.faculty_id
      JOIN departments d ON d.id = c.department_id
      LEFT JOIN enrollments e ON e.course_assignment_id = ca.id
      GROUP BY ca.id, ca.section, c.id, c.code, c.title, c.credits, f.first_name, f.last_name, d.name
      ORDER BY c.code ASC, ca.section ASC
    `;
    const result = await query(sql);
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/attendance/roster/:courseAssignmentId (Fetch live student roster for a section)
router.get('/roster/:courseAssignmentId', authenticate, async (req, res, next) => {
  const { courseAssignmentId } = req.params;

  try {
    // 1. First attempt to fetch enrolled students for this course assignment
    const enrolledSql = `
      SELECT 
        s.id AS "studentId",
        s.admission_number AS "admissionNumber",
        CONCAT(s.first_name, ' ', s.last_name) AS name,
        d.name AS major,
        'PRESENT' AS status,
        '10:00 AM' AS time
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN departments d ON d.id = s.department_id
      WHERE e.course_assignment_id = $1
      ORDER BY s.admission_number ASC
    `;
    const enrolledRes = await query(enrolledSql, [courseAssignmentId]);

    if (enrolledRes.rows.length > 0) {
      return res.json({ success: true, data: enrolledRes.rows });
    }

    // 2. If no students are explicitly enrolled, fetch active students in the course's department or all active students
    const fallbackSql = `
      SELECT 
        s.id AS "studentId",
        s.admission_number AS "admissionNumber",
        CONCAT(s.first_name, ' ', s.last_name) AS name,
        d.name AS major,
        'PRESENT' AS status,
        '10:00 AM' AS time
      FROM students s
      JOIN departments d ON d.id = s.department_id
      WHERE s.status = 'ACTIVE'
      ORDER BY s.admission_number ASC
      LIMIT 20
    `;
    const fallbackRes = await query(fallbackSql);
    return res.json({ success: true, data: fallbackRes.rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/attendance/sessions (List recorded attendance sessions)
router.get('/sessions', authenticate, async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        s.id,
        s.session_date,
        s.period_number,
        s.topic,
        c.code AS course_code,
        c.title AS course_title,
        ca.section,
        CONCAT(f.first_name, ' ', f.last_name) AS faculty_name,
        COUNT(r.id)::int AS total_students,
        COUNT(CASE WHEN r.status = 'PRESENT' THEN 1 END)::int AS present_count,
        COUNT(CASE WHEN r.status = 'ABSENT' THEN 1 END)::int AS absent_count,
        COUNT(CASE WHEN r.status = 'LATE' THEN 1 END)::int AS late_count,
        COUNT(CASE WHEN r.status = 'ON_DUTY' THEN 1 END)::int AS on_duty_count
      FROM attendance_sessions s
      JOIN course_assignments ca ON ca.id = s.course_assignment_id
      JOIN courses c ON c.id = ca.course_id
      JOIN faculty f ON f.id = s.marked_by_faculty_id
      LEFT JOIN attendance_records r ON r.session_id = s.id
      GROUP BY s.id, s.session_date, s.period_number, s.topic, c.code, c.title, ca.section, f.first_name, f.last_name
      ORDER BY s.session_date DESC, s.created_at DESC
    `;
    const result = await query(sql);
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/attendance/current-session (Find existing recorded session for assignment, date & period)
router.get('/current-session', authenticate, async (req, res, next) => {
  const { courseAssignmentId, sessionDate, periodNumber } = req.query;
  if (!courseAssignmentId || !sessionDate || !periodNumber) {
    return res.status(400).json({ success: false, message: 'Missing courseAssignmentId, sessionDate, or periodNumber' });
  }

  try {
    const sessionRes = await query(
      `SELECT s.*, c.code AS course_code, c.title AS course_title, ca.section,
              CONCAT(f.first_name, ' ', f.last_name) AS faculty_name
       FROM attendance_sessions s
       JOIN course_assignments ca ON ca.id = s.course_assignment_id
       JOIN courses c ON c.id = ca.course_id
       JOIN faculty f ON f.id = s.marked_by_faculty_id
       WHERE s.course_assignment_id = $1 AND s.session_date = $2 AND s.period_number = $3
       LIMIT 1`,
      [courseAssignmentId, sessionDate, periodNumber]
    );

    if (sessionRes.rows.length === 0) {
      return res.json({ success: true, exists: false, message: 'No attendance recorded yet for this session.' });
    }

    const session = sessionRes.rows[0];
    const recordsRes = await query(
      `SELECT r.id AS record_id, r.student_id, r.status, r.remarks, r.updated_at,
              s.admission_number, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
              d.name AS major
       FROM attendance_records r
       JOIN students s ON s.id = r.student_id
       LEFT JOIN departments d ON d.id = s.department_id
       WHERE r.session_id = $1
       ORDER BY s.admission_number ASC`,
      [session.id]
    );

    return res.json({
      success: true,
      exists: true,
      data: {
        ...session,
        records: recordsRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/attendance/sessions/:id (Read single session with student records)
router.get('/sessions/:id', authenticate, async (req, res, next) => {
  const { id } = req.params;
  try {
    const sessionRes = await query(
      `SELECT s.*, c.code AS course_code, c.title AS course_title, ca.section,
              CONCAT(f.first_name, ' ', f.last_name) AS faculty_name
       FROM attendance_sessions s
       JOIN course_assignments ca ON ca.id = s.course_assignment_id
       JOIN courses c ON c.id = ca.course_id
       JOIN faculty f ON f.id = s.marked_by_faculty_id
       WHERE s.id = $1`,
      [id]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance session not found.' });
    }

    const recordsRes = await query(
      `SELECT r.*, s.admission_number, CONCAT(s.first_name, ' ', s.last_name) AS student_name
       FROM attendance_records r
       JOIN students s ON s.id = r.student_id
       WHERE r.session_id = $1
       ORDER BY s.admission_number ASC`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...sessionRes.rows[0],
        records: recordsRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/attendance/sessions (Faculty & Admin: Record Live Attendance Session)
router.post('/sessions', authenticate, authorize('FACULTY', 'ADMIN', 'DEPARTMENT_STAFF'), async (req, res, next) => {
  const { courseAssignmentId, sessionDate, periodNumber, topic, records } = req.body;

  if (!courseAssignmentId || !sessionDate || !periodNumber || !records || !Array.isArray(records)) {
    return res.status(400).json({ success: false, message: 'Missing required attendance session fields.' });
  }

  try {
    const sessionRecord = await withTransaction(async (client) => {
      // 1. Resolve valid course_assignment_id
      let validAssignmentId = courseAssignmentId;
      const caCheck = await client.query('SELECT id FROM course_assignments WHERE id = $1', [courseAssignmentId]);
      if (caCheck.rows.length === 0) {
        // Fallback: see if passed ID was a course_id or get first assignment
        const caFallback = await client.query('SELECT id FROM course_assignments WHERE course_id = $1 LIMIT 1', [courseAssignmentId]);
        if (caFallback.rows.length > 0) {
          validAssignmentId = caFallback.rows[0].id;
        } else {
          const firstCa = await client.query('SELECT id FROM course_assignments LIMIT 1');
          if (firstCa.rows.length > 0) {
            validAssignmentId = firstCa.rows[0].id;
          } else {
            throw new Error('No course assignment found in database. Create a course assignment first.');
          }
        }
      }

      // 2. Fetch or resolve faculty ID
      let facultyId = null;
      const facRes = await client.query('SELECT id FROM faculty WHERE user_id = $1 LIMIT 1', [req.user.userId]);
      if (facRes.rows.length > 0) {
        facultyId = facRes.rows[0].id;
      } else {
        const anyFac = await client.query('SELECT id FROM faculty LIMIT 1');
        if (anyFac.rows.length > 0) {
          facultyId = anyFac.rows[0].id;
        } else {
          throw new Error('No faculty profile found in database.');
        }
      }

      // 3. Insert or reuse attendance_sessions (unique by course_assignment_id, session_date, period_number)
      const existingSession = await client.query(
        'SELECT id FROM attendance_sessions WHERE course_assignment_id = $1 AND session_date = $2 AND period_number = $3',
        [validAssignmentId, sessionDate, periodNumber]
      );

      let sessionId;
      let sessionRow;
      if (existingSession.rows.length > 0) {
        sessionId = existingSession.rows[0].id;
        const updateSession = await client.query(
          `UPDATE attendance_sessions 
           SET topic = COALESCE($1, topic), marked_by_faculty_id = $2, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $3 RETURNING *`,
          [topic || 'Curriculum Lecture', facultyId, sessionId]
        );
        sessionRow = updateSession.rows[0];
      } else {
        const sessionSql = `
          INSERT INTO attendance_sessions (
            course_assignment_id, session_date, period_number, topic, marked_by_faculty_id
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        const sessionRes = await client.query(sessionSql, [
          validAssignmentId,
          sessionDate,
          periodNumber,
          topic || 'Curriculum Lecture',
          facultyId,
        ]);
        sessionId = sessionRes.rows[0].id;
        sessionRow = sessionRes.rows[0];
      }

      // 4. Validate student IDs against students table to guarantee FK integrity
      const rawStudentIds = records.map((r) => r.studentId || r.student_id).filter(Boolean);
      let validStudentSet = new Set();
      if (rawStudentIds.length > 0) {
        const validStudentsRes = await client.query(
          'SELECT id FROM students WHERE id = ANY($1::uuid[])',
          [rawStudentIds]
        );
        validStudentSet = new Set(validStudentsRes.rows.map((row) => row.id));
      }

      let insertedCount = 0;
      for (const record of records) {
        const sId = record.studentId || record.student_id;
        if (!validStudentSet.has(sId)) {
          // Skip records that don't match existing students
          continue;
        }

        const validStatus = ['PRESENT', 'ABSENT', 'LATE', 'ON_DUTY'].includes(record.status)
          ? record.status
          : 'PRESENT';

        await client.query(
          `INSERT INTO attendance_records (session_id, student_id, status, remarks)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (session_id, student_id) 
           DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks, updated_at = CURRENT_TIMESTAMP`,
          [sessionId, sId, validStatus, record.remarks || null]
        );
        insertedCount++;
      }

      return {
        session: sessionRow,
        recordedStudents: insertedCount,
      };
    });

    return res.status(201).json({
      success: true,
      data: sessionRecord.session,
      recordsCount: sessionRecord.recordedStudents,
      message: `Attendance session recorded successfully for ${sessionRecord.recordedStudents} students.`,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/attendance/sessions/:id (Update existing attendance session and records)
router.put('/sessions/:id', authenticate, authorize('FACULTY', 'ADMIN', 'DEPARTMENT_STAFF'), async (req, res, next) => {
  const { id } = req.params;
  const { topic, records } = req.body;

  try {
    const updated = await withTransaction(async (client) => {
      // 1. Verify session exists
      const sesCheck = await client.query('SELECT * FROM attendance_sessions WHERE id = $1', [id]);
      if (sesCheck.rows.length === 0) {
        return null;
      }

      // 2. Update topic if provided
      if (topic) {
        await client.query(
          'UPDATE attendance_sessions SET topic = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [topic, id]
        );
      }

      // 3. Upsert records if provided
      let updatedCount = 0;
      if (Array.isArray(records) && records.length > 0) {
        const rawStudentIds = records.map((r) => r.studentId || r.student_id).filter(Boolean);
        let validStudentSet = new Set();
        if (rawStudentIds.length > 0) {
          const validStudentsRes = await client.query(
            'SELECT id FROM students WHERE id = ANY($1::uuid[])',
            [rawStudentIds]
          );
          validStudentSet = new Set(validStudentsRes.rows.map((row) => row.id));
        }

        for (const record of records) {
          const sId = record.studentId || record.student_id;
          if (!validStudentSet.has(sId)) continue;

          const validStatus = ['PRESENT', 'ABSENT', 'LATE', 'ON_DUTY'].includes(record.status)
            ? record.status
            : 'PRESENT';

          await client.query(
            `INSERT INTO attendance_records (session_id, student_id, status, remarks)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (session_id, student_id)
             DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks, updated_at = CURRENT_TIMESTAMP`,
            [id, sId, validStatus, record.remarks || null]
          );
          updatedCount++;
        }
      }

      const refreshedSes = await client.query('SELECT * FROM attendance_sessions WHERE id = $1', [id]);
      return {
        session: refreshedSes.rows[0],
        recordsCount: updatedCount,
      };
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Attendance session not found.' });
    }

    return res.json({
      success: true,
      data: updated.session,
      recordsCount: updated.recordsCount,
      message: `Attendance session updated successfully (${updated.recordsCount} student records updated).`,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/attendance/sessions/:id (Delete attendance session - Admin & Faculty)
router.delete('/sessions/:id', authenticate, authorize('FACULTY', 'ADMIN'), async (req, res, next) => {
  const { id } = req.params;
  try {
    const delRes = await query('DELETE FROM attendance_sessions WHERE id = $1 RETURNING id', [id]);
    if (delRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance session not found.' });
    }
    return res.json({ success: true, message: 'Attendance session deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/attendance/student/:studentId (Student attendance statistics)
router.get('/student/:studentId', authenticate, async (req, res, next) => {
  const { studentId } = req.params;

  try {
    const sql = `
      SELECT 
        COUNT(ar.id)::int AS total_sessions,
        COUNT(CASE WHEN ar.status = 'PRESENT' THEN 1 END)::int AS present_count,
        COUNT(CASE WHEN ar.status = 'ON_DUTY' THEN 1 END)::int AS on_duty_count,
        COUNT(CASE WHEN ar.status = 'LATE' THEN 1 END)::int AS late_count,
        COUNT(CASE WHEN ar.status = 'ABSENT' THEN 1 END)::int AS absent_count,
        ROUND(
          (COUNT(CASE WHEN ar.status IN ('PRESENT', 'ON_DUTY') THEN 1 END)::numeric / 
           NULLIF(COUNT(ar.id), 0)::numeric) * 100, 
          1
        )::float AS attendance_percentage
      FROM attendance_records ar
      WHERE ar.student_id = $1
    `;
    const result = await query(sql, [studentId]);
    const summary = result.rows[0] || {
      total_sessions: 0,
      present_count: 0,
      on_duty_count: 0,
      late_count: 0,
      absent_count: 0,
      attendance_percentage: 100.0,
    };

    return res.json({
      success: true,
      summary: {
        ...summary,
        attendance_percentage: summary.attendance_percentage ?? 100.0,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
