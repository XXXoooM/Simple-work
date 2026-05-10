import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button, Card, CardBody, CardHeader, Chip, Spinner } from '@heroui/react';
import { toast } from 'sonner';
import { ArrowLeft, Check, Inbox, User, Calendar } from 'lucide-react';

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
        variant="light"
        size="sm"
        onPress={() => navigate('/b')}
        className="mb-4 -ml-2 text-default-600"
        startContent={<ArrowLeft className="h-4 w-4" />}
      >
        返回工作台
      </Button>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">待接收订单</h2>
          <p className="text-sm text-default-500">
            共 {orders.length} 个待接收订单
          </p>
        </div>
        <Button variant="bordered" size="sm" onPress={fetchPendingOrders} isLoading={loading}>
          {loading ? '刷新中' : '刷新'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" color="primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-divider bg-content1 py-20 text-center shadow-sm">
          <Inbox className="mx-auto h-12 w-12 text-default-400/50 mb-3" />
          <p className="text-sm text-default-500">暂无待接收订单</p>
          <p className="text-xs text-default-400 mt-1">新订单到达后会自动出现在此处</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="shadow-sm"
            >
              <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <p className="text-base font-semibold flex items-center gap-2">
                      {order.order_title}
                      <Chip variant="flat" size="sm" className="font-normal text-default-500">
                        #{order.id}
                      </Chip>
                    </p>
                    <div className="mt-1.5 flex items-center gap-4 text-sm text-default-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {order.sender_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {order.order_date}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    color="primary"
                    onPress={() => handleReceive(order.id)}
                    isLoading={receivingId === order.id}
                    className="ml-4 transition-all duration-200"
                    startContent={receivingId !== order.id && <Check className="h-4 w-4" />}
                  >
                    {receivingId === order.id ? '接收中' : '接收'}
                  </Button>
                </div>
              </CardHeader>
              {order.order_content && (
                <CardBody className="pt-0 px-6 pb-6">
                  <p className="text-sm text-default-500 whitespace-pre-wrap">
                    {order.order_content}
                  </p>
                </CardBody>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
