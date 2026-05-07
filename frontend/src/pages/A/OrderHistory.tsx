import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Inbox } from 'lucide-react';

interface Order {
  id: number;
  order_title: string;
  order_content: string | null;
  receiver_name: string;
  order_date: string;
  status: string;
  created_at: string;
  received_at: string | null;
  processing_at: string | null;
  completed_at: string | null;
}

interface Pagination {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  PENDING: { label: '待接收', variant: 'outline' },
  RECEIVED: { label: '已接收', variant: 'secondary' },
  PROCESSING: { label: '处理中', variant: 'default' },
  COMPLETED: { label: '已完成', variant: 'secondary' },
};

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    size: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/a/orders?page=${page}&size=10`);
      setOrders(res.data.data.list);
      setPagination(res.data.data.pagination);
    } catch {
      toast.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchOrders(newPage);
  };

  return (
    <div>
      <title>历史订单 - 部门协作下单系统</title>

      {/* 返回按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/a')}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        返回工作台
      </Button>

      <div className="rounded-xl border border-border bg-card">
        {/* 表格标题 */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">历史订单</h2>
            <p className="text-sm text-muted-foreground">
              共 {pagination.total} 条记录
            </p>
          </div>
          <Button size="sm" onClick={() => navigate('/a/create')}>
            创建订单
          </Button>
        </div>

        {/* 表格 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Inbox className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">暂无订单记录</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => navigate('/a/create')}
            >
              创建第一个订单
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>接收人</TableHead>
                  <TableHead>订单日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const status = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
                  return (
                    <TableRow
                      key={order.id}
                      className="transition-colors duration-150"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{order.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.order_title}
                        {order.order_content && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {order.order_content}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{order.receiver_name || '用户已删除'}</TableCell>
                      <TableCell className="text-sm">{order.order_date}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(order.created_at + 'Z').toLocaleString('zh-CN')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <p className="text-sm text-muted-foreground">
                  第 {pagination.page}/{pagination.totalPages} 页
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
