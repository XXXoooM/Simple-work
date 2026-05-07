import { json, error } from 'itty-router';
import { compare } from 'bcryptjs';
import { signJWT } from '../auth';
import type { Env } from '../index';
import type { AuthedRequest } from '../middleware';

interface LoginBody {
  username: string;
  password: string;
}

// 登录锁定配置
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 300; // 5 分钟

// 内存缓存（单实例 Worker 生命周期内有效）
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

/**
 * POST /api/auth/login
 * 含登录失败锁定：连续 5 次错误密码后锁定 5 分钟
 */
export async function handleLogin(request: Request, env: Env) {
  let body: LoginBody;
  try {
    body = await request.json() as LoginBody;
  } catch {
    return error(400, '请求体格式错误');
  }

  const { username, password } = body;
  if (!username || !password) {
    return error(400, '用户名和密码不能为空');
  }

  // 检查登录锁定
  const attempt = loginAttempts.get(username);
  if (attempt) {
    const now = Date.now();
    if (attempt.lockedUntil > now) {
      const remainSec = Math.ceil((attempt.lockedUntil - now) / 1000);
      return error(429, `登录失败次数过多，请 ${remainSec} 秒后重试`);
    }
    // 锁定已过期，清除记录
    if (attempt.lockedUntil > 0 && attempt.lockedUntil <= now) {
      loginAttempts.delete(username);
    }
  }

  // 查询用户（含角色权限）
  const user = await env.DB.prepare(`
    SELECT u.id, u.username, u.password, u.name, u.user_type, u.role_id, u.status,
           r.permissions
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.username = ?
  `).bind(username).first<{
    id: number;
    username: string;
    password: string;
    name: string;
    user_type: 'A' | 'B';
    role_id: number;
    status: number;
    permissions: string;
  }>();

  if (!user) {
    recordFailedAttempt(username);
    return error(401, formatLoginError(username));
  }

  if (user.status === 0) {
    return error(403, '账号已被禁用，请联系管理员');
  }

  // bcryptjs 密码验证
  const valid = await compare(password, user.password);
  if (!valid) {
    recordFailedAttempt(username);
    return error(401, formatLoginError(username));
  }

  // 登录成功 → 清除失败记录
  loginAttempts.delete(username);

  // 解析权限
  let permissions: string[] = [];
  try {
    permissions = JSON.parse(user.permissions || '[]');
  } catch {
    permissions = [];
  }

  // 签发 JWT（2 小时有效期）
  const token = await signJWT(
    {
      sub: user.id,
      username: user.username,
      name: user.name,
      userType: user.user_type,
      roleId: user.role_id,
      permissions,
    },
    env.JWT_SECRET,
  );

  return json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        name: user.name,
        userType: user.user_type,
        roleId: user.role_id,
        permissions,
      },
    },
  });
}

/**
 * POST /api/auth/refresh
 * Token 续签：在已有 token 有效期内签发新 token
 */
export async function handleRefreshToken(request: Request, env: Env) {
  const user = (request as AuthedRequest).user;

  // 从数据库重新获取最新权限（防止权限变更后旧 token 仍有效）
  const dbUser = await env.DB.prepare(`
    SELECT u.id, u.username, u.name, u.user_type, u.role_id, u.status,
           r.permissions
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
  `).bind(user.sub).first<{
    id: number;
    username: string;
    name: string;
    user_type: 'A' | 'B';
    role_id: number;
    status: number;
    permissions: string;
  }>();

  if (!dbUser) return error(404, '用户不存在');
  if (dbUser.status === 0) return error(403, '账号已被禁用');

  let permissions: string[] = [];
  try {
    permissions = JSON.parse(dbUser.permissions || '[]');
  } catch {
    permissions = [];
  }

  const token = await signJWT(
    {
      sub: dbUser.id,
      username: dbUser.username,
      name: dbUser.name,
      userType: dbUser.user_type,
      roleId: dbUser.role_id,
      permissions,
    },
    env.JWT_SECRET,
  );

  return json({
    code: 200,
    message: 'Token 续签成功',
    data: {
      token,
      userInfo: {
        id: dbUser.id,
        username: dbUser.username,
        name: dbUser.name,
        userType: dbUser.user_type,
        roleId: dbUser.role_id,
        permissions,
      },
    },
  });
}

/**
 * POST /api/auth/change-password
 */
export async function handleChangePassword(request: Request, env: Env) {
  const user = (request as AuthedRequest).user;
  let body: { oldPassword: string; newPassword: string };

  try {
    body = await request.json() as typeof body;
  } catch {
    return error(400, '请求体格式错误');
  }

  if (!body.oldPassword || !body.newPassword) {
    return error(400, '旧密码和新密码不能为空');
  }

  if (body.newPassword.length < 6) {
    return error(400, '新密码长度不能少于 6 位');
  }

  // === 校验修改频率 ===
  const { results: logs } = await env.DB.prepare(
    'SELECT changed_at FROM password_logs WHERE user_id = ? ORDER BY changed_at DESC LIMIT 2'
  ).bind(user.sub).all<{ changed_at: string }>();

  const now = Date.now();
  if (logs && logs.length > 0) {
    const lastChange = new Date(logs[0].changed_at + 'Z').getTime();
    const hoursSinceLast = (now - lastChange) / (1000 * 60 * 60);
    
    if (hoursSinceLast < 24) {
      return error(400, '两次修改密码间隔必须大于 24 小时');
    }

    if (logs.length > 1) {
      const secondLastChange = new Date(logs[1].changed_at + 'Z').getTime();
      const daysSinceSecondLast = (now - secondLastChange) / (1000 * 60 * 60 * 24);
      if (daysSinceSecondLast < 7) {
        return error(400, '7天内最多只能修改两次密码');
      }
    }
  }

  // 查询当前密码
  const dbUser = await env.DB.prepare('SELECT password FROM users WHERE id = ?')
    .bind(user.sub)
    .first<{ password: string }>();

  if (!dbUser) {
    return error(404, '用户不存在');
  }

  const valid = await compare(body.oldPassword, dbUser.password);
  if (!valid) {
    return error(401, '旧密码错误');
  }

  // bcryptjs hash - 动态引入以避免顶层 await
  const { hash } = await import('bcryptjs');
  const hashed = await hash(body.newPassword, 10);

  // 更新密码并插入日志
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET password = ? WHERE id = ?').bind(hashed, user.sub),
    env.DB.prepare('INSERT INTO password_logs (user_id) VALUES (?)').bind(user.sub)
  ]);

  return json({ code: 200, message: '密码修改成功', data: null });
}

// ===== 辅助函数 =====

function recordFailedAttempt(username: string) {
  const current = loginAttempts.get(username) || { count: 0, lockedUntil: 0 };
  current.count++;
  if (current.count >= MAX_ATTEMPTS) {
    current.lockedUntil = Date.now() + LOCKOUT_SECONDS * 1000;
  }
  loginAttempts.set(username, current);
}

function formatLoginError(username: string): string {
  const attempt = loginAttempts.get(username);
  if (!attempt) return '用户名或密码错误';
  const remaining = MAX_ATTEMPTS - attempt.count;
  if (remaining <= 0) {
    return `登录失败次数过多，账号已锁定 ${LOCKOUT_SECONDS / 60} 分钟`;
  }
  if (remaining <= 2) {
    return `用户名或密码错误，还有 ${remaining} 次尝试机会`;
  }
  return '用户名或密码错误';
}
