import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Chip, Button, Spinner } from '@heroui/react';
import { ScrollText, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/api';

interface LogItem {
  id: number;
  order_title: string;
  order_content: string | null;
  order_date: string;
  status: string;
  created_at: string;
  received_at: string | null;
  processing_at: string | null;
  completed_at: string | null;
  receiver_name: string;
}

const STATUS_MAP: Record<string, { label: string; color: "default" | "primary" | "secondary" | "success" | "warning" | "danger" }> = {
  PENDING:    { label: '待接收', color: 'warning' },
  RECEIVED:   { label: '已接收', color: 'primary' },
  PROCESSING: { label: '处理中', color: 'secondary' },
  COMPLETED:  { label: '已完成', color: 'success' },
};

export default function LogsA() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.get('/api/a/logs')
      .then((res) => setLogs(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <ScrollText className="h-5 w-5" />
        下单记录
      </h2>

      {logs.length === 0 ? (
        <Card className="shadow-sm">
          <CardBody className="py-12 text-center text-default-400">
            暂无记录
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isOpen = expanded.has(log.id);
            const st = STATUS_MAP[log.status] || { label: log.status, color: 'default' };
            return (
              <Card key={log.id} className="shadow-sm">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(log.id)}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <p className="text-sm font-medium truncate">{log.order_title}</p>
                      <Chip size="sm" variant="flat" color={st.color as any}>{st.label}</Chip>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-xs text-default-400 hidden sm:inline">
                        → {log.receiver_name}
                      </span>
                      <span className="text-xs text-default-400">
                        {log.created_at?.slice(0, 16).replace('T', ' ')}
                      </span>
                      <Button variant="light" isIconOnly size="sm" className="h-6 w-6">
                        {isOpen ? <ChevronUp className="h-4 w-4 text-default-500" /> : <ChevronDown className="h-4 w-4 text-default-500" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isOpen && (
                  <CardBody className="pt-0 border-t border-divider mt-2">
                    <div className="grid gap-2 text-sm pt-3">
                      <div className="grid grid-cols-[80px_1fr] gap-1">
                        <span className="text-default-400">接收人</span>
                        <span>{log.receiver_name}</span>
                      </div>
                      <div className="grid grid-cols-[80px_1fr] gap-1">
                        <span className="text-default-400">订单日期</span>
                        <span>{log.order_date}</span>
                      </div>
                      {log.order_content && (
                        <div className="grid grid-cols-[80px_1fr] gap-1">
                          <span className="text-default-400">内容</span>
                          <span className="whitespace-pre-wrap">{log.order_content}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-[80px_1fr] gap-1">
                        <span className="text-default-400">创建时间</span>
                        <span>{log.created_at}</span>
                      </div>
                      {log.received_at && (
                        <div className="grid grid-cols-[80px_1fr] gap-1">
                          <span className="text-default-400">接收时间</span>
                          <span>{log.received_at}</span>
                        </div>
                      )}
                      {log.completed_at && (
                        <div className="grid grid-cols-[80px_1fr] gap-1">
                          <span className="text-default-400">完成时间</span>
                          <span>{log.completed_at}</span>
                        </div>
                      )}
                    </div>
                  </CardBody>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
