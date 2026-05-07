import { error } from 'itty-router';
import { verifyJWT, type JWTPayload } from './auth';
import type { Env } from './index';

// 扩展 Request 类型，附加 user 信息
export interface AuthedRequest extends Request {
  user: JWTPayload;
}

/**
 * JWT 鉴权中间件
 * 从 Authorization: Bearer <token> 中提取并验证 JWT
 */
export function withAuth(request: Request, env: Env) {
  return authenticate(request, env);
}

async function authenticate(request: Request, env: Env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return error(401, '未登录或 Token 缺失');
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyJWT(token, env.JWT_SECRET);
    (request as AuthedRequest).user = payload;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token 验证失败';
    return error(401, message);
  }
}

/**
 * 权限校验中间件工厂
 * 检查用户是否拥有所有指定权限
 */
export function requirePermissions(...required: string[]) {
  return (request: Request) => {
    const user = (request as AuthedRequest).user;
    if (!user) return error(401, '未登录');

    // 超管通配符
    if (user.permissions.includes('*')) return;

    const hasAll = required.every((p) => user.permissions.includes(p));
    if (!hasAll) {
      return error(403, '权限不足');
    }
  };
}

/**
 * 用户类型校验中间件
 */
export function requireUserType(type: 'A' | 'B') {
  return (request: Request) => {
    const user = (request as AuthedRequest).user;
    if (!user) return error(401, '未登录');
    if (user.userType !== type) {
      return error(403, `仅限 ${type} 端用户访问`);
    }
  };
}
