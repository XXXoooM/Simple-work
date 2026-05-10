import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import {
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination as HeroPagination,
  Spinner,
} from '@heroui/react';
import { toast } from 'sonner';
import { ArrowLeft, Inbox } from 'lucide-react';

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

const STATUS_MAP: Record<string, { label: string; color: "default" | "primary" | "secondary" | "success" | "warning" | "danger" }> = {
  PENDING: { label: '待接收', color: 'warning' },
  RECEIVED: { label: '已接收', color: 'primary' },
  PROCESSING: { label: '处理中', color: 'secondary' },
  COMPLETED: { label: '已完成', color: 'success' },
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

  return (
    <div>
      <title>历史订单 - 部门协作下单系统</title>

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

      <div className="rounded-xl border border-divider bg-content1">
        {/* 表格标题 */}
        <div className="flex items-center justify-between border-b border-divider px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">历史订单</h2>
            <p className="text-sm text-default-500">
              共 {pagination.total} 条记录
            </p>
          </div>
          <Button size="sm" color="primary" onPress={() => navigate('/a/create')}>
            创建订单
          </Button>
        </div>

        {/* 表格 */}
        <div className="p-4">
          <Table
            aria-label="历史订单列表"
            bottomContent={
              pagination.totalPages > 0 ? (
                <div className="flex w-full justify-center">
                  <HeroPagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={pagination.page}
                    total={pagination.totalPages}
                    onChange={(page) => fetchOrders(page)}
                  />
                </div>
              ) : null
            }
            classNames={{
              wrapper: "min-h-[400px] shadow-none border-none",
            }}
          >
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>标题</TableColumn>
              <TableColumn>接收人</TableColumn>
              <TableColumn>订单日期</TableColumn>
              <TableColumn>状态</TableColumn>
              <TableColumn>创建时间</TableColumn>
            </TableHeader>
            <TableBody
              items={orders}
              isLoading={loading}
              loadingContent={<Spinner label="加载中..." />}
              emptyContent={
                !loading ? (
                  <div className="flex flex-col items-center justify-center py-10 text-default-400">
                    <Inbox className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm">暂无订单记录</p>
                    <Button
                      variant="flat"
                      color="primary"
                      size="sm"
                      className="mt-4"
                      onPress={() => navigate('/a/create')}
                    >
                      创建第一个订单
                    </Button>
                  </div>
                ) : (
                  " "
                )
              }
            >
              {(order) => {
                const status = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs text-default-400">
                      #{order.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.order_title}</span>
                        {order.order_content && (
                          <span className="text-xs text-default-400 mt-0.5 line-clamp-1">
                            {order.order_content}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{order.receiver_name || '用户已删除'}</TableCell>
                    <TableCell className="text-sm">{order.order_date}</TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color={status.color}>
                        {status.label}
                      </Chip>
                    </TableCell>
                    <TableCell className="text-xs text-default-400">
                      {new Date(order.created_at + 'Z').toLocaleString('zh-CN')}
                    </TableCell>
                  </TableRow>
                );
              }}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
