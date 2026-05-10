import { Button, Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { Users, Shield, Settings, BarChart3, ScrollText } from 'lucide-react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import UserNav from '@/components/UserNav';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const isRoot = location.pathname === '/admin';

  return (
    <div className="min-h-screen bg-background">
      <title>管理后台 - 部门协作下单系统</title>

      <header className="sticky top-0 z-50 border-b border-divider bg-content1/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5" />
              管理后台
            </h1>
            <Divider orientation="vertical" className="h-6" />
            <nav className="flex items-center gap-1">
              <Button
                variant={location.pathname === '/admin/users' ? 'flat' : 'light'}
                color={location.pathname === '/admin/users' ? 'primary' : 'default'}
                size="sm"
                onPress={() => navigate('/admin/users')}
                className="transition-all duration-200 font-medium"
                startContent={<Users className="h-4 w-4" />}
              >
                用户管理
              </Button>
              <Button
                variant={location.pathname === '/admin/roles' ? 'flat' : 'light'}
                color={location.pathname === '/admin/roles' ? 'primary' : 'default'}
                size="sm"
                onPress={() => navigate('/admin/roles')}
                className="transition-all duration-200 font-medium"
                startContent={<Shield className="h-4 w-4" />}
              >
                角色管理
              </Button>
              <Button
                variant={location.pathname === '/admin/stats' ? 'flat' : 'light'}
                color={location.pathname === '/admin/stats' ? 'primary' : 'default'}
                size="sm"
                onPress={() => navigate('/admin/stats')}
                className="transition-all duration-200 font-medium"
                startContent={<BarChart3 className="h-4 w-4" />}
              >
                统计看板
              </Button>
              <Button
                variant={location.pathname === '/admin/logs' ? 'flat' : 'light'}
                color={location.pathname === '/admin/logs' ? 'primary' : 'default'}
                size="sm"
                onPress={() => navigate('/admin/logs')}
                className="transition-all duration-200 font-medium"
                startContent={<ScrollText className="h-4 w-4" />}
              >
                操作日志
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <UserNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        {isRoot ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card
              isPressable
              onPress={() => navigate('/admin/users')}
              className="border border-transparent hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <CardHeader className="flex gap-3 px-6 pt-6 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                  <Users className="h-5 w-5 text-violet-600" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-base font-semibold text-foreground">用户管理</p>
                  <p className="text-sm text-default-500">创建、编辑和管理系统用户</p>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6 pt-2">
                <p className="text-sm text-default-400">
                  管理 A 端和 B 端用户，分配角色和权限。
                </p>
              </CardBody>
            </Card>

            <Card
              isPressable
              onPress={() => navigate('/admin/roles')}
              className="border border-transparent hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <CardHeader className="flex gap-3 px-6 pt-6 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-base font-semibold text-foreground">角色管理</p>
                  <p className="text-sm text-default-500">管理角色和权限配置</p>
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6 pt-2">
                <p className="text-sm text-default-400">
                  创建和编辑角色，配置细粒度权限。
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
