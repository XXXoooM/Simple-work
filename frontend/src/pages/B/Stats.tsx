import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Spinner } from '@heroui/react';
import { FileText, Clock, Loader2, CheckCircle2, BarChart3, Timer } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';

interface StatsData {
  counts: { total: number; pending: number; received: number; processing: number; completed: number };
  trend: { date: string; count: number }[];
  avgProcessSeconds: number;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m} 分钟`;
  return `${Math.round(seconds)} 秒`;
}

export default function StatsB() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/b/stats')
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
        接单统计
      </h2>

      {/* 数字卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-default-500">总接收</p>
            <FileText className="h-4 w-4 text-default-500" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-3xl font-bold">{data.counts.total}</div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-default-500">待接收</p>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-3xl font-bold text-warning">{data.counts.pending}</div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-default-500">处理中</p>
            <Loader2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-3xl font-bold text-primary">
              {data.counts.received + data.counts.processing}
            </div>
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
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-default-500">平均处理时长</p>
            <Timer className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-2xl font-bold text-secondary">
              {formatDuration(data.avgProcessSeconds)}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 趋势图 */}
      <Card className="shadow-sm">
        <CardHeader>
          <p className="text-base font-semibold">近 7 天接单趋势</p>
        </CardHeader>
        <CardBody>
          {data.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-divider" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--heroui-divider))', background: 'hsl(var(--heroui-content1))' }}
                  labelFormatter={(label) => `日期: ${label}`}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--heroui-secondary))" strokeWidth={2} dot={{ r: 4 }} name="接单数" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-default-400 text-sm">暂无数据</div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
