import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总订单</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.counts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">待处理</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {data.counts.pending + data.counts.received}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">进行中</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{data.counts.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">已完成</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{data.counts.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">完成率 {completionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 近 7 天趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">近 7 天下单趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {data.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Line type="monotone" dataKey="count" stroke="hsl(220, 90%, 56%)" strokeWidth={2} dot={{ r: 4 }} name="订单数" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">暂无数据</div>
            )}
          </CardContent>
        </Card>

        {/* 按接收人分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">接收人分布</CardTitle>
          </CardHeader>
          <CardContent>
            {data.receivers.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.receivers} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                  />
                  <Bar dataKey="count" name="订单数" radius={[0, 4, 4, 0]}>
                    {data.receivers.map((_: unknown, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">暂无数据</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
