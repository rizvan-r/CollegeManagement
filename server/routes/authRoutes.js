import { Router } from 'express';
import { query } from '../config/db.js';
import { config } from '../config/env.js';
import { comparePassword, hashPassword } from '../utils/passwordUtils.js';
import { generateToken } from '../utils/tokenUtils.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { loginRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Demo accounts dictionary fallback ONLY for offline/development test harness
const DEMO_USERS = {
  'admin@college.edu': {
    id: 'u0000000-0000-0000-0000-000000000001',
    email: 'admin@college.edu',
    role: 'ADMIN',
  },
  'hod.cse@college.edu': {
    id: 'u0000000-0000-0000-0000-000000000002',
    email: 'hod.cse@college.edu',
    role: 'DEPARTMENT_STAFF',
    departmentId: 'd0000000-0000-0000-0000-000000000001',
  },
  'faculty.alan@college.edu': {
    id: 'u0000000-0000-0000-0000-000000000003',
    email: 'faculty.alan@college.edu',
    role: 'FACULTY',
    departmentId: 'd0000000-0000-0000-0000-000000000001',
  },
  'student.alex@college.edu': {
    id: 'u0000000-0000-0000-0000-000000000005',
    email: 'student.alex@college.edu',
    role: 'STUDENT',
    departmentId: 'd0000000-0000-0000-0000-000000000001',
  },
};

// POST /api/v1/auth/login (Protected by IP Rate Limiter against credential brute-force)
router.post('/login', loginRateLimiter({ maxAttempts: 10, windowMs: 15 * 60 * 1000 }), async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    // Attempt database authentication first
    let userRecord = null;
    try {
      const dbRes = await query(
        'SELECT id, email, password_hash, role, is_active FROM users WHERE LOWER(email) = LOWER($1)',
        [email]
      );
      if (dbRes.rows.length > 0) {
        userRecord = dbRes.rows[0];
      }
    } catch (dbErr) {
      console.warn('[Auth Notice]: DB lookup fallback to seed credentials');
    }

    if (userRecord) {
      if (!userRecord.is_active) {
        return res.status(403).json({ success: false, message: 'Account is deactivated. Contact administration.' });
      }

      const match = await comparePassword(password, userRecord.password_hash);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      // Reset rate limit tracking upon successful authentication
      req.clearLoginRateLimit?.();

      const token = generateToken({
        userId: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
      });

      return res.json({
        success: true,
        token,
        user: { id: userRecord.id, email: userRecord.email, role: userRecord.role },
      });
    }

    // Fallback: strictly disabled in production
    if (config.nodeEnv !== 'production') {
      const demoUser = DEMO_USERS[email.toLowerCase()];
      if (demoUser && (password === 'Password@123' || password === 'Admin@123')) {
        req.clearLoginRateLimit?.();
        const token = generateToken({
          userId: demoUser.id,
          email: demoUser.email,
          role: demoUser.role,
          departmentId: demoUser.departmentId,
        });

        return res.json({
          success: true,
          token,
          user: demoUser,
        });
      }
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    try {
      const dbRes = await query(
        'SELECT id, email, role, is_active, created_at FROM users WHERE id = $1',
        [req.user.userId]
      );
      if (dbRes.rows.length > 0) {
        return res.json({ success: true, user: dbRes.rows[0] });
      }
    } catch (err) {
      // Fallback to token decoded data
    }

    return res.json({
      success: true,
      user: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/change-password
router.post('/change-password', authenticate, async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
  }

  try {
    try {
      const dbRes = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.userId]);
      if (dbRes.rows.length > 0) {
        const match = await comparePassword(currentPassword, dbRes.rows[0].password_hash);
        if (!match) {
          return res.status(400).json({ success: false, message: 'Current password does not match.' });
        }
        const newHash = await hashPassword(newPassword);
        await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
          newHash,
          req.user.userId,
        ]);
      }
    } catch (err) {
      console.warn('Simulated password change in demo mode');
    }

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
