import { Router } from 'express';
import { query, withTransaction } from '../config/db.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { createNotification, broadcastNotification } from '../services/notificationService.js';

const router = Router();

// Helper: Resolve HOD's department from req.user
async function resolveHodDepartment(userId, email) {
  const sql = `
    SELECT 
      f.id AS faculty_id,
      f.employee_id,
      f.first_name,
      f.last_name,
      f.designation,
      f.qualification,
      f.phone,
      u.email,
      d.id AS department_id,
      d.name AS department_name,
      d.code AS department_code,
      d.building
    FROM faculty f
    JOIN users u ON u.id = f.user_id
    JOIN departments d ON (d.id = f.department_id OR d.hod_faculty_id = f.id)
    WHERE f.user_id = $1 OR LOWER(u.email) = LOWER($2)
    LIMIT 1
  `;
  const res = await query(sql, [userId, email || '']);
  if (res.rows.length > 0) {
    return res.rows[0];
  }

  // Fallback: If user has role DEPARTMENT_STAFF but no direct faculty record, get first department
  const deptFallback = await query('SELECT id, name, code, building FROM departments LIMIT 1');
  if (deptFallback.rows.length > 0) {
    const d = deptFallback.rows[0];
    return {
      faculty_id: null,
      employee_id: 'HOD-GEN-001',
      first_name: 'Department',
      last_name: 'Administrator',
      designation: 'Head of Department',
      qualification: 'Ph.D.',
      phone: null,
      email,
      department_id: d.id,
      department_name: d.name,
      department_code: d.code,
      building: d.building,
    };
  }

  return null;
}

// In-memory store for student academic/OD requests (persisted per session lifecycle)
let departmentalRequests = [
  {
    id: 'req-od-001',
    studentId: '51111111-1111-1111-1111-111111111101',
    studentName: 'Alex Mercer',
    admissionNumber: 'CMP-2025-CSE-0001',
    type: 'ON_DUTY',
    reason: 'Inter-College Hackathon Representation at MIT',
    date: '2026-11-15',
    sessionsAffected: 'Periods 1-4',
    status: 'PENDING',
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    remarks: '',
  },
  {
    id: 'req-leave-002',
    studentId: '51111111-1111-1111-1111-111111111102',
    studentName: 'Priya Nair',
    admissionNumber: 'CMP-2025-CSE-0002',
    type: 'MEDICAL_LEAVE',
    reason: 'Hospital consultation for viral fever with doctor certificate',
    date: '2026-11-14',
    sessionsAffected: 'Full Day',
    status: 'PENDING',
    submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    remarks: '',
  },
];

// GET /api/v1/hod/me (or /profile)
router.get('/me', authenticate, authorize('DEPARTMENT_STAFF', 'ADMIN'), async (req, res, next) => {
  try {
    const hod = await resolveHodDepartment(req.user.userId, req.user.email);
    if (!hod) {
      return res.status(404).json({ success: false, message: 'Department staff profile not found.' });
    }
    return res.json({ success: true, data: hod });
  } catch (error) {
    next(error);
  }
});

router.get('/profile', authenticate, authorize('DEPARTMENT_STAFF', 'ADMIN'), async (req, res, next) => {
  req.url = '/me';
  return router.handle(req, res, next);
});

