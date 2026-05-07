import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LogOut, Plus, History, ClipboardList, BarChart3, ScrollText } from 'lucide-react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import NotificationBell from '@/components/NotificationBell';

export default function DashboardA() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isRoot = location.pathname === '/a';

  return (
    <div className="min-h-screen bg-background">
      <title>A 端工作台 - 部门协作下单系统</title>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              下单工作台
            </h1>
            <Separator orientation="vertical" className="h-6" />
            <nav className="flex items-center gap-1">
              <Button
                variant={location.pathname === '/a/create' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/a/create')}
                className="transition-all duration-200"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                创建订单
              </Button>
              <Button
                variant={location.pathname === '/a/history' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/a/history')}
                className="transition-all duration-200"
              >
                <History className="mr-1.5 h-4 w-4" />
                历史订单
              </Button>
              <Button
                variant={location.pathname === '/a/stats' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/a/stats')}
                className="transition-all duration-200"
              >
                <BarChart3 className="mr-1.5 h-4 w-4" />
                统计看板
              </Button>
              <Button
                variant={location.pathname === '/a/logs' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/a/logs')}
                className="transition-all duration-200"
              >
                <ScrollText className="mr-1.5 h-4 w-4" />
                操作日志
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="text-sm text-muted-foreground">
              {user?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              退出
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl p-6">
        {isRoot ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
              onClick={() => navigate('/a/create')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">创建订单</CardTitle>
                    <CardDescription>选择接收人，填写订单信息</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  选择日期和 B 端人员，创建新的协作订单。
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
              onClick={() => navigate('/a/history')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <History className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">历史订单</CardTitle>
                    <CardDescription>查看全部订单记录与状态</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  查看所有已创建的订单，跟踪处理进度。
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
