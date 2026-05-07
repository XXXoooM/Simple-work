import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthGuard from '@/components/AuthGuard';
import Login from '@/pages/Login';
import DashboardA from '@/pages/A/Dashboard';
import OrderCreate from '@/pages/A/OrderCreate';
import OrderHistory from '@/pages/A/OrderHistory';
import StatsA from '@/pages/A/Stats';
import LogsA from '@/pages/A/Logs';
import DashboardB from '@/pages/B/Dashboard';
import OrderReceive from '@/pages/B/OrderReceive';
import OrderProcess from '@/pages/B/OrderProcess';
import StatsB from '@/pages/B/Stats';
import LogsB from '@/pages/B/Logs';
import AdminDashboard from '@/pages/Admin/Dashboard';
import UserList from '@/pages/Admin/UserList';
import RoleList from '@/pages/Admin/RoleList';
import StatsAdmin from '@/pages/Admin/Stats';
import LogsAdmin from '@/pages/Admin/Logs';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },

  // A 端路由
  {
    element: <AuthGuard requiredType="A" />,
    children: [
      {
        path: '/a',
        element: <DashboardA />,
        children: [
          { path: 'create', element: <OrderCreate /> },
          { path: 'history', element: <OrderHistory /> },
          { path: 'stats', element: <StatsA /> },
          { path: 'logs', element: <LogsA /> },
        ],
      },
    ],
  },

  // B 端路由
  {
    element: <AuthGuard requiredType="B" />,
    children: [
      {
        path: '/b',
        element: <DashboardB />,
        children: [
          { path: 'receive', element: <OrderReceive /> },
          { path: 'process', element: <OrderProcess /> },
          { path: 'stats', element: <StatsB /> },
          { path: 'logs', element: <LogsB /> },
        ],
      },
    ],
  },

  // 管理后台路由
  {
    element: <AuthGuard requiredPermissions={['user:list']} />,
    children: [
      {
        path: '/admin',
        element: <AdminDashboard />,
        children: [
          { path: 'users', element: <UserList /> },
          { path: 'roles', element: <RoleList /> },
          { path: 'stats', element: <StatsAdmin /> },
          { path: 'logs', element: <LogsAdmin /> },
        ],
      },
    ],
  },

  // 根路径跳转
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },

  // 404
  {
    path: '*',
    element: (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <p className="mt-2 text-muted-foreground">页面不存在</p>
        </div>
      </div>
    ),
  },
]);

