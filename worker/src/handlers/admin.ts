import { json, error } from 'itty-router';
import { hash } from 'bcryptjs';
import type { Env } from '../index';
import type { AuthedRequest } from '../middleware';

// ===== 类型 =====

interface CreateUserBody {
  username: string;
  password: string;
  name: string;
  userType: 'A' | 'B';
  roleId?: number;
}

interface EditUserBody {
  name?: string;
  userType?: 'A' | 'B';
}

interface CreateRoleBody {
  name: string;
  permissions: string[];
}

interface EditRoleBody {
  name?: string;
  permissions?: string[];
}

// ===== 用户管理 =====

/**
 * GET /api/admin/users
 */
export async function handleListUsers(_request: Request, env: Env) {
  const users = await env.DB.prepare(`
    SELECT u.id, u.username, u.name, u.user_type, u.role_id, u.status,
           u.created_at, u.updated_at,
           r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    ORDER BY u.id ASC
  `).all();

  return json({ code: 200, message: 'success', data: users.results });
}

/**
 * POST /api/admin/users
 */
export async function handleCreateUser(request: Request, env: Env) {
  const currentUser = (request as AuthedRequest).user;

  let body: CreateUserBody;
  try {
    body = await request.json() as CreateUserBody;
  } catch {
    return error(400, '请求体格式错误');
  }

  const { username, password, name, userType, roleId } = body;

  if (!username?.trim() || !password || !name?.trim()) {
    return error(400, '用户名、密码和姓名不能为空');
  }

  if (!['A', 'B'].includes(userType)) {
    return error(400, '用户类型必须为 A 或 B');
  }

  if (password.length < 6) {
    return error(400, '密码长度不能少于 6 位');
  }

  // 检查用户名唯一性
  const exists = await env.DB.prepare(
    'SELECT id FROM users WHERE username = ?'
  ).bind(username.trim()).first();

  if (exists) {
    return error(409, '用户名已存在');
  }

  // 验证角色存在
  if (roleId) {
    const role = await env.DB.prepare('SELECT id FROM roles WHERE id = ?')
      .bind(roleId).first();
    if (!role) return error(400, '指定的角色不存在');
  }

  const hashed = await hash(password, 10);

  const result = await env.DB.prepare(`
    INSERT INTO users (username, password, name, user_type, role_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    username.trim(),
    hashed,
    name.trim(),
    userType,
    roleId || null,
    currentUser.sub,
  ).run();

  return json({
    code: 200,
    message: '用户创建成功',
    data: { userId: result.meta?.last_row_id },
  });
}

/**
 * PUT /api/admin/users/:id
 */
export async function handleEditUser(request: Request, env: Env) {
  const url = new URL(request.url);
  const userId = parseInt(url.pathname.split('/')[4], 10);

  if (isNaN(userId)) return error(400, '无效的用户 ID');

  let body: EditUserBody;
  try {
    body = await request.json() as EditUserBody;
  } catch {
    return error(400, '请求体格式错误');
  }

  const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?')
    .bind(userId).first();
  if (!user) return error(404, '用户不存在');

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (body.name?.trim()) {
    updates.push('name = ?');
    values.push(body.name.trim());
  }
  if (body.userType && ['A', 'B'].includes(body.userType)) {
    updates.push('user_type = ?');
    values.push(body.userType);
  }

  if (updates.length === 0) return error(400, '没有可更新的字段');

  values.push(userId);
  await env.DB.prepare(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  return json({ code: 200, message: '用户信息已更新', data: null });
}

/**
 * PUT /api/admin/users/:id/disable
 */
export async function handleDisableUser(request: Request, env: Env) {
  const currentUser = (request as AuthedRequest).user;
  const url = new URL(request.url);
  const userId = parseInt(url.pathname.split('/')[4], 10);

  if (isNaN(userId)) return error(400, '无效的用户 ID');

  // 禁止禁用自己
  if (userId === currentUser.sub) {
    return error(400, '不能禁用自己的账号');
  }

  const user = await env.DB.prepare('SELECT id, status FROM users WHERE id = ?')
    .bind(userId).first<{ id: number; status: number }>();

  if (!user) return error(404, '用户不存在');

  // 切换状态（启用/禁用）
  const newStatus = user.status === 1 ? 0 : 1;
  await env.DB.prepare('UPDATE users SET status = ? WHERE id = ?')
    .bind(newStatus, userId).run();

  return json({
    code: 200,
    message: newStatus === 1 ? '用户已启用' : '用户已禁用',
    data: { userId, status: newStatus },
  });
}

/**
 * PUT /api/admin/users/:id/role
 */
export async function handleAssignRole(request: Request, env: Env) {
  const url = new URL(request.url);
  const userId = parseInt(url.pathname.split('/')[4], 10);

  if (isNaN(userId)) return error(400, '无效的用户 ID');

  let body: { roleId: number };
  try {
    body = await request.json() as typeof body;
  } catch {
    return error(400, '请求体格式错误');
  }

  if (!body.roleId) return error(400, '角色 ID 不能为空');

  // 验证用户和角色存在
  const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?')
    .bind(userId).first();
  if (!user) return error(404, '用户不存在');

  const role = await env.DB.prepare('SELECT id, name FROM roles WHERE id = ?')
    .bind(body.roleId).first<{ id: number; name: string }>();
  if (!role) return error(404, '角色不存在');

  await env.DB.prepare('UPDATE users SET role_id = ? WHERE id = ?')
    .bind(body.roleId, userId).run();

  return json({
    code: 200,
    message: `已分配角色「${role.name}」`,
    data: null,
  });
}

// ===== 角色管理 =====

/**
 * GET /api/admin/roles
 */
export async function handleListRoles(_request: Request, env: Env) {
  const roles = await env.DB.prepare(
    'SELECT id, name, permissions, is_preset, created_at FROM roles ORDER BY id ASC'
  ).all();

  // 解析 permissions JSON
  const parsed = roles.results.map((r: Record<string, unknown>) => ({
    ...r,
    permissions: JSON.parse((r.permissions as string) || '[]'),
  }));

  return json({ code: 200, message: 'success', data: parsed });
}

/**
 * POST /api/admin/roles
 */
export async function handleCreateRole(request: Request, env: Env) {
  let body: CreateRoleBody;
  try {
    body = await request.json() as CreateRoleBody;
  } catch {
    return error(400, '请求体格式错误');
  }

  if (!body.name?.trim()) return error(400, '角色名不能为空');

  const exists = await env.DB.prepare('SELECT id FROM roles WHERE name = ?')
    .bind(body.name.trim()).first();
  if (exists) return error(409, '角色名已存在');

  const result = await env.DB.prepare(
    'INSERT INTO roles (name, permissions) VALUES (?, ?)'
  ).bind(body.name.trim(), JSON.stringify(body.permissions || [])).run();

  return json({
    code: 200,
    message: '角色创建成功',
    data: { roleId: result.meta?.last_row_id },
  });
}

/**
 * PUT /api/admin/roles/:id
 */
export async function handleEditRole(request: Request, env: Env) {
  const url = new URL(request.url);
  const roleId = parseInt(url.pathname.split('/')[4], 10);

  if (isNaN(roleId)) return error(400, '无效的角色 ID');

  let body: EditRoleBody;
  try {
    body = await request.json() as EditRoleBody;
  } catch {
    return error(400, '请求体格式错误');
  }

  const role = await env.DB.prepare('SELECT id FROM roles WHERE id = ?')
    .bind(roleId).first();
  if (!role) return error(404, '角色不存在');

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (body.name?.trim()) {
    updates.push('name = ?');
    values.push(body.name.trim());
  }
  if (body.permissions) {
    updates.push('permissions = ?');
    values.push(JSON.stringify(body.permissions));
  }

  if (updates.length === 0) return error(400, '没有可更新的字段');

  values.push(roleId);
  await env.DB.prepare(
    `UPDATE roles SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  return json({ code: 200, message: '角色已更新', data: null });
}

/**
 * DELETE /api/admin/roles/:id
 */
export async function handleDeleteRole(_request: Request, env: Env) {
  const url = new URL(_request.url);
  const roleId = parseInt(url.pathname.split('/')[4], 10);

  if (isNaN(roleId)) return error(400, '无效的角色 ID');

  const role = await env.DB.prepare('SELECT id, is_preset FROM roles WHERE id = ?')
    .bind(roleId).first<{ id: number; is_preset: number }>();

  if (!role) return error(404, '角色不存在');
  if (role.is_preset === 1) return error(400, '预设角色不可删除');

  // 检查是否有用户关联
  const userCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM users WHERE role_id = ?'
  ).bind(roleId).first<{ count: number }>();

  if (userCount && userCount.count > 0) {
    return error(400, `该角色下还有 ${userCount.count} 个用户，请先转移用户角色`);
  }

  await env.DB.prepare('DELETE FROM roles WHERE id = ?').bind(roleId).run();

  return json({ code: 200, message: '角色已删除', data: null });
}
