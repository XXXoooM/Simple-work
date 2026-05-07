import { json, error } from 'itty-router';
import type { Env } from '../index';
import type { AuthedRequest } from '../middleware';

// ===== 类型 =====

interface OrderRow {
  id: number;
  order_title: string;
  order_content: string | null;
  sender_id: number;
  sender_name: string;
  receiver_id: number;
  order_date: string;
  status: string;
  created_at: string;
  received_at: string | null;
  processing_at: string | null;
  completed_at: string | null;
}

interface StatusUpdateBody {
  status: 'PROCESSING' | 'COMPLETED';
  remark?: string;
}

// ===== 处理函数 =====

/**
 * GET /api/b/orders/pending
 * B 端待接收订单列表（status = PENDING，按创建时间倒序）
 */
export async function handleGetPendingOrders(request: Request, env: Env) {
  const user = (request as AuthedRequest).user;

  const orders = await env.DB.prepare(`
    SELECT o.id, o.order_title, o.order_content, o.sender_id,
           o.order_date, o.status, o.created_at,
           u.name as sender_name
    FROM orders o
    LEFT JOIN users u ON o.sender_id = u.id
    WHERE o.receiver_id = ? AND o.status = 'PENDING'
    ORDER BY o.created_at DESC
  `).bind(user.sub).all<OrderRow>();

  return json({
    code: 200,
    message: 'success',
    data: orders.results,
  });
}

/**
 * PUT /api/b/orders/:id/receive
 * 接收订单（PENDING → RECEIVED）
 */
export async function handleReceiveOrder(request: Request, env: Env) {
  const user = (request as AuthedRequest).user;
  const url = new URL(request.url);
  const orderId = parseInt(url.pathname.split('/')[4], 10);

  if (isNaN(orderId)) {
    return error(400, '无效的订单 ID');
  }

  // 查询订单：必须是当前用户的 + 状态为 PENDING
  const order = await env.DB.prepare(
    'SELECT id, status FROM orders WHERE id = ? AND receiver_id = ?'
  ).bind(orderId, user.sub).first<{ id: number; status: string }>();

  if (!order) {
    return error(404, '订单不存在或不属于你');
  }

  if (order.status !== 'PENDING') {
    return error(400, `订单当前状态为「${order.status}」，无法接收`);
  }

  await env.DB.prepare(
    "UPDATE orders SET status = 'RECEIVED', received_at = datetime('now') WHERE id = ?"
  ).bind(orderId).run();

  // 写通知给 A 端发送人
  const orderInfo = await env.DB.prepare(
    'SELECT order_title, sender_id FROM orders WHERE id = ?'
  ).bind(orderId).first<{ order_title: string; sender_id: number }>();
  if (orderInfo) {
    await env.DB.prepare(
      `INSERT INTO notifications (user_id, type, title, content) VALUES (?, 'ORDER_RECEIVED', ?, ?)`
    ).bind(orderInfo.sender_id, '订单已被接收', `您的订单「${orderInfo.order_title}」已被接收`).run();
  }

  return json({
    code: 200,
    message: '订单已接收',
    data: { orderId, status: 'RECEIVED' },
  });
}

/**
 * GET /api/b/orders/active
 * B 端进行中订单（RECEIVED + PROCESSING，按时间倒序）
 */
export async function handleGetActiveOrders(request: Request, env: Env) {
  const user = (request as AuthedRequest).user;

  const orders = await env.DB.prepare(`
    SELECT o.id, o.order_title, o.order_content, o.sender_id,
           o.order_date, o.status, o.created_at, o.received_at,
           o.processing_at, o.completed_at,
           u.name as sender_name
    FROM orders o
    LEFT JOIN users u ON o.sender_id = u.id
    WHERE o.receiver_id = ? AND o.status IN ('RECEIVED', 'PROCESSING')
    ORDER BY o.created_at DESC
  `).bind(user.sub).all<OrderRow>();

  return json({
    code: 200,
    message: 'success',
    data: orders.results,
  });
}

/**
 * PUT /api/b/orders/:id/status
 * 更新订单状态（RECEIVED → PROCESSING → COMPLETED）
 */
export async function handleUpdateOrderStatus(request: Request, env: Env) {
  const user = (request as AuthedRequest).user;
  const url = new URL(request.url);
  const orderId = parseInt(url.pathname.split('/')[4], 10);

  if (isNaN(orderId)) {
    return error(400, '无效的订单 ID');
  }

  let body: StatusUpdateBody;
  try {
    body = await request.json() as StatusUpdateBody;
  } catch {
    return error(400, '请求体格式错误');
  }

  const { status: newStatus } = body;
  if (!['PROCESSING', 'COMPLETED'].includes(newStatus)) {
    return error(400, '状态值无效，仅允许 PROCESSING 或 COMPLETED');
  }

  // 查询当前订单
  const order = await env.DB.prepare(
    'SELECT id, status FROM orders WHERE id = ? AND receiver_id = ?'
  ).bind(orderId, user.sub).first<{ id: number; status: string }>();

  if (!order) {
    return error(404, '订单不存在或不属于你');
  }

  // 状态流转校验
  const validTransitions: Record<string, string[]> = {
    RECEIVED: ['PROCESSING'],
    PROCESSING: ['COMPLETED'],
  };

  if (!validTransitions[order.status]?.includes(newStatus)) {
    return error(400, `不能从「${order.status}」变更为「${newStatus}」`);
  }

  // 更新状态和对应时间戳
  const timeField = newStatus === 'PROCESSING' ? 'processing_at' : 'completed_at';

  if (newStatus === 'COMPLETED' && body.remark?.trim()) {
    await env.DB.prepare(
      `UPDATE orders SET status = ?, ${timeField} = datetime('now'), completed_remark = ? WHERE id = ?`
    ).bind(newStatus, body.remark.trim(), orderId).run();
  } else {
    await env.DB.prepare(
      `UPDATE orders SET status = ?, ${timeField} = datetime('now') WHERE id = ?`
    ).bind(newStatus, orderId).run();
  }

  // 完成时写通知给 A 端发送人
  if (newStatus === 'COMPLETED') {
    const orderInfo = await env.DB.prepare(
      'SELECT order_title, sender_id FROM orders WHERE id = ?'
    ).bind(orderId).first<{ order_title: string; sender_id: number }>();
    if (orderInfo) {
      const remarkNote = body.remark?.trim() ? `\n备注：${body.remark.trim()}` : '';
      await env.DB.prepare(
        `INSERT INTO notifications (user_id, type, title, content) VALUES (?, 'ORDER_COMPLETED', ?, ?)`
      ).bind(orderInfo.sender_id, '订单已完成', `您的订单「${orderInfo.order_title}」已完成${remarkNote}`).run();
    }
  }

  return json({
    code: 200,
    message: `订单状态已更新为 ${newStatus}`,
    data: { orderId, status: newStatus },
  });
}
