import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LogOut, Users, Shield, Settings, BarChart3, ScrollText } from 'lucide-react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isRoot = location.pathname === '/admin';

  return (
    <div className="min-h-screen bg-background">
      <title>管理后台 - 部门协作下单系统</title>

      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5" />
              管理后台
            </h1>
            <Separator orientation="vertical" className="h-6" />
            <nav className="flex items-center gap-1">
              <Button
                variant={location.pathname === '/admin/users' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/admin/users')}
                className="transition-all duration-200"
              >
                <Users className="mr-1.5 h-4 w-4" />
                用户管理
              </Button>
              <Button
                variant={location.pathname === '/admin/roles' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/admin/roles')}
                className="transition-all duration-200"
              >
                <Shield className="mr-1.5 h-4 w-4" />
                角色管理
              </Button>
              <Button
                variant={location.pathname === '/admin/stats' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/admin/stats')}
                className="transition-all duration-200"
              >
                <BarChart3 className="mr-1.5 h-4 w-4" />
                统计看板
              </Button>
              <Button
                variant={location.pathname === '/admin/logs' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/admin/logs')}
                className="transition-all duration-200"
              >
                <ScrollText className="mr-1.5 h-4 w-4" />
                操作日志
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              退出
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        {isRoot ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
              onClick={() => navigate('/admin/users')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                    <Users className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">用户管理</CardTitle>
                    <CardDescription>创建、编辑和管理系统用户</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  管理 A 端和 B 端用户，分配角色和权限。
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
              onClick={() => navigate('/admin/roles')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Shield className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">角色管理</CardTitle>
                    <CardDescription>管理角色和权限配置</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  创建和编辑角色，配置细粒度权限。
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
