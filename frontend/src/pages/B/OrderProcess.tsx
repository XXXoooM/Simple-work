import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Play, CheckCircle, Loader2, ListTodo, User, Calendar } from 'lucide-react';

interface ActiveOrder {
  id: number;
  order_title: string;
  order_content: string | null;
  sender_name: string;
  order_date: string;
  status: string;
  received_at: string | null;
  processing_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; nextStatus: string | null; nextLabel: string; nextIcon: typeof Play }> = {
  RECEIVED: {
    label: '已接收',
    variant: 'secondary',
    nextStatus: 'PROCESSING',
    nextLabel: '开始处理',
    nextIcon: Play,
  },
  PROCESSING: {
    label: '处理中',
    variant: 'default',
    nextStatus: 'COMPLETED',
    nextLabel: '标记完成',
    nextIcon: CheckCircle,
  },
};

export default function OrderProcess() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // 完成确认弹窗
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeOrderId, setCompleteOrderId] = useState<number | null>(null);
  const [completeRemark, setCompleteRemark] = useState('');

  const fetchActiveOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/b/orders/active');
      setOrders(res.data.data);
    } catch {
      toast.error('获取进行中订单失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveOrders();
  }, [fetchActiveOrders]);

  const handleStatusUpdate = async (orderId: number, newStatus: string, remark?: string) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/api/b/orders/${orderId}/status`, { status: newStatus, remark });

      if (newStatus === 'COMPLETED') {
        toast.success('订单已完成');
        // 完成后从列表移除
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        toast.success('状态已更新');
        // 更新本地状态
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        '更新失败';
      toast.error(message);
    } finally {
      setUpdatingId(null);
      setCompleteOpen(false);
      setCompleteOrderId(null);
      setCompleteRemark('');
    }
  };

  return (
    <div>
      <title>进行中订单 - 部门协作下单系统</title>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/b')}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        返回工作台
      </Button>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">进行中订单</h2>
          <p className="text-sm text-muted-foreground">
            共 {orders.length} 个进行中订单
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchActiveOrders} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '刷新'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-20 text-center">
          <ListTodo className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">暂无进行中订单</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => navigate('/b/receive')}
          >
            查看待接收订单
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const config = STATUS_CONFIG[order.status];
            if (!config) return null;
            const NextIcon = config.nextIcon;

            return (
              <Card
                key={order.id}
                className="transition-all duration-200 hover:shadow-sm"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {order.order_title}
                        <Badge variant={config.variant}>{config.label}</Badge>
                        <Badge variant="outline" className="text-xs font-normal">
                          #{order.id}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1.5 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {order.sender_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {order.order_date}
                        </span>
                      </CardDescription>
                    </div>
                    {config.nextStatus && (
                      <Button
                        size="sm"
                        variant={order.status === 'PROCESSING' ? 'default' : 'secondary'}
                        onClick={() => {
                          if (config.nextStatus === 'COMPLETED') {
                            setCompleteOrderId(order.id);
                            setCompleteOpen(true);
                          } else {
                            handleStatusUpdate(order.id, config.nextStatus!);
                          }
                        }}
                        disabled={updatingId === order.id}
                        className="ml-4 transition-all duration-200"
                      >
                        {updatingId === order.id ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <NextIcon className="mr-1.5 h-4 w-4" />
                        )}
                        {config.nextLabel}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {order.order_content && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {order.order_content}
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* 完成确认 Dialog */}
      <Dialog open={completeOpen} onOpenChange={(v) => { if (!v) { setCompleteOpen(false); setCompleteRemark(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认完成订单</DialogTitle>
            <DialogDescription>标记完成后订单将从进行中列表移除。</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="留言备注（可选）"
              value={completeRemark}
              onChange={(e) => setCompleteRemark(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCompleteOpen(false); setCompleteRemark(''); }}>取消</Button>
            <Button
              onClick={() => completeOrderId && handleStatusUpdate(completeOrderId, 'COMPLETED', completeRemark)}
              disabled={updatingId !== null}
            >
              {updatingId !== null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              确认完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
