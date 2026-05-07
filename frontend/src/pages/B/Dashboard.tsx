
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Inbox, PlayCircle, Headphones, BarChart3, ScrollText } from 'lucide-react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useOrderWebSocket } from '@/hooks/useOrderWebSocket';
import NotificationBell from '@/components/NotificationBell';
import UserNav from '@/components/UserNav';

export default function DashboardB() {
  const navigate = useNavigate();

  // 实时 WebSocket 通知（B 端专属）
  useOrderWebSocket();
  const location = useLocation();

  const isRoot = location.pathname === '/b';

  return (
    <div className="min-h-screen bg-background">
      <title>B 端工作台 - 部门协作下单系统</title>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              接单工作台
            </h1>
            <Separator orientation="vertical" className="h-6" />
            <nav className="flex items-center gap-1">
              <Button
                variant={location.pathname === '/b/receive' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/b/receive')}
                className="transition-all duration-200"
              >
                <Inbox className="mr-1.5 h-4 w-4" />
                待接收
              </Button>
              <Button
                variant={location.pathname === '/b/process' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/b/process')}
                className="transition-all duration-200"
              >
                <PlayCircle className="mr-1.5 h-4 w-4" />
                进行中
              </Button>
              <Button
                variant={location.pathname === '/b/stats' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/b/stats')}
                className="transition-all duration-200"
              >
                <BarChart3 className="mr-1.5 h-4 w-4" />
                统计看板
              </Button>
              <Button
                variant={location.pathname === '/b/logs' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/b/logs')}
                className="transition-all duration-200"
              >
                <ScrollText className="mr-1.5 h-4 w-4" />
                操作日志
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <UserNav />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl p-6">
        {isRoot ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
              onClick={() => navigate('/b/receive')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    <Inbox className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">待接收订单</CardTitle>
                    <CardDescription>查看并接收新的订单</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  查看 A 端发来的订单，点击接收后开始处理。
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
              onClick={() => navigate('/b/process')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <PlayCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">进行中订单</CardTitle>
                    <CardDescription>处理已接收的订单</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  管理进行中的订单，更新处理状态至完成。
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
