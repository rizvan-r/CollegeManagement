import { query } from '../config/db.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Validates whether a token string is a valid Expo push token format.
 * Format: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx] or ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]
 */
export function isExpoPushToken(token) {
  return typeof token === 'string' && /^(ExponentPushToken|ExpoPushToken)\[.*\]$/.test(token.trim());
}

/**
 * Sends push messages via Expo Push API.
 * Automatically chunks requests into batches of 100.
 */
export async function sendPushNotifications(messages) {
  if (!messages || messages.length === 0) return { sent: 0, failed: 0, receipts: [] };

  const validMessages = [];
  const invalidTokens = [];

  for (const msg of messages) {
    if (isExpoPushToken(msg.to)) {
      validMessages.push(msg);
    } else {
      invalidTokens.push(msg.to);
    }
  }

  // Deactivate any malformed/invalid tokens in DB
  if (invalidTokens.length > 0) {
    try {
      await query(
        `UPDATE device_tokens SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE push_token = ANY($1)`,
        [invalidTokens]
      );
    } catch (e) {
      console.warn('[Push Service] Token deactivation notice:', e.message);
    }
  }

  if (validMessages.length === 0) {
    return { sent: 0, failed: invalidTokens.length, receipts: [] };
  }

  // Chunk messages into batches of 100 (Expo maximum)
  const chunks = [];
  for (let i = 0; i < validMessages.length; i += 100) {
    chunks.push(validMessages.slice(i, i + 100));
  }

  let totalSent = 0;
  let totalFailed = 0;
  const allReceipts = [];

  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      const result = await response.json();
      const tickets = result.data || [];

      tickets.forEach((ticket, idx) => {
        allReceipts.push(ticket);
        if (ticket.status === 'ok') {
          totalSent++;
        } else {
          totalFailed++;
          // If DeviceNotRegistered or InvalidCredentials, deactivate token
          if (ticket.details?.error === 'DeviceNotRegistered') {
            const badToken = chunk[idx]?.to;
            if (badToken) {
              query(
                `UPDATE device_tokens SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE push_token = $1`,
                [badToken]
              ).catch(() => {});
            }
          }
        }
      });
    } catch (err) {
      console.error('[Push Service] Chunk transmission error:', err.message);
      totalFailed += chunk.length;
    }
  }

  return {
    sent: totalSent,
    failed: totalFailed + invalidTokens.length,
    receipts: allReceipts,
  };
}

/**
 * Creates in-app notification records and dispatches push notifications.
 * Respects user category preferences.
 */
export async function createNotification({
  userIds = [],
  title,
  body,
  category = 'ANNOUNCEMENTS',
  data = {},
  channelId = 'announcements',
}) {
  if (!userIds || userIds.length === 0) return { count: 0 };

  try {
    // 1. Filter recipients by their notification_preferences
    const categoryColumn = category.toLowerCase(); // 'announcements', 'attendance', 'requests', 'academic'
    const allowedCategories = ['announcements', 'attendance', 'requests', 'academic'];
    const colName = allowedCategories.includes(categoryColumn) ? categoryColumn : 'announcements';

    const prefSql = `
      SELECT u.id
      FROM users u
      LEFT JOIN notification_preferences np ON np.user_id = u.id
      WHERE u.id = ANY($1)
        AND (np.${colName} IS NULL OR np.${colName} = TRUE)
        AND u.is_active = TRUE
    `;
    const eligibleUsersRes = await query(prefSql, [userIds]);
    const eligibleUserIds = eligibleUsersRes.rows.map((r) => r.id);

    if (eligibleUserIds.length === 0) {
      return { count: 0, message: 'No eligible users with notifications enabled.' };
    }

    // 2. Persist in-app notifications
    const insertValues = [];
    const params = [title, body, category, JSON.stringify(data)];
    let paramIdx = 5;

    eligibleUserIds.forEach((uid) => {
      insertValues.push(`($${paramIdx}, $1, $2, $3, $4)`);
      params.push(uid);
      paramIdx++;
    });

    const insertSql = `
      INSERT INTO notifications (user_id, title, body, category, data)
      VALUES ${insertValues.join(', ')}
      RETURNING id, user_id
    `;
    await query(insertSql, params);

    // 3. Query active device tokens for push delivery
    const tokensRes = await query(
      `SELECT push_token, user_id 
       FROM device_tokens 
       WHERE user_id = ANY($1) AND is_active = TRUE`,
      [eligibleUserIds]
    );

    if (tokensRes.rows.length > 0) {
      const messages = tokensRes.rows.map((t) => ({
        to: t.push_token,
        sound: 'default',
        title,
        body,
        data: {
          ...data,
          category,
          timestamp: new Date().toISOString(),
        },
        channelId,
        priority: 'high',
      }));

      sendPushNotifications(messages).catch((err) =>
        console.warn('[Push Service] Background delivery warning:', err.message)
      );
    }

    return {
      count: eligibleUserIds.length,
      pushedDevices: tokensRes.rows.length,
    };
  } catch (error) {
    console.error('[Push Service] createNotification failed:', error);
    return { count: 0, error: error.message };
  }
}

/**
 * Broadcasts a notification across the institution or targeted department.
 */
export async function broadcastNotification({
  title,
  body,
  audience = 'COLLEGE_WIDE',
  targetDepartmentId = null,
  category = 'ANNOUNCEMENTS',
  data = {},
}) {
  try {
    let sql = 'SELECT id FROM users WHERE is_active = TRUE';
    const params = [];

    if (audience === 'STUDENT_ONLY') {
      sql += " AND role = 'STUDENT'";
    } else if (audience === 'FACULTY_ONLY') {
      sql += " AND role IN ('FACULTY', 'DEPARTMENT_STAFF')";
    } else if (audience === 'DEPARTMENT_ONLY' && targetDepartmentId) {
      params.push(targetDepartmentId);
      sql = `
        SELECT u.id FROM users u
        LEFT JOIN students s ON s.user_id = u.id
        LEFT JOIN faculty f ON f.user_id = u.id
        WHERE u.is_active = TRUE
          AND (s.department_id = $1 OR f.department_id = $1)
      `;
    }

    const res = await query(sql, params);
    const userIds = res.rows.map((r) => r.id);

    return await createNotification({
      userIds,
      title,
      body,
      category,
      data: {
        ...data,
        audience,
        targetDepartmentId,
      },
      channelId: 'announcements',
    });
  } catch (err) {
    console.error('[Push Service] broadcastNotification error:', err);
    return { count: 0, error: err.message };
  }
}

