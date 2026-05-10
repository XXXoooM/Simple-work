import { Button, Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { Plus, History, ClipboardList, BarChart3, ScrollText } from 'lucide-react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import NotificationBell from '@/components/NotificationBell';
import UserNav from '@/components/UserNav';

export default function DashboardA() {
  const navigate = useNavigate();
  const location = useLocation();

  const isRoot = location.pathname === '/a';

  return (
    <div className="min-h-screen bg-background">
      <title>A 端工作台 - 部门协作下单系统</title>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-divider bg-content1/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              下单工作台
            </h1>
            <Divider orientation="vertical" className="h-6" />
            <nav className="flex items-center gap-1">
              <Button
                variant={location.pathname === '/a/create' ? 'flat' : 'light'}
                color={location.pathname === '/a/create' ? 'primary' : 'default'}
                size="sm"
                onPress={() => navigate('/a/create')}
                className="transition-all duration-200 font-medium"
                startContent={<Plus className="h-4 w-4" />}
              >
                创建订单
              </Button>
              <Button
                variant={location.pathname === '/a/history' ? 'flat' : 'light'}
                color={location.pathname === '/a/history' ? 'primary' : 'default'}
                size="sm"
                onPress={() => navigate('/a/history')}
                className="transition-all duration-200 font-medium"
                startContent={<History className="h-4 w-4" />}
              >
                历史订单
              </Button>
              <Button
                variant={location.pathname === '/a/stats' ? 'flat' : 'light'}
                color={location.pathname === '/a/stats' ? 'primary' : 'default'}
                size="sm"
                onPress={() => navigate('/a/stats')}
                className="transition-all duration-200 font-medium"
                startContent={<BarChart3 className="h-4 w-4" />}
              >
                统计看板
              </Button>
              <Button
                variant={location.pathname === '/a/logs' ? 'flat' : 'light'}
                color={location.pathname === '/a/logs' ? 'primary' : 'default'}
                size="sm"
                onPress={() => navigate('/a/logs')}
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
              onPress={() => navigate('/a/create')}
              className="border border-transparent hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <CardHeader className="flex gap-3 px-6 pt-6 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-base font-semibold text-foreground">创建订单</p>
                  <p className="text-sm text-default-500">选择接收人，填写订单信息</p>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6 pt-2">
                <p className="text-sm text-default-400">
                  选择日期和 B 端人员，创建新的协作订单。
                </p>
              </CardBody>
            </Card>

            <Card
              isPressable
              onPress={() => navigate('/a/history')}
              className="border border-transparent hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <CardHeader className="flex gap-3 px-6 pt-6 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <History className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-base font-semibold text-foreground">历史订单</p>
                  <p className="text-sm text-default-500">查看全部订单记录与状态</p>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6 pt-2">
                <p className="text-sm text-default-400">
                  查看所有已创建的订单，跟踪处理进度。
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
