-- 部门协作下单系统 数据库初始化脚本
-- 使用 `npm run db:init` 执行（本地）或 `npm run db:init:remote` 执行（远程）

-- 开启外键约束
PRAGMA foreign_keys = ON;

-- 角色表（必须先于 users 创建，因为 users.role_id 引用 roles.id）
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  permissions TEXT NOT NULL DEFAULT '[]',
  is_preset INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK(user_type IN ('A','B')),
  role_id INTEGER REFERENCES roles(id),
  status INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idempotency_key TEXT UNIQUE,
  order_title TEXT NOT NULL,
  order_content TEXT,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  receiver_id INTEGER NOT NULL REFERENCES users(id),
  order_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
         CHECK(status IN ('PENDING','RECEIVED','PROCESSING','COMPLETED')),
  created_at TEXT DEFAULT (datetime('now')),
  received_at TEXT,
  processing_at TEXT,
  completed_at TEXT
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_orders_receiver_status ON orders(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_sender ON orders(sender_id);
CREATE INDEX IF NOT EXISTS idx_users_type_status ON users(user_type, status);

-- updated_at 自动更新触发器
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
  AFTER UPDATE ON users
  FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- ============================
-- 初始化数据
-- ============================

INSERT OR IGNORE INTO roles (name, permissions, is_preset) VALUES
  ('超级管理员', '["*"]', 1),
  ('剪辑师', '[]', 1),
  ('运营', '[]', 1),
  ('子管理员', '["user:list","user:create","user:edit","role:list"]', 1);

-- 默认超管账号 admin / admin123
-- ⚠️ 部署前请替换为实际哈希值
INSERT OR IGNORE INTO users (username, password, name, user_type, role_id, created_by)
VALUES ('admin', '$2a$10$tiTwpbFaFnVv1fEFWTkQQ.0P9qDjIoppKNuJFX7YVVAxLH5zyP9De', '系统管理员', 'A', 1, 1);
