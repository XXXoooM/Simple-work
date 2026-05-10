import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button, Card, CardBody, CardHeader, Chip, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea } from '@heroui/react';
import { toast } from 'sonner';
import { ArrowLeft, Play, CheckCircle, ListTodo, User, Calendar } from 'lucide-react';

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

const STATUS_CONFIG: Record<string, { label: string; color: "default" | "primary" | "secondary" | "success" | "warning" | "danger"; nextStatus: string | null; nextLabel: string; nextIcon: typeof Play }> = {
  RECEIVED: {
    label: '已接收',
    color: 'primary',
    nextStatus: 'PROCESSING',
    nextLabel: '开始处理',
    nextIcon: Play,
  },
  PROCESSING: {
    label: '处理中',
    color: 'secondary',
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
          <h2 className="text-lg font-semibold text-foreground">进行中订单</h2>
          <p className="text-sm text-default-500">
            共 {orders.length} 个进行中订单
          </p>
        </div>
        <Button variant="bordered" size="sm" onPress={fetchActiveOrders} isLoading={loading}>
          {loading ? '刷新中' : '刷新'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" color="primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-divider bg-content1 py-20 text-center shadow-sm">
          <ListTodo className="mx-auto h-12 w-12 text-default-400/50 mb-3" />
          <p className="text-sm text-default-500">暂无进行中订单</p>
          <Button
            variant="flat"
            color="primary"
            size="sm"
            className="mt-4"
            onPress={() => navigate('/b/receive')}
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
                className="shadow-sm"
              >
                <CardHeader className="pb-3 px-6 pt-6">
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1">
                      <p className="text-base font-semibold flex items-center gap-2">
                        {order.order_title}
                        <Chip variant="flat" size="sm" color={config.color}>{config.label}</Chip>
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
                    {config.nextStatus && (
                      <Button
                        size="sm"
                        color={order.status === 'PROCESSING' ? 'primary' : 'secondary'}
                        variant={order.status === 'PROCESSING' ? 'solid' : 'flat'}
                        onPress={() => {
                          if (config.nextStatus === 'COMPLETED') {
                            setCompleteOrderId(order.id);
                            setCompleteOpen(true);
                          } else {
                            handleStatusUpdate(order.id, config.nextStatus!);
                          }
                        }}
                        isLoading={updatingId === order.id}
                        className="ml-4 transition-all duration-200"
                        startContent={updatingId !== order.id && <NextIcon className="h-4 w-4" />}
                      >
                        {updatingId === order.id ? '更新中' : config.nextLabel}
                      </Button>
                    )}
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
            );
          })}
        </div>
      )}

      {/* 完成确认 Modal */}
      <Modal 
        isOpen={completeOpen} 
        onOpenChange={(v) => { 
          if (!v) { 
            setCompleteOpen(false); 
            setCompleteRemark(''); 
          } 
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">确认完成订单</ModalHeader>
              <ModalBody>
                <p className="text-sm text-default-500">标记完成后订单将从进行中列表移除。</p>
                <div className="py-2">
                  <Textarea
                    variant="bordered"
                    placeholder="留言备注（可选）"
                    value={completeRemark}
                    onValueChange={setCompleteRemark}
                    minRows={3}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => { onClose(); setCompleteRemark(''); }}>取消</Button>
                <Button
                  color="primary"
                  onPress={() => completeOrderId && handleStatusUpdate(completeOrderId, 'COMPLETED', completeRemark)}
                  isLoading={updatingId !== null}
                  startContent={updatingId === null && <CheckCircle className="h-4 w-4" />}
                >
                  {updatingId !== null ? '确认中...' : '确认完成'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
