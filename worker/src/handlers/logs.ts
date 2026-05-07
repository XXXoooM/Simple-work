import { json } from 'itty-router';
import type { Env } from '../index';
import type { AuthedRequest } from '../middleware';

// ===== A 端日志 =====
export async function handleALogs(request: Request, env: Env) {
  const user = (request as AuthedRequest).user;
  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));

  const { results } = await env.DB.prepare(`
    SELECT o.id, o.order_title, o.order_content, o.order_date, o.status,
           o.created_at, o.received_at, o.processing_at, o.completed_at,
           u.name as receiver_name
    FROM orders o
    LEFT JOIN users u ON o.receiver_id = u.id
    WHERE o.sender_id = ?
    ORDER BY o.created_at DESC
    LIMIT ?
  `).bind(user.sub, limit).all();

  return json({ code: 200, data: results });
}

// ===== B 端日志 =====
export async function handleBLogs(request: Request, env: Env) {
  const user = (request as AuthedRequest).user;
  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));

  const { results } = await env.DB.prepare(`
    SELECT o.id, o.order_title, o.order_content, o.order_date, o.status,
           o.created_at, o.received_at, o.processing_at, o.completed_at,
           u.name as sender_name
    FROM orders o
    LEFT JOIN users u ON o.sender_id = u.id
    WHERE o.receiver_id = ?
    ORDER BY o.created_at DESC
    LIMIT ?
  `).bind(user.sub, limit).all();

  return json({ code: 200, data: results });
}

// ===== 管理端日志（带筛选） =====
export async function handleAdminLogs(request: Request, env: Env) {
  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '4', 10)));
  const userId = url.searchParams.get('user_id') || '';
  const title = url.searchParams.get('title') || '';
  const date = url.searchParams.get('date') || '';

  const conditions: string[] = [];
  const bindings: (string | number)[] = [];

  if (userId) {
    conditions.push('(o.sender_id = ? OR o.receiver_id = ?)');
    bindings.push(parseInt(userId, 10), parseInt(userId, 10));
  }
  if (title) {
    conditions.push('o.order_title LIKE ?');
    bindings.push(`%${title}%`);
  }
  if (date) {
    conditions.push('o.order_date = ?');
    bindings.push(date);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  bindings.push(limit);

  const { results } = await env.DB.prepare(`
    SELECT o.id, o.order_title, o.order_content, o.order_date, o.status,
           o.created_at, o.received_at, o.processing_at, o.completed_at,
           s.name as sender_name, r.name as receiver_name
    FROM orders o
    LEFT JOIN users s ON o.sender_id = s.id
    LEFT JOIN users r ON o.receiver_id = r.id
    ${where}
    ORDER BY o.created_at DESC
    LIMIT ?
  `).bind(...bindings).all();

  // 用户列表（用于筛选下拉）
  const { results: users } = await env.DB.prepare(`
    SELECT id, name, user_type FROM users WHERE status = 1 ORDER BY user_type, name
  `).all();

  return json({ code: 200, data: { logs: results, users } });
}
