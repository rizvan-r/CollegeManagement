import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  createNotification,
  broadcastNotification,
  sendPushNotifications,
  isExpoPushToken,
} from '../services/notificationService.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// -------------------------------------------------------------
// 1. POST /api/v1/notifications/devices - Register Push Device
// -------------------------------------------------------------
router.post('/devices', async (req, res, next) => {
  const { pushToken, platform = 'android', deviceName } = req.body;

  if (!pushToken) {
    return res.status(400).json({ success: false, message: 'pushToken is required.' });
  }

  try {
    const upsertSql = `
      INSERT INTO device_tokens (user_id, push_token, platform, device_name, is_active, last_used_at, updated_at)
      VALUES ($1, $2, $3, $4, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, push_token)
      DO UPDATE SET 
        is_active = TRUE,
        platform = EXCLUDED.platform,
        device_name = COALESCE(EXCLUDED.device_name, device_tokens.device_name),
        last_used_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, push_token, platform, is_active
    `;
    const result = await query(upsertSql, [req.user.userId, pushToken.trim(), platform.toLowerCase(), deviceName || null]);

    return res.status(200).json({
      success: true,
      message: 'Device push token registered successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 2. DELETE /api/v1/notifications/devices - Deactivate Push Device
// -------------------------------------------------------------
router.delete('/devices', async (req, res, next) => {
  const { pushToken } = req.body;

  try {
    let sql = 'UPDATE device_tokens SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1';
    const params = [req.user.userId];

    if (pushToken) {
      params.push(pushToken.trim());
      sql += ' AND push_token = $2';
    }

    const result = await query(sql, params);

    return res.json({
      success: true,
      message: `Deactivated ${result.rowCount} device push token(s).`,
    });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 3. GET /api/v1/notifications - List In-App Notifications
// -------------------------------------------------------------
router.get('/', async (req, res, next) => {
  const { unreadOnly, category, limit = 40, offset = 0 } = req.query;

  try {
    let sql = `
      SELECT id, title, body, category, data, is_read, read_at, created_at
      FROM notifications
      WHERE user_id = $1
    `;
    const params = [req.user.userId];

    if (unreadOnly === 'true') {
      sql += ' AND is_read = FALSE';
    }

    if (category && category !== 'ALL') {
      params.push(category.toUpperCase());
      sql += ` AND category = $${params.length}`;
    }

    // Total count & unread count in parallel
    const unreadCountRes = await query(
      'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.userId]
    );

    params.push(Math.min(parseInt(limit, 10) || 40, 100));
    params.push(parseInt(offset, 10) || 0);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await query(sql, params);

    return res.json({
      success: true,
      unreadCount: unreadCountRes.rows[0]?.count || 0,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 4. PATCH /api/v1/notifications/:id/read - Mark One As Read
// -------------------------------------------------------------
router.patch('/:id/read', async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_read, read_at`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found or access denied.' });
    }

    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Notification marked as read.',
    });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 5. PATCH /api/v1/notifications/read-all - Mark All As Read
// -------------------------------------------------------------
router.patch('/read-all', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND is_read = FALSE
       RETURNING id`,
      [req.user.userId]
    );

    return res.json({
      success: true,
      markedCount: result.rowCount,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 6. GET /api/v1/notifications/preferences - Get Preferences
// -------------------------------------------------------------
router.get('/preferences', async (req, res, next) => {
  try {
    let prefRes = await query(
      `SELECT announcements, attendance, requests, academic, updated_at
       FROM notification_preferences
       WHERE user_id = $1`,
      [req.user.userId]
    );

    // If no row exists yet, insert default
    if (prefRes.rows.length === 0) {
      const insRes = await query(
        `INSERT INTO notification_preferences (user_id, announcements, attendance, requests, academic)
         VALUES ($1, TRUE, TRUE, TRUE, TRUE)
         RETURNING announcements, attendance, requests, academic, updated_at`,
        [req.user.userId]
      );
      prefRes = insRes;
    }

    return res.json({
      success: true,
      data: prefRes.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 7. PUT /api/v1/notifications/preferences - Update Preferences
// -------------------------------------------------------------
router.put('/preferences', async (req, res, next) => {
  const { announcements, attendance, requests, academic } = req.body;

  try {
    const upsertSql = `
      INSERT INTO notification_preferences (user_id, announcements, attendance, requests, academic, updated_at)
      VALUES (
        $1,
        COALESCE($2, TRUE),
        COALESCE($3, TRUE),
        COALESCE($4, TRUE),
        COALESCE($5, TRUE),
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        announcements = COALESCE($2, notification_preferences.announcements),
        attendance = COALESCE($3, notification_preferences.attendance),
        requests = COALESCE($4, notification_preferences.requests),
        academic = COALESCE($5, notification_preferences.academic),
        updated_at = CURRENT_TIMESTAMP
      RETURNING announcements, attendance, requests, academic, updated_at
    `;
    const result = await query(upsertSql, [
      req.user.userId,
      typeof announcements === 'boolean' ? announcements : null,
      typeof attendance === 'boolean' ? attendance : null,
      typeof requests === 'boolean' ? requests : null,
      typeof academic === 'boolean' ? academic : null,
    ]);

    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Notification preferences updated successfully.',
    });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 8. POST /api/v1/notifications/broadcast - Admin Broadcast
// -------------------------------------------------------------
router.post('/broadcast', authorize('ADMIN'), async (req, res, next) => {
  const { title, body, audience = 'COLLEGE_WIDE', targetDepartmentId, category = 'ANNOUNCEMENTS', data } = req.body;

  if (!title || !body) {
    return res.status(400).json({ success: false, message: 'title and body are required.' });
  }

  try {
    const outcome = await broadcastNotification({
      title,
      body,
      audience,
      targetDepartmentId,
      category,
      data: data || {},
    });

    return res.status(201).json({
      success: true,
      message: `Broadcast delivered to ${outcome.count} recipients.`,
      data: outcome,
    });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 9. POST /api/v1/notifications/test-push - Send Instant Test Push
// -------------------------------------------------------------
router.post('/test-push', async (req, res, next) => {
  const { title = 'Test Alert', body = 'Push notification delivery verified on your device.' } = req.body;

  try {
    const outcome = await createNotification({
      userIds: [req.user.userId],
      title,
      body,
      category: 'ANNOUNCEMENTS',
      data: { type: 'TEST', timestamp: new Date().toISOString() },
      channelId: 'announcements',
    });

    return res.json({
      success: true,
      message: 'Test notification queued.',
      data: outcome,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

