import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Send, Loader2, ArrowLeft } from 'lucide-react';

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
        variant="ghost"
        size="sm"
        onClick={() => navigate('/a')}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        返回工作台
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            创建新订单
          </CardTitle>
          <CardDescription>
            选择接收人并填写订单信息，提交后接收人将立即收到通知。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 日期选择 */}
            <div className="space-y-2">
              <Label htmlFor="orderDate">订单日期</Label>
              <Input
                id="orderDate"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
              />
            </div>

            {/* 接收人选择 */}
            <div className="space-y-2">
              <Label htmlFor="receiver">接收人（B 端）</Label>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载中...
                </div>
              ) : receivers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  暂无可用的 B 端用户，请联系管理员添加。
                </p>
              ) : (
                <Select value={receiverId} onValueChange={setReceiverId}>
                  <SelectTrigger id="receiver">
                    <SelectValue placeholder="选择接收人..." />
                  </SelectTrigger>
                  <SelectContent>
                    {receivers.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}（{r.username}）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 订单标题 */}
            <div className="space-y-2">
              <Label htmlFor="orderTitle">订单标题</Label>
              <Input
                id="orderTitle"
                placeholder="例如：4月29日剪辑任务"
                value={orderTitle}
                onChange={(e) => setOrderTitle(e.target.value)}
                maxLength={100}
                required
              />
            </div>

            {/* 订单内容（可选） */}
            <div className="space-y-2">
              <Label htmlFor="orderContent">
                订单详情 <span className="text-muted-foreground">（可选）</span>
              </Label>
              <Textarea
                id="orderContent"
                placeholder="填写需要特别说明的内容..."
                value={orderContent}
                onChange={(e) => setOrderContent(e.target.value)}
                maxLength={2000}
                rows={4}
              />
            </div>

            {/* 提交按钮 */}
            <Button
              type="submit"
              className="w-full transition-all duration-200"
              disabled={submitting || !isFormValid}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  提交订单
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
