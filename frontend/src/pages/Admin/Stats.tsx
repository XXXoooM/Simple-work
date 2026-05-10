import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Spinner } from '@heroui/react';
import { FileText, Users, BarChart3 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';
import api from '@/lib/api';

interface AdminStatsData {
  orderCounts: { total: number; pending: number; received: number; processing: number; completed: number };
  userCounts: { total: number; typeA: number; typeB: number };
  trend: { date: string; count: number }[];
  topSenders: { name: string; count: number }[];
  topReceivers: { name: string; count: number }[];
}

const BAR_COLORS = ['hsl(var(--heroui-primary))', 'hsl(var(--heroui-secondary))', 'hsl(var(--heroui-success))', 'hsl(var(--heroui-warning))', 'hsl(var(--heroui-danger))', 'hsl(200, 70%, 50%)', 'hsl(340, 65%, 50%)', 'hsl(100, 50%, 45%)', 'hsl(50, 80%, 50%)', 'hsl(260, 50%, 60%)'];

const PIE_COLORS = ['hsl(var(--heroui-warning))', 'hsl(var(--heroui-primary))', 'hsl(var(--heroui-secondary))', 'hsl(var(--heroui-success))'];

export default function StatsAdmin() {
  const [data, setData] = useState<AdminStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/stats')
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!data) return null;

  const statusPieData = [
    { name: '待处理', value: data.orderCounts.pending },
    { name: '已接收', value: data.orderCounts.received },
    { name: '处理中', value: data.orderCounts.processing },
    { name: '已完成', value: data.orderCounts.completed },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        系统统计总览
      </h2>

      {/* 数字卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-default-500">总订单</p>
            <FileText className="h-4 w-4 text-default-500" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-3xl font-bold">{data.orderCounts.total}</div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-default-500">活跃用户</p>
            <Users className="h-4 w-4 text-default-500" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-3xl font-bold">{data.userCounts.total}</div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-default-500">A 端用户</p>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-3xl font-bold text-primary">{data.userCounts.typeA}</div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-default-500">B 端用户</p>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-3xl font-bold text-success">{data.userCounts.typeB}</div>
          </CardBody>
        </Card>
      </div>

      {/* 订单状态饼图 + 30 天趋势 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <p className="text-base font-semibold">订单状态分布</p>
          </CardHeader>
          <CardBody>
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {statusPieData.map((_: unknown, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--heroui-divider))', background: 'hsl(var(--heroui-content1))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-default-400 text-sm">暂无数据</div>
            )}
          </CardBody>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <p className="text-base font-semibold">近 30 天订单趋势</p>
          </CardHeader>
          <CardBody>
            {data.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-divider" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--heroui-divider))', background: 'hsl(var(--heroui-content1))' }}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--heroui-primary))" strokeWidth={2} dot={false} name="订单数" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-default-400 text-sm">暂无数据</div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* 排行榜 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <p className="text-base font-semibold">A 端下单排行</p>
          </CardHeader>
          <CardBody>
            {data.topSenders.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topSenders} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-divider" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--heroui-divider))', background: 'hsl(var(--heroui-content1))' }} />
                  <Bar dataKey="count" name="下单数" radius={[0, 4, 4, 0]}>
                    {data.topSenders.map((_: unknown, i: number) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-default-400 text-sm">暂无数据</div>
            )}
          </CardBody>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <p className="text-base font-semibold">B 端接单排行</p>
          </CardHeader>
          <CardBody>
            {data.topReceivers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topReceivers} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-divider" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--heroui-divider))', background: 'hsl(var(--heroui-content1))' }} />
                  <Bar dataKey="count" name="接单数" radius={[0, 4, 4, 0]}>
                    {data.topReceivers.map((_: unknown, i: number) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-default-400 text-sm">暂无数据</div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
