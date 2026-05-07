import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
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
  sender_name: string;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  PENDING:    { label: '待接收', variant: 'secondary' },
  RECEIVED:   { label: '已接收', variant: 'outline' },
  PROCESSING: { label: '处理中', variant: 'default' },
  COMPLETED:  { label: '已完成', variant: 'default' },
};

export default function LogsB() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.get('/api/b/logs')
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <ScrollText className="h-5 w-5" />
        接单记录
      </h2>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无记录
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isOpen = expanded.has(log.id);
            const st = STATUS_MAP[log.status] || { label: log.status, variant: 'secondary' as const };
            return (
              <Card key={log.id} className="transition-all duration-200 hover:shadow-sm">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(log.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <CardTitle className="text-sm font-medium truncate">{log.order_title}</CardTitle>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        ← {log.sender_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {log.created_at?.slice(0, 16).replace('T', ' ')}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isOpen && (
                  <CardContent className="pt-0 border-t border-border mt-2">
                    <div className="grid gap-2 text-sm pt-3">
                      <div className="grid grid-cols-[80px_1fr] gap-1">
                        <span className="text-muted-foreground">发送人</span>
                        <span>{log.sender_name}</span>
                      </div>
                      <div className="grid grid-cols-[80px_1fr] gap-1">
                        <span className="text-muted-foreground">订单日期</span>
                        <span>{log.order_date}</span>
                      </div>
                      {log.order_content && (
                        <div className="grid grid-cols-[80px_1fr] gap-1">
                          <span className="text-muted-foreground">内容</span>
                          <span className="whitespace-pre-wrap">{log.order_content}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-[80px_1fr] gap-1">
                        <span className="text-muted-foreground">创建时间</span>
                        <span>{log.created_at}</span>
                      </div>
                      {log.received_at && (
                        <div className="grid grid-cols-[80px_1fr] gap-1">
                          <span className="text-muted-foreground">接收时间</span>
                          <span>{log.received_at}</span>
                        </div>
                      )}
                      {log.processing_at && (
                        <div className="grid grid-cols-[80px_1fr] gap-1">
                          <span className="text-muted-foreground">处理时间</span>
                          <span>{log.processing_at}</span>
                        </div>
                      )}
                      {log.completed_at && (
                        <div className="grid grid-cols-[80px_1fr] gap-1">
                          <span className="text-muted-foreground">完成时间</span>
                          <span>{log.completed_at}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
