import { json, error } from 'itty-router';
import type { Env } from '../index';

// ===== A 端统计 =====
export async function handleAStats(request: Request & { user: any }, env: Env) {
  const userId = request.user.sub;

  // 各状态计数
  const counts = await env.DB.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'RECEIVED' THEN 1 ELSE 0 END) as received,
      SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) as processing,
      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
    FROM orders WHERE sender_id = ?
  `).bind(userId).first();

  // 近 7 天每日下单趋势
  const { results: trend } = await env.DB.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM orders
    WHERE sender_id = ? AND created_at >= datetime('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `).bind(userId).all();

  // 按接收人分布
  const { results: receivers } = await env.DB.prepare(`
    SELECT u.name, COUNT(*) as count
    FROM orders o JOIN users u ON o.receiver_id = u.id
    WHERE o.sender_id = ?
    GROUP BY o.receiver_id
    ORDER BY count DESC
    LIMIT 10
  `).bind(userId).all();

  return json({
    code: 200,
    data: {
      counts: {
        total: counts?.total ?? 0,
        pending: counts?.pending ?? 0,
        received: counts?.received ?? 0,
        processing: counts?.processing ?? 0,
        completed: counts?.completed ?? 0,
      },
      trend,
      receivers,
    },
  });
}

// ===== B 端统计 =====
export async function handleBStats(request: Request & { user: any }, env: Env) {
  const userId = request.user.sub;

  // 各状态计数
  const counts = await env.DB.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'RECEIVED' THEN 1 ELSE 0 END) as received,
      SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) as processing,
      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
    FROM orders WHERE receiver_id = ?
  `).bind(userId).first();

  // 近 7 天每日接单趋势
  const { results: trend } = await env.DB.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM orders
    WHERE receiver_id = ? AND created_at >= datetime('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `).bind(userId).all();

  // 平均处理时长（秒）— 只算已完成的
  const avgTime = await env.DB.prepare(`
    SELECT AVG(
      CAST((julianday(completed_at) - julianday(received_at)) * 86400 AS INTEGER)
    ) as avg_seconds
    FROM orders
    WHERE receiver_id = ? AND status = 'COMPLETED' AND completed_at IS NOT NULL AND received_at IS NOT NULL
  `).bind(userId).first();

  return json({
    code: 200,
    data: {
      counts: {
        total: counts?.total ?? 0,
        pending: counts?.pending ?? 0,
        received: counts?.received ?? 0,
        processing: counts?.processing ?? 0,
        completed: counts?.completed ?? 0,
      },
      trend,
      avgProcessSeconds: avgTime?.avg_seconds ?? 0,
    },
  });
}

// ===== 管理端统计 =====
export async function handleAdminStats(_request: Request, env: Env) {
  // 订单各状态总计数
  const orderCounts = await env.DB.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'RECEIVED' THEN 1 ELSE 0 END) as received,
      SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) as processing,
      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
    FROM orders
  `).first();

  // 用户统计
  const userCounts = await env.DB.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN user_type = 'A' THEN 1 ELSE 0 END) as type_a,
      SUM(CASE WHEN user_type = 'B' THEN 1 ELSE 0 END) as type_b
    FROM users WHERE status = 1
  `).first();

  // 近 30 天每日订单趋势
  const { results: trend } = await env.DB.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM orders
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all();

  // A 端下单排行 TOP 10
  const { results: topSenders } = await env.DB.prepare(`
    SELECT u.name, COUNT(*) as count
    FROM orders o JOIN users u ON o.sender_id = u.id
    GROUP BY o.sender_id
    ORDER BY count DESC
    LIMIT 10
  `).all();

  // B 端接单排行 TOP 10
  const { results: topReceivers } = await env.DB.prepare(`
    SELECT u.name, COUNT(*) as count
    FROM orders o JOIN users u ON o.receiver_id = u.id
    GROUP BY o.receiver_id
    ORDER BY count DESC
    LIMIT 10
  `).all();

  return json({
    code: 200,
    data: {
      orderCounts: {
        total: orderCounts?.total ?? 0,
        pending: orderCounts?.pending ?? 0,
        received: orderCounts?.received ?? 0,
        processing: orderCounts?.processing ?? 0,
        completed: orderCounts?.completed ?? 0,
      },
      userCounts: {
        total: userCounts?.total ?? 0,
        typeA: userCounts?.type_a ?? 0,
        typeB: userCounts?.type_b ?? 0,
      },
      trend,
      topSenders,
      topReceivers,
    },
  });
}
