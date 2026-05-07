import { json } from 'itty-router';
import type { Env } from '../index';
import type { AuthedRequest } from '../middleware';

/**
 * GET /api/notifications
 * 获取当前用户 7 天内的通知（未读优先）
 */
export async function handleGetNotifications(request: Request, env: Env) {
  const user = (request as AuthedRequest).user;

  // 自动清理 > 7 天旧数据
  await env.DB.prepare(
    "DELETE FROM notifications WHERE created_at < datetime('now', '-7 days')"
  ).run();

  const { results } = await env.DB.prepare(`
    SELECT id, type, title, content, is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY is_read ASC, created_at DESC
    LIMIT 50
  `).bind(user.sub).all();

  const unreadCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
  ).bind(user.sub).first<{ count: number }>();

  return json({
    code: 200,
    data: {
      notifications: results,
      unreadCount: unreadCount?.count ?? 0,
    },
  });
}

/**
 * PUT /api/notifications/read
 * 全部标为已读
 */
export async function handleMarkAllRead(request: Request, env: Env) {
  const user = (request as AuthedRequest).user;

  await env.DB.prepare(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
  ).bind(user.sub).run();

  return json({ code: 200, message: '全部已读', data: null });
}
