import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Check, Loader2, Inbox, User, Calendar } from 'lucide-react';

interface PendingOrder {
  id: number;
  order_title: string;
  order_content: string | null;
  sender_name: string;
  order_date: string;
  created_at: string;
}

export default function OrderReceive() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [receivingId, setReceivingId] = useState<number | null>(null);

  const fetchPendingOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/b/orders/pending');
      setOrders(res.data.data);
    } catch {
      toast.error('获取待接收订单失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

  const handleReceive = async (orderId: number) => {
    setReceivingId(orderId);
    try {
      await api.put(`/api/b/orders/${orderId}/receive`);
      toast.success('订单已接收');
      // 从列表中移除
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        '接收失败';
      toast.error(message);
    } finally {
      setReceivingId(null);
    }
  };

  return (
    <div>
      <title>待接收订单 - 部门协作下单系统</title>

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
          <h2 className="text-lg font-semibold text-foreground">待接收订单</h2>
          <p className="text-sm text-muted-foreground">
            共 {orders.length} 个待接收订单
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPendingOrders} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '刷新'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-20 text-center">
          <Inbox className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">暂无待接收订单</p>
          <p className="text-xs text-muted-foreground/70 mt-1">新订单到达后会自动出现在此处</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="transition-all duration-200 hover:shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {order.order_title}
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
                  <Button
                    size="sm"
                    onClick={() => handleReceive(order.id)}
                    disabled={receivingId === order.id}
                    className="ml-4 transition-all duration-200"
                  >
                    {receivingId === order.id ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-1.5 h-4 w-4" />
                    )}
                    接收
                  </Button>
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
          ))}
        </div>
      )}
    </div>
  );
}
