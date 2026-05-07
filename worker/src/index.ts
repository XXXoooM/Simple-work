import { AutoRouter, cors, error, json } from 'itty-router';
import { handleLogin, handleChangePassword, handleRefreshToken } from './handlers/auth';
import { handleGetReceivers, handleCreateOrder, handleGetOrders } from './handlers/aEnd';
import { handleGetPendingOrders, handleReceiveOrder, handleGetActiveOrders, handleUpdateOrderStatus } from './handlers/bEnd';
import { handleAStats, handleBStats, handleAdminStats } from './handlers/stats';
import { handleALogs, handleBLogs, handleAdminLogs } from './handlers/logs';
import {
  handleListUsers, handleCreateUser, handleEditUser, handleDisableUser, handleAssignRole,
  handleListRoles, handleCreateRole, handleEditRole, handleDeleteRole,
} from './handlers/admin';
import { withAuth, requireUserType, requirePermissions } from './middleware';
import { verifyJWT } from './auth';

export interface Env {
  DB: D1Database;
  ORDER_WS: DurableObjectNamespace;
  JWT_SECRET: string;
}

const { preflight, corsify } = cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
});

const router = AutoRouter({
  before: [preflight],
  finally: [corsify],
});

// ===== 公开路由 =====
router.get('/api/health', () => json({
  code: 200,
  message: 'OK',
  data: { status: 'running', timestamp: new Date().toISOString() },
}));

router.post('/api/auth/login', handleLogin);

// ===== 需要登录的路由 =====
router.post('/api/auth/change-password', withAuth, handleChangePassword);
router.post('/api/auth/refresh', withAuth, handleRefreshToken);

// ===== A 端路由 =====
router.get('/api/a/receivers', withAuth, requireUserType('A'), handleGetReceivers);
router.post('/api/a/orders', withAuth, requireUserType('A'), handleCreateOrder);
router.get('/api/a/orders', withAuth, requireUserType('A'), handleGetOrders);
router.get('/api/a/stats', withAuth, requireUserType('A'), handleAStats);
router.get('/api/a/logs', withAuth, requireUserType('A'), handleALogs);

// ===== B 端路由 =====
router.get('/api/b/orders/pending', withAuth, requireUserType('B'), handleGetPendingOrders);
router.put('/api/b/orders/:id/receive', withAuth, requireUserType('B'), handleReceiveOrder);
router.get('/api/b/orders/active', withAuth, requireUserType('B'), handleGetActiveOrders);
router.put('/api/b/orders/:id/status', withAuth, requireUserType('B'), handleUpdateOrderStatus);
router.get('/api/b/stats', withAuth, requireUserType('B'), handleBStats);
router.get('/api/b/logs', withAuth, requireUserType('B'), handleBLogs);

// ===== 管理后台路由 =====
router.get('/api/admin/users', withAuth, requirePermissions('user:list'), handleListUsers);
router.post('/api/admin/users', withAuth, requirePermissions('user:create'), handleCreateUser);
router.put('/api/admin/users/:id', withAuth, requirePermissions('user:edit'), handleEditUser);
router.put('/api/admin/users/:id/disable', withAuth, requirePermissions('user:disable'), handleDisableUser);
router.put('/api/admin/users/:id/role', withAuth, requirePermissions('user:assign'), handleAssignRole);
router.get('/api/admin/roles', withAuth, requirePermissions('role:list'), handleListRoles);
router.post('/api/admin/roles', withAuth, requirePermissions('role:create'), handleCreateRole);
router.put('/api/admin/roles/:id', withAuth, requirePermissions('role:edit'), handleEditRole);
router.delete('/api/admin/roles/:id', withAuth, requirePermissions('role:delete'), handleDeleteRole);
router.get('/api/admin/stats', withAuth, requirePermissions('user:list'), handleAdminStats);
router.get('/api/admin/logs', withAuth, requirePermissions('user:list'), handleAdminLogs);

// ===== 兜底 404 =====
router.all('*', () => error(404, 'Not Found'));

// Worker 入口
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket 升级请求 — 不经过 itty-router（直接处理）
    if (url.pathname === '/ws') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426 });
      }

      // 从 query param 获取 token
      const token = url.searchParams.get('token');
      if (!token) {
        return new Response('Missing token', { status: 401 });
      }

      // 验证 JWT
      let payload;
      try {
        payload = await verifyJWT(token, env.JWT_SECRET);
      } catch {
        return new Response('Invalid token', { status: 401 });
      }

      // 转发到用户对应的 DO 实例
      const doId = env.ORDER_WS.idFromName(`user:${payload.sub}`);
      const stub = env.ORDER_WS.get(doId);
      return stub.fetch(request);
    }

    // 普通 HTTP 请求走 itty-router
    return router.fetch(request, env, ctx);
  },
};

// ===== Durable Object：每用户一个实例，管理 WebSocket 连接 =====
export class OrderWebSocket implements DurableObject {
  private connections: Set<WebSocket> = new Set();

  constructor(
    private state: DurableObjectState,
    private env: Env,
  ) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 内部推送请求（来自 Worker 的 aEnd handler）
    if (url.pathname === '/push') {
      const { message } = await request.json() as { message: unknown };
      const data = JSON.stringify(message);

      // 向所有活跃连接发送消息
      for (const ws of this.connections) {
        try {
          ws.send(data);
        } catch {
          this.connections.delete(ws);
        }
      }

      return new Response('ok');
    }

    // WebSocket 升级
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();
    this.connections.add(server);

    // 发送连接成功消息
    server.send(JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() }));

    server.addEventListener('close', () => {
      this.connections.delete(server);
    });

    server.addEventListener('error', () => {
      this.connections.delete(server);
    });

    return new Response(null, { status: 101, webSocket: client });
  }
}
