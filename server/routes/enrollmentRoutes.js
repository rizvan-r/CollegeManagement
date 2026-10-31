import { Router } from 'express';
import { query, pool, withTransaction } from '../config/db.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Helper: resolve student ID from req.user
async function resolveStudentId(req) {
  if (req.user?.role === 'STUDENT') {
    const res = await query('SELECT id FROM students WHERE user_id = $1 LIMIT 1', [req.user.userId]);
    return res.rows[0]?.id || null;
  }
  return null;
}

// GET /api/v1/enrollments (List all enrollments with optional filters)
router.get('/', authenticate, async (req, res, next) => {
  const { studentId, courseAssignmentId, courseId } = req.query;

  try {
    let sql = `
      SELECT 
        e.id,
        e.student_id,
        e.course_assignment_id,
        e.enrolled_at,
        e.status,
        s.admission_number,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.current_semester AS student_semester,
        d.name AS department_name,
        d.code AS department_code,
        c.id AS course_id,
        c.code AS course_code,
        c.title AS course_title,
        c.credits AS course_credits,
        c.semester AS course_semester,
        ca.section,
        CONCAT(f.first_name, ' ', f.last_name) AS faculty_name
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN departments d ON d.id = s.department_id
      JOIN course_assignments ca ON ca.id = e.course_assignment_id
      JOIN courses c ON c.id = ca.course_id
      JOIN faculty f ON f.id = ca.faculty_id
      WHERE 1=1
    `;
    const params = [];

    if (studentId) {
      params.push(studentId);
      sql += ` AND e.student_id = $${params.length}`;
    }
    if (courseAssignmentId) {
      params.push(courseAssignmentId);
      sql += ` AND e.course_assignment_id = $${params.length}`;
    }
    if (courseId) {
      params.push(courseId);
      sql += ` AND ca.course_id = $${params.length}`;
    }

    sql += ' ORDER BY c.code ASC, s.admission_number ASC';

    const result = await query(sql, params);
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/enrollments/available-courses (List courses open for enrollment)
router.get('/available-courses', authenticate, async (req, res, next) => {
  try {
    const studentId = await resolveStudentId(req);

    const sql = `
      SELECT 
        ca.id AS course_assignment_id,
        ca.section,
        c.id AS course_id,
        c.code AS course_code,
        c.title AS course_title,
        c.credits,
        c.semester,
        d.name AS department_name,
        d.code AS department_code,
        CONCAT(f.first_name, ' ', f.last_name) AS faculty_name,
        COUNT(DISTINCT e.id)::int AS enrolled_count,
        MAX(CASE WHEN e.student_id = $1 THEN 1 ELSE 0 END)::int AS is_enrolled,
        MAX(CASE WHEN e.student_id = $1 THEN e.id::text ELSE NULL END) AS my_enrollment_id
      FROM course_assignments ca
      JOIN courses c ON c.id = ca.course_id AND c.is_active = TRUE
      JOIN departments d ON d.id = c.department_id
      JOIN faculty f ON f.id = ca.faculty_id
      LEFT JOIN enrollments e ON e.course_assignment_id = ca.id
      GROUP BY ca.id, ca.section, c.id, c.code, c.title, c.credits, c.semester, d.name, d.code, f.first_name, f.last_name
      ORDER BY c.code ASC, ca.section ASC
    `;
    const result = await query(sql, [studentId || '00000000-0000-0000-0000-000000000000']);
    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows.map((r) => ({
        ...r,
        is_enrolled: Boolean(r.is_enrolled),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/enrollments/student/:studentId (Get enrolled courses for a given student)
router.get('/student/:studentId', authenticate, async (req, res, next) => {
  const { studentId } = req.params;

  try {
    const sql = `
      SELECT 
        e.id AS enrollment_id,
        e.enrolled_at,
        e.status,
        c.id AS course_id,
        c.code AS course_code,
        c.title AS course_title,
        c.credits,
        c.semester,
        ca.id AS course_assignment_id,
        ca.section,
        CONCAT(f.first_name, ' ', f.last_name) AS faculty_name,
        d.name AS department_name
      FROM enrollments e
      JOIN course_assignments ca ON ca.id = e.course_assignment_id
      JOIN courses c ON c.id = ca.course_id
      JOIN faculty f ON f.id = ca.faculty_id
      JOIN departments d ON d.id = c.department_id
      WHERE e.student_id = $1
      ORDER BY c.code ASC
    `;
    const result = await query(sql, [studentId]);
    const totalCredits = result.rows.reduce((sum, row) => sum + (Number(row.credits) || 0), 0);

    return res.json({
      success: true,
      count: result.rows.length,
      totalCredits,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/enrollments (Enroll student into a course section)
router.post('/', authenticate, async (req, res, next) => {
  let { studentId, courseAssignmentId } = req.body;

  // If student user is self-enrolling, resolve their student ID
  if (req.user?.role === 'STUDENT') {
    const resolvedId = await resolveStudentId(req);
    if (!resolvedId) {
      return res.status(403).json({ success: false, message: 'Student profile not found for authenticated user.' });
    }
    studentId = resolvedId;
  } else {
    // For admin or staff, studentId is required in body
    if (!['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to enroll students.' });
    }
  }

  if (!studentId || !courseAssignmentId) {
    return res.status(400).json({
      success: false,
      message: 'Both studentId and courseAssignmentId are required.',
    });
  }

  try {
    // 1. Verify student exists
    const stuCheck = await query('SELECT id, first_name, last_name, admission_number FROM students WHERE id = $1', [studentId]);
    if (stuCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // 2. Verify course assignment exists
    const caCheck = await query(`
      SELECT ca.id, c.code, c.title, ca.section, CONCAT(f.first_name, ' ', f.last_name) AS faculty_name
      FROM course_assignments ca
      JOIN courses c ON c.id = ca.course_id
      JOIN faculty f ON f.id = ca.faculty_id
      WHERE ca.id = $1
    `, [courseAssignmentId]);
    if (caCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Course section assignment not found.' });
    }

    // 3. Check for existing enrollment
    const existing = await query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_assignment_id = $2',
      [studentId, courseAssignmentId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Student is already enrolled in ${caCheck.rows[0].code} Section ${caCheck.rows[0].section}.`,
      });
    }

    // 4. Insert enrollment
    const insertSql = `
      INSERT INTO enrollments (student_id, course_assignment_id, status)
      VALUES ($1, $2, 'ENROLLED')
      RETURNING *
    `;
    const result = await query(insertSql, [studentId, courseAssignmentId]);

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      course: caCheck.rows[0],
      student: stuCheck.rows[0],
      message: `Successfully enrolled ${stuCheck.rows[0].first_name} ${stuCheck.rows[0].last_name} into ${caCheck.rows[0].code} Section ${caCheck.rows[0].section}.`,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/enrollments/batch (Batch enroll multiple students into a course section - Admin & Staff)
router.post('/batch', authenticate, authorize('ADMIN', 'DEPARTMENT_STAFF', 'FACULTY'), async (req, res, next) => {
  const { courseAssignmentId, studentIds } = req.body;

  if (!courseAssignmentId || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'courseAssignmentId and a non-empty array of studentIds are required.',
    });
  }

  try {
    let enrolledCount = 0;
    await withTransaction(async (client) => {
      for (const sId of studentIds) {
        const insRes = await client.query(`
          INSERT INTO enrollments (student_id, course_assignment_id, status)
          VALUES ($1, $2, 'ENROLLED')
          ON CONFLICT (student_id, course_assignment_id) DO NOTHING
          RETURNING id
        `, [sId, courseAssignmentId]);
        if (insRes.rows.length > 0) {
          enrolledCount++;
        }
      }
    });

    return res.status(201).json({
      success: true,
      enrolledCount,
      totalRequested: studentIds.length,
      message: `Enrolled ${enrolledCount} students into the selected course section.`,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/enrollments/:id (Drop/unenroll a student from a course section)
router.delete('/:id', authenticate, async (req, res, next) => {
  const { id } = req.params;

  try {
    const enrCheck = await query('SELECT * FROM enrollments WHERE id = $1', [id]);
    if (enrCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Enrollment record not found.' });
    }

    const enr = enrCheck.rows[0];

    // If student is dropping, verify ownership
    if (req.user?.role === 'STUDENT') {
      const myStudentId = await resolveStudentId(req);
      if (enr.student_id !== myStudentId) {
        return res.status(403).json({ success: false, message: 'Cannot unenroll another student.' });
      }
    } else if (!['ADMIN', 'DEPARTMENT_STAFF', 'FACULTY'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to remove enrollments.' });
    }

    await query('DELETE FROM enrollments WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Student unenrolled from course successfully.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
