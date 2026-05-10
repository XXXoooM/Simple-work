import { Button, Card, CardBody, CardHeader, Divider } from '@heroui/react';
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
      <header className="sticky top-0 z-50 border-b border-divider bg-content1/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              接单工作台
            </h1>
            <Divider orientation="vertical" className="h-6" />
            <nav className="flex items-center gap-1">
              <Button
                variant={location.pathname === '/b/receive' ? 'flat' : 'light'}
                color={location.pathname === '/b/receive' ? 'primary' : 'default'}
                size="sm"
                onPress={() => navigate('/b/receive')}
                className="transition-all duration-200 font-medium"
                startContent={<Inbox className="h-4 w-4" />}
              >
                待接收
              </Button>
              <Button
                variant={location.pathname === '/b/process' ? 'flat' : 'light'}
                color={location.pathname === '/b/process' ? 'primary' : 'default'}
                size="sm"
                onPress={() => navigate('/b/process')}
                className="transition-all duration-200 font-medium"
                startContent={<PlayCircle className="h-4 w-4" />}
              >
                进行中
              </Button>
              <Button
                variant={location.pathname === '/b/stats' ? 'flat' : 'light'}
                color={location.pathname === '/b/stats' ? 'primary' : 'default'}
                size="sm"
                onPress={() => navigate('/b/stats')}
                className="transition-all duration-200 font-medium"
                startContent={<BarChart3 className="h-4 w-4" />}
              >
                统计看板
              </Button>
              <Button
                variant={location.pathname === '/b/logs' ? 'flat' : 'light'}
                color={location.pathname === '/b/logs' ? 'primary' : 'default'}
                size="sm"
                onPress={() => navigate('/b/logs')}
                className="transition-all duration-200 font-medium"
                startContent={<ScrollText className="h-4 w-4" />}
              >
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
              isPressable
              onPress={() => navigate('/b/receive')}
              className="border border-transparent hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <CardHeader className="flex gap-3 px-6 pt-6 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                  <Inbox className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-base font-semibold text-foreground">待接收订单</p>
                  <p className="text-sm text-default-500">查看并接收新的订单</p>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6 pt-2">
                <p className="text-sm text-default-400">
                  查看 A 端发来的订单，点击接收后开始处理。
                </p>
              </CardBody>
            </Card>

            <Card
              isPressable
              onPress={() => navigate('/b/process')}
              className="border border-transparent hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <CardHeader className="flex gap-3 px-6 pt-6 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <PlayCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-base font-semibold text-foreground">进行中订单</p>
                  <p className="text-sm text-default-500">处理已接收的订单</p>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6 pt-2">
                <p className="text-sm text-default-400">
                  管理进行中的订单，更新处理状态至完成。
                </p>
              </CardBody>
            </Card>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
