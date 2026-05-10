import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Spinner } from '@heroui/react';
import { FileText, Clock, Loader2, CheckCircle2, BarChart3 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import api from '@/lib/api';

interface StatsData {
  counts: { total: number; pending: number; received: number; processing: number; completed: number };
  trend: { date: string; count: number }[];
  receivers: { name: string; count: number }[];
}

const COLORS = ['hsl(220, 90%, 56%)', 'hsl(160, 60%, 45%)', 'hsl(30, 90%, 56%)', 'hsl(280, 60%, 55%)', 'hsl(0, 70%, 55%)', 'hsl(200, 70%, 50%)', 'hsl(340, 65%, 50%)', 'hsl(100, 50%, 45%)'];

export default function StatsA() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/a/stats')
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

  const completionRate = data.counts.total > 0
    ? Math.round((data.counts.completed / data.counts.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        下单统计
      </h2>

      {/* 数字卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-default-500">总订单</p>
            <FileText className="h-4 w-4 text-default-500" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-3xl font-bold">{data.counts.total}</div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-default-500">待处理</p>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-3xl font-bold text-warning">
              {data.counts.pending + data.counts.received}
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-default-500">进行中</p>
            <Loader2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-3xl font-bold text-primary">{data.counts.processing}</div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-default-500">已完成</p>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-3xl font-bold text-success">{data.counts.completed}</div>
            <p className="text-xs text-default-400 mt-1">完成率 {completionRate}%</p>
          </CardBody>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 近 7 天趋势 */}
        <Card className="shadow-sm">
          <CardHeader>
            <p className="text-base font-semibold">近 7 天下单趋势</p>
          </CardHeader>
          <CardBody>
            {data.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-divider" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--heroui-divider))', background: 'hsl(var(--heroui-content1))' }}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--heroui-primary))" strokeWidth={2} dot={{ r: 4 }} name="订单数" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-default-400 text-sm">暂无数据</div>
            )}
          </CardBody>
        </Card>

        {/* 按接收人分布 */}
        <Card className="shadow-sm">
          <CardHeader>
            <p className="text-base font-semibold">接收人分布</p>
          </CardHeader>
          <CardBody>
            {data.receivers.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.receivers} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-divider" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--heroui-divider))', background: 'hsl(var(--heroui-content1))' }}
                  />
                  <Bar dataKey="count" name="订单数" radius={[0, 4, 4, 0]}>
                    {data.receivers.map((_: unknown, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-default-400 text-sm">暂无数据</div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