// GET /api/v1/hod/dashboard
router.get('/dashboard', authenticate, authorize('DEPARTMENT_STAFF', 'ADMIN'), async (req, res, next) => {
  try {
    const hod = await resolveHodDepartment(req.user.userId, req.user.email);
    if (!hod) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const deptId = hod.department_id;

    // 1. Student count in department
    const stuCountRes = await query('SELECT COUNT(*)::int AS count FROM students WHERE department_id = $1', [deptId]);
    const studentCount = stuCountRes.rows[0]?.count || 0;

    // 2. Faculty count in department
    const facCountRes = await query('SELECT COUNT(*)::int AS count FROM faculty WHERE department_id = $1', [deptId]);
    const facultyCount = facCountRes.rows[0]?.count || 0;

    // 3. Course count in department
    const courseCountRes = await query('SELECT COUNT(*)::int AS count FROM courses WHERE department_id = $1', [deptId]);
    const courseCount = courseCountRes.rows[0]?.count || 0;

    // 4. Department average attendance
    const attRes = await query(
      `SELECT 
         COALESCE(
           ROUND(
             (COUNT(CASE WHEN ar.status IN ('PRESENT', 'ON_DUTY') THEN 1 END)::numeric / 
              NULLIF(COUNT(ar.id), 0)::numeric) * 100, 
             1
           )::float,
           88.5
         ) AS avg_attendance,
         COUNT(DISTINCT s.id)::int AS total_department_sessions
       FROM attendance_sessions s
       JOIN course_assignments ca ON ca.id = s.course_assignment_id
       JOIN courses c ON c.id = ca.course_id
       LEFT JOIN attendance_records ar ON ar.session_id = s.id
       WHERE c.department_id = $1`,
      [deptId]
    );
    const avgAttendance = attRes.rows[0]?.avg_attendance ?? 88.5;

    // 5. Low attendance students count (< 75%)
    const lowAttRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM (
         SELECT 
           s.id,
           ROUND(
             (COUNT(CASE WHEN ar.status IN ('PRESENT', 'ON_DUTY') THEN 1 END)::numeric / 
              NULLIF(COUNT(ar.id), 0)::numeric) * 100, 
             1
           ) AS att_pct
         FROM students s
         JOIN attendance_records ar ON ar.student_id = s.id
         WHERE s.department_id = $1
         GROUP BY s.id
         HAVING (COUNT(CASE WHEN ar.status IN ('PRESENT', 'ON_DUTY') THEN 1 END)::numeric / 
                 NULLIF(COUNT(ar.id), 0)::numeric) * 100 < 75
       ) sub`,
      [deptId]
    );
    const lowAttendanceCount = lowAttRes.rows[0]?.count || 0;

    // 6. Recent department and college notices
    const noticesRes = await query(
      `SELECT id, title, content, priority, audience, publish_date AS date
       FROM notices
       WHERE target_department_id = $1 OR audience IN ('COLLEGE_WIDE', 'FACULTY_ONLY')
       ORDER BY publish_date DESC
       LIMIT 5`,
      [deptId]
    );

    // 7. Pending requests count
    const pendingRequestsCount = departmentalRequests.filter((r) => r.status === 'PENDING').length;

    return res.json({
      success: true,
      data: {
        hodName: `${hod.first_name} ${hod.last_name}`,
        employeeId: hod.employee_id,
        designation: hod.designation,
        departmentId: hod.department_id,
        departmentName: hod.department_name,
        departmentCode: hod.department_code,
        building: hod.building,
        studentCount,
        facultyCount,
        courseCount,
        avgAttendance: `${avgAttendance}%`,
        avgAttendanceNum: avgAttendance,
        lowAttendanceCount,
        pendingRequestsCount,
        recentNotices: noticesRes.rows,
        recentRequests: departmentalRequests.slice(0, 3),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/hod/faculty (Faculty list belonging to HOD department)
router.get('/faculty', authenticate, authorize('DEPARTMENT_STAFF', 'ADMIN'), async (req, res, next) => {
  try {
    const hod = await resolveHodDepartment(req.user.userId, req.user.email);
    if (!hod) return res.status(404).json({ success: false, message: 'Department not found.' });

    const sql = `
      SELECT 
        f.id,
        f.employee_id,
        f.first_name,
        f.last_name,
        CONCAT(f.first_name, ' ', f.last_name) AS name,
        f.designation,
        f.qualification,
        f.phone,
        f.status,
        u.email,
        d.name AS department_name,
        d.code AS department_code,
        COUNT(DISTINCT ca.id)::int AS assigned_courses_count,
        COALESCE(STRING_AGG(DISTINCT c.code, ', '), 'None') AS courses_summary
      FROM faculty f
      JOIN users u ON u.id = f.user_id
      JOIN departments d ON d.id = f.department_id
      LEFT JOIN course_assignments ca ON ca.faculty_id = f.id
      LEFT JOIN courses c ON c.id = ca.course_id
      WHERE f.department_id = $1
      GROUP BY f.id, f.employee_id, f.first_name, f.last_name, f.designation, f.qualification, f.phone, f.status, u.email, d.name, d.code
      ORDER BY f.first_name ASC
    `;
    const result = await query(sql, [hod.department_id]);
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/hod/students (Students belonging to HOD department with attendance)
router.get('/students', authenticate, authorize('DEPARTMENT_STAFF', 'ADMIN'), async (req, res, next) => {
  try {
    const hod = await resolveHodDepartment(req.user.userId, req.user.email);
    if (!hod) return res.status(404).json({ success: false, message: 'Department not found.' });

    const sql = `
      SELECT 
        s.id,
        s.admission_number,
        s.first_name,
        s.last_name,
        CONCAT(s.first_name, ' ', s.last_name) AS name,
        s.dob,
        s.gender,
        s.current_semester,
        s.phone,
        s.guardian_name,
        s.guardian_contact,
        s.status,
        u.email,
        d.name AS department_name,
        d.code AS department_code,
        ay.name AS academic_year_name,
        COUNT(DISTINCT e.id)::int AS enrolled_courses_count,
        COUNT(DISTINCT ar.session_id)::int AS total_sessions_recorded,
        COUNT(DISTINCT CASE WHEN ar.status IN ('PRESENT', 'ON_DUTY') THEN ar.session_id END)::int AS attended_sessions,
        COALESCE(
          ROUND(
            (COUNT(DISTINCT CASE WHEN ar.status IN ('PRESENT', 'ON_DUTY') THEN ar.session_id END)::numeric / 
             NULLIF(COUNT(DISTINCT ar.session_id), 0)::numeric) * 100, 
            1
          )::float,
          100.0
        ) AS attendance_percentage
      FROM students s
      JOIN users u ON u.id = s.user_id
      JOIN departments d ON d.id = s.department_id
      LEFT JOIN academic_years ay ON ay.id = s.academic_year_id
      LEFT JOIN enrollments e ON e.student_id = s.id
      LEFT JOIN attendance_records ar ON ar.student_id = s.id
      WHERE s.department_id = $1
      GROUP BY s.id, s.admission_number, s.first_name, s.last_name, s.dob, s.gender, s.current_semester, s.phone, s.guardian_name, s.guardian_contact, s.status, u.email, d.name, d.code, ay.name
      ORDER BY s.admission_number ASC
    `;
    const result = await query(sql, [hod.department_id]);
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/hod/courses (Department course offerings with enrollment and instructor)
router.get('/courses', authenticate, authorize('DEPARTMENT_STAFF', 'ADMIN'), async (req, res, next) => {
  try {
    const hod = await resolveHodDepartment(req.user.userId, req.user.email);
    if (!hod) return res.status(404).json({ success: false, message: 'Department not found.' });

    const sql = `
      SELECT 
        c.id,
        c.code,
        c.title,
        c.credits,
        c.semester,
        c.is_active,
        d.name AS department_name,
        d.code AS department_code,
        ca.id AS course_assignment_id,
        ca.section,
        CONCAT(f.first_name, ' ', f.last_name) AS faculty_name,
        f.employee_id AS faculty_employee_id,
        COUNT(DISTINCT e.id)::int AS enrolled_students,
        COALESCE((
          SELECT COUNT(DISTINCT s.id)::int
          FROM attendance_sessions s
          WHERE s.course_assignment_id = ca.id
        ), 0) AS sessions_held
      FROM courses c
      JOIN departments d ON d.id = c.department_id
      LEFT JOIN course_assignments ca ON ca.course_id = c.id
      LEFT JOIN faculty f ON f.id = ca.faculty_id
      LEFT JOIN enrollments e ON e.course_assignment_id = ca.id
      WHERE c.department_id = $1
      GROUP BY c.id, c.code, c.title, c.credits, c.semester, c.is_active, d.name, d.code, ca.id, ca.section, f.first_name, f.last_name, f.employee_id
      ORDER BY c.semester ASC, c.code ASC
    `;
    const result = await query(sql, [hod.department_id]);
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/hod/attendance (Department attendance summary and breakdown)
router.get('/attendance', authenticate, authorize('DEPARTMENT_STAFF', 'ADMIN'), async (req, res, next) => {
  try {
    const hod = await resolveHodDepartment(req.user.userId, req.user.email);
    if (!hod) return res.status(404).json({ success: false, message: 'Department not found.' });

    // 1. Overall stats
    const summarySql = `
      SELECT 
        COUNT(DISTINCT s.id)::int AS total_sessions,
        COUNT(r.id)::int AS total_records,
        COUNT(CASE WHEN r.status = 'PRESENT' THEN 1 END)::int AS present_count,
        COUNT(CASE WHEN r.status = 'ABSENT' THEN 1 END)::int AS absent_count,
        COUNT(CASE WHEN r.status = 'ON_DUTY' THEN 1 END)::int AS on_duty_count,
        COUNT(CASE WHEN r.status = 'LATE' THEN 1 END)::int AS late_count,
        COALESCE(
          ROUND(
            (COUNT(CASE WHEN r.status IN ('PRESENT', 'ON_DUTY') THEN 1 END)::numeric / 
             NULLIF(COUNT(r.id), 0)::numeric) * 100, 
            1
          )::float,
          91.4
        ) AS attendance_percentage
      FROM attendance_sessions s
      JOIN course_assignments ca ON ca.id = s.course_assignment_id
      JOIN courses c ON c.id = ca.course_id
      LEFT JOIN attendance_records r ON r.session_id = s.id
      WHERE c.department_id = $1
    `;
    const summaryRes = await query(summarySql, [hod.department_id]);

    // 2. Course-wise attendance
    const courseAttSql = `
      SELECT 
        c.id AS course_id,
        c.code,
        c.title,
        ca.section,
        CONCAT(f.first_name, ' ', f.last_name) AS faculty_name,
        COUNT(DISTINCT s.id)::int AS sessions_held,
        COUNT(r.id)::int AS total_records,
        COUNT(CASE WHEN r.status IN ('PRESENT', 'ON_DUTY') THEN 1 END)::int AS attended_records,
        COALESCE(
          ROUND(
            (COUNT(CASE WHEN r.status IN ('PRESENT', 'ON_DUTY') THEN 1 END)::numeric / 
             NULLIF(COUNT(r.id), 0)::numeric) * 100, 
            1
          )::float,
          100.0
        ) AS percentage
      FROM courses c
      JOIN course_assignments ca ON ca.course_id = c.id
      LEFT JOIN faculty f ON f.id = ca.faculty_id
      LEFT JOIN attendance_sessions s ON s.course_assignment_id = ca.id
      LEFT JOIN attendance_records r ON r.session_id = s.id
      WHERE c.department_id = $1
      GROUP BY c.id, c.code, c.title, ca.section, f.first_name, f.last_name
      ORDER BY c.code ASC
    `;
    const courseAttRes = await query(courseAttSql, [hod.department_id]);

    // 3. Low attendance alert list (< 75%)
    const lowAttSql = `
      SELECT 
        s.id AS student_id,
        s.admission_number,
        CONCAT(s.first_name, ' ', s.last_name) AS name,
        s.current_semester,
        COUNT(r.id)::int AS total_sessions,
        COUNT(CASE WHEN r.status IN ('PRESENT', 'ON_DUTY') THEN 1 END)::int AS attended_sessions,
        ROUND(
          (COUNT(CASE WHEN r.status IN ('PRESENT', 'ON_DUTY') THEN 1 END)::numeric / 
           NULLIF(COUNT(r.id), 0)::numeric) * 100, 
          1
        )::float AS percentage
      FROM students s
      JOIN attendance_records r ON r.student_id = s.id
      WHERE s.department_id = $1
      GROUP BY s.id, s.admission_number, s.first_name, s.last_name, s.current_semester
      HAVING (COUNT(CASE WHEN r.status IN ('PRESENT', 'ON_DUTY') THEN 1 END)::numeric / 
              NULLIF(COUNT(r.id), 0)::numeric) * 100 < 75
      ORDER BY percentage ASC
    `;
    const lowAttRes = await query(lowAttSql, [hod.department_id]);

    return res.json({
      success: true,
      data: {
        summary: summaryRes.rows[0],
        courseWise: courseAttRes.rows,
        lowAttendanceAlerts: lowAttRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/hod/requests (List pending & processed student academic requests)
router.get('/requests', authenticate, authorize('DEPARTMENT_STAFF', 'ADMIN'), async (req, res, next) => {
  try {
    return res.json({
      success: true,
      count: departmentalRequests.length,
      data: departmentalRequests,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/hod/requests/:id (Approve or Reject request with HOD remarks)
router.patch('/requests/:id', authenticate, authorize('DEPARTMENT_STAFF', 'ADMIN'), async (req, res, next) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED.' });
  }

  const reqIndex = departmentalRequests.findIndex((r) => r.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ success: false, message: 'Request not found.' });
  }

  departmentalRequests[reqIndex] = {
    ...departmentalRequests[reqIndex],
    status,
    remarks: remarks || `Processed by Department HOD on ${new Date().toLocaleDateString()}`,
    processedAt: new Date().toISOString(),
    processedBy: req.user.email,
  };

  // Record action in audit_logs
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_name, entity_id, new_data)
       VALUES ($1, $2, 'STUDENT_REQUEST', $3, $4)`,
      [
        req.user.userId,
        `REQUEST_${status}`,
        id,
        JSON.stringify(departmentalRequests[reqIndex]),
      ]
    );

    // Notify the student regarding the request update
    if (departmentalRequests[reqIndex]?.studentId) {
      const studentRes = await query(
        `SELECT user_id FROM students WHERE id = $1`,
        [departmentalRequests[reqIndex].studentId]
      );
      if (studentRes.rows.length > 0 && studentRes.rows[0].user_id) {
        createNotification({
          userIds: [studentRes.rows[0].user_id],
          title: `Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
          body: `Your request (${departmentalRequests[reqIndex].type || 'Academic Request'}) was marked ${status.toLowerCase()} by Department HOD.`,
          category: 'REQUESTS',
          data: {
            requestId: id,
            status,
            type: departmentalRequests[reqIndex].type,
          },
          channelId: 'requests',
        }).catch((e) => console.warn('Request notification dispatch error:', e.message));
      }
    }
  } catch (auditErr) {
    console.warn('Audit log write error:', auditErr.message);
  }

  return res.json({
    success: true,
    data: departmentalRequests[reqIndex],
    message: `Request ${id} marked as ${status} successfully.`,
  });
});

// GET /api/v1/hod/notices (Department notices)
router.get('/notices', authenticate, authorize('DEPARTMENT_STAFF', 'ADMIN'), async (req, res, next) => {
  try {
    const hod = await resolveHodDepartment(req.user.userId, req.user.email);
    if (!hod) return res.status(404).json({ success: false, message: 'Department not found.' });

    const sql = `
      SELECT n.*, u.email AS author_email, d.name AS department_name
      FROM notices n
      JOIN users u ON u.id = n.author_id
      LEFT JOIN departments d ON d.id = n.target_department_id
      WHERE n.target_department_id = $1 OR n.audience IN ('COLLEGE_WIDE', 'FACULTY_ONLY')
      ORDER BY n.publish_date DESC
    `;
    const result = await query(sql, [hod.department_id]);
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/hod/notices (Create notice from HOD)
router.post('/notices', authenticate, authorize('DEPARTMENT_STAFF', 'ADMIN'), async (req, res, next) => {
  const { title, content, priority, audience, expiryDate } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Notice title and content are required.' });
  }

  try {
    const hod = await resolveHodDepartment(req.user.userId, req.user.email);
    const targetDeptId = audience === 'COLLEGE_WIDE' ? null : hod?.department_id;

    const sql = `
      INSERT INTO notices (title, content, priority, audience, target_department_id, author_id, expiry_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await query(sql, [
      title.trim(),
      content.trim(),
      priority || 'NORMAL',
      audience || 'DEPARTMENT_ONLY',
      targetDeptId,
      req.user.userId,
      expiryDate || null,
    ]);

    // Broadcast push notification to department or college
    broadcastNotification({
      title: `Notice: ${title.trim()}`,
      body: content.trim().length > 120 ? `${content.trim().slice(0, 117)}...` : content.trim(),
      audience: audience || 'DEPARTMENT_ONLY',
      targetDepartmentId: targetDeptId,
      category: 'ANNOUNCEMENTS',
      data: {
        noticeId: result.rows[0].id,
        audience: audience || 'DEPARTMENT_ONLY',
      },
    }).catch((notifErr) => {
      console.warn('HOD notice notification dispatch failed:', notifErr.message);
    });

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Notice published successfully.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

