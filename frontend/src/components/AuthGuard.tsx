import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface AuthGuardProps {
  requiredType?: 'A' | 'B';
  requiredPermissions?: string[];
}

/**
 * 路由守卫组件
 * - 未登录 → 跳转 /login
 * - 已登录但类型不匹配 → 跳转到对应工作台
 * - 已登录且权限不足 → 显示无权限
 */
export default function AuthGuard({ requiredType, requiredPermissions }: AuthGuardProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 超管通配符可访问一切
  const isSuperAdmin = user.permissions.includes('*');

  // 用户类型校验
  if (requiredType && user.userType !== requiredType && !isSuperAdmin) {
    const target = user.userType === 'A' ? '/a' : '/b';
    return <Navigate to={target} replace />;
  }

  // 权限校验（AND 逻辑）
  if (requiredPermissions && requiredPermissions.length > 0 && !isSuperAdmin) {
    const hasAll = requiredPermissions.every((p) => user.permissions.includes(p));
    if (!hasAll) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">无权限访问</h2>
            <p className="mt-2 text-muted-foreground">您没有访问此页面的权限</p>
          </div>
        </div>
      );
    }
  }

  return <Outlet />;
}
