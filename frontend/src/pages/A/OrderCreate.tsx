import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button, Card, CardBody, CardHeader, Input, Textarea, Select, SelectItem, Spinner } from '@heroui/react';
import { toast } from 'sonner';
import { Send, ArrowLeft } from 'lucide-react';

interface Receiver {
  id: number;
  username: string;
  name: string;
}

export default function OrderCreate() {
  const navigate = useNavigate();
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 表单状态
  const [receiverId, setReceiverId] = useState('');
  const [orderTitle, setOrderTitle] = useState('');
  const [orderContent, setOrderContent] = useState('');
  const [orderDate, setOrderDate] = useState(() => {
    // 默认为今天
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // 加载 B 端用户列表
  const fetchReceivers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/a/receivers');
      setReceivers(res.data.data);
    } catch {
      toast.error('获取接收人列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceivers();
  }, [fetchReceivers]);

  // 提交订单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiverId) {
      toast.error('请选择接收人');
      return;
    }
    if (!orderTitle.trim()) {
      toast.error('请填写订单标题');
      return;
    }
    if (!orderDate) {
      toast.error('请选择日期');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/api/a/orders', {
        receiverId: parseInt(receiverId, 10),
        orderTitle: orderTitle.trim(),
        orderContent: orderContent.trim() || undefined,
        orderDate,
        idempotencyKey: crypto.randomUUID(),
      });

      toast.success('订单创建成功', {
        description: `已发送给 ${res.data.data.receiverName}`,
      });

      // 重置表单
      setReceiverId('');
      setOrderTitle('');
      setOrderContent('');
      setOrderDate(new Date().toISOString().split('T')[0]);

      // 跳转到历史订单
      navigate('/a/history');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        '创建订单失败';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = receiverId && orderTitle.trim() && orderDate;

  return (
    <div className="mx-auto max-w-2xl">
      <title>创建订单 - 部门协作下单系统</title>

      {/* 返回按钮 */}
      <Button
        variant="light"
        size="sm"
        onPress={() => navigate('/a')}
        className="mb-4 -ml-2 text-default-600"
        startContent={<ArrowLeft className="h-4 w-4" />}
      >
        返回工作台
      </Button>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col items-start px-6 pt-6 pb-2">
          <p className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Send className="h-5 w-5" />
            创建新订单
          </p>
          <p className="text-sm text-default-500 mt-1">
            选择接收人并填写订单信息，提交后接收人将立即收到通知。
          </p>
        </CardHeader>
        <CardBody className="px-6 pb-6 pt-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* 日期选择 */}
            <Input
              type="date"
              label="订单日期"
              variant="bordered"
              value={orderDate}
              onValueChange={setOrderDate}
              isRequired
              labelPlacement="outside"
              placeholder="选择日期"
            />

            {/* 接收人选择 */}
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-default-500 py-2">
                <Spinner size="sm" />
                加载中...
              </div>
            ) : receivers.length === 0 ? (
              <p className="text-sm text-default-500 py-2">
                暂无可用的 B 端用户，请联系管理员添加。
              </p>
            ) : (
              <Select
                label="接收人（B 端）"
                variant="bordered"
                placeholder="选择接收人..."
                selectedKeys={receiverId ? new Set([receiverId]) : new Set()}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setReceiverId(key);
                }}
                isRequired
                labelPlacement="outside"
              >
                {receivers.map((r) => (
                  <SelectItem key={String(r.id)} textValue={`${r.name}（${r.username}）`}>
                    {r.name} <span className="text-default-400">({r.username})</span>
                  </SelectItem>
                ))}
              </Select>
            )}

            {/* 订单标题 */}
            <Input
              label="订单标题"
              variant="bordered"
              placeholder="例如：4月29日剪辑任务"
              value={orderTitle}
              onValueChange={setOrderTitle}
              maxLength={100}
              isRequired
              labelPlacement="outside"
            />

            {/* 订单内容（可选） */}
            <Textarea
              label="订单详情（可选）"
              variant="bordered"
              placeholder="填写需要特别说明的内容..."
              value={orderContent}
              onValueChange={setOrderContent}
              maxLength={2000}
              minRows={4}
              labelPlacement="outside"
            />

            {/* 提交按钮 */}
            <Button
              type="submit"
              color="primary"
              className="w-full mt-2"
              isLoading={submitting}
              isDisabled={!isFormValid}
              startContent={!submitting && <Send className="h-4 w-4" />}
            >
              {submitting ? '提交中...' : '提交订单'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
