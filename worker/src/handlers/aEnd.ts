import { json, error } from 'itty-router';
import type { Env } from '../index';
import type { AuthedRequest } from '../middleware';

// ===== 类型 =====

interface CreateOrderBody {
  receiverId: number;
  orderTitle: string;
  orderContent?: string;
  orderDate: string;
  idempotencyKey: string;
}

interface OrderRow {
  id: number;
  order_title: string;
  order_content: string | null;
  sender_id: number;
  receiver_id: number;
  order_date: string;
  status: string;
  created_at: string;
  received_at: string | null;
  processing_at: string | null;
  completed_at: string | null;
  receiver_name: string;
}

// ===== 处理函数 =====

/**
 * GET /api/a/receivers
 * 获取可选的 B 端用户列表（仅 status=1 的活跃用户）
 */
export async function handleGetReceivers(request: Request, env: Env) {
  const receivers = await env.DB.prepare(`
    SELECT id, username, name
    FROM users
    WHERE user_type = 'B' AND status = 1
    ORDER BY name ASC
  `).all<{ id: number; username: string; name: string }>();

  return json({
    code: 200,
    message: 'success',
    data: receivers.results,
  });
}

/**
 * POST /api/a/orders
 * 创建订单（含 idempotency_key 防重复提交）
 */
export async function handleCreateOrder(request: Request, env: Env) {
  const user = (request as AuthedRequest).user;

  let body: CreateOrderBody;
  try {
    body = await request.json() as CreateOrderBody;
  } catch {
    return error(400, '请求体格式错误');
  }

  const { receiverId, orderTitle, orderContent, orderDate, idempotencyKey } = body;

  // 参数校验
  if (!receiverId || !orderTitle?.trim() || !orderDate || !idempotencyKey) {
    return error(400, '接收人、订单标题、日期和幂等键不能为空');
  }

  // 验证日期格式 (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(orderDate)) {
    return error(400, '日期格式不正确，应为 YYYY-MM-DD');
  }

  // 验证接收人是否存在且为活跃的 B 端用户
  const receiver = await env.DB.prepare(
    `SELECT id, name FROM users WHERE id = ? AND user_type = 'B' AND status = 1`
  ).bind(receiverId).first<{ id: number; name: string }>();

  if (!receiver) {
    return error(400, '指定的接收人不存在或已被禁用');
  }

  // 插入订单（idempotency_key UNIQUE 约束防重复）
  try {
    const result = await env.DB.prepare(`
      INSERT INTO orders (idempotency_key, order_title, order_content, sender_id, receiver_id, order_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      idempotencyKey,
      orderTitle.trim(),
      orderContent?.trim() || null,
      user.sub,
      receiverId,
      orderDate,
    ).run();

    // 推送 WebSocket 通知给接收人
    try {
      const doId = env.ORDER_WS.idFromName(`user:${receiverId}`);
      const stub = env.ORDER_WS.get(doId);
      await stub.fetch('https://internal/push', {
        method: 'POST',
        body: JSON.stringify({
          message: {
            type: 'NEW_ORDER',
            orderId: result.meta?.last_row_id,
            senderName: user.name,
            orderTitle: orderTitle.trim(),
            orderDate,
          },
        }),
      });
    } catch {
      // WebSocket 推送失败不影响订单创建
      console.error('WebSocket push failed');
    }

    // 写通知给 B 端接收人
    try {
      await env.DB.prepare(
        `INSERT INTO notifications (user_id, type, title, content) VALUES (?, 'NEW_ORDER', ?, ?)`
      ).bind(receiverId, '收到新订单', `${user.name} 向您发送了订单「${orderTitle.trim()}」`).run();
    } catch { /* 通知写入失败不影响主流程 */ }

    return json({
      code: 200,
      message: '订单创建成功',
      data: {
        orderId: result.meta?.last_row_id,
        receiverName: receiver.name,
      },
    });
  } catch (err) {
    // idempotency_key 唯一索引冲突 → 重复提交
    if (err instanceof Error && err.message.includes('UNIQUE')) {
      return error(409, '订单已提交，请勿重复操作');
    }
    throw err;
  }
}

/**
 * GET /api/a/orders?page=1&size=10
 * 获取当前 A 端用户的历史订单（分页，按创建时间倒序）
 */
export async function handleGetOrders(request: Request, env: Env) {
  const user = (request as AuthedRequest).user;
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const size = Math.min(50, Math.max(1, parseInt(url.searchParams.get('size') || '10', 10)));
  const offset = (page - 1) * size;

  // 总数查询
  const countResult = await env.DB.prepare(
    'SELECT COUNT(*) as total FROM orders WHERE sender_id = ?'
  ).bind(user.sub).first<{ total: number }>();

  const total = countResult?.total ?? 0;

  // 分页数据查询（JOIN 获取接收人姓名）
  const orders = await env.DB.prepare(`
    SELECT o.id, o.order_title, o.order_content, o.sender_id, o.receiver_id,
           o.order_date, o.status, o.created_at, o.received_at,
           o.processing_at, o.completed_at,
           u.name as receiver_name
    FROM orders o
    LEFT JOIN users u ON o.receiver_id = u.id
    WHERE o.sender_id = ?
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(user.sub, size, offset).all<OrderRow>();

  return json({
    code: 200,
    message: 'success',
    data: {
      list: orders.results,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    },
  });
}
