import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollText, ChevronDown, ChevronUp, Loader2, Search, X } from 'lucide-react';
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
  receiver_name: string;
}

interface UserOption {
  id: number;
  name: string;
  user_type: string;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  PENDING:    { label: '待接收', variant: 'secondary' },
  RECEIVED:   { label: '已接收', variant: 'outline' },
  PROCESSING: { label: '处理中', variant: 'default' },
  COMPLETED:  { label: '已完成', variant: 'default' },
};

export default function LogsAdmin() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // 筛选状态
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [limit, setLimit] = useState(4);

  const fetchLogs = useCallback(async (opts?: { lim?: number }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userId) params.set('user_id', userId);
      if (title.trim()) params.set('title', title.trim());
      if (date) params.set('date', date);
      params.set('limit', String(opts?.lim ?? limit));

      const res = await api.get(`/api/admin/logs?${params}`);
      setLogs(res.data.data.logs);
      if (res.data.data.users) setUsers(res.data.data.users);
    } catch {}
    setLoading(false);
  }, [userId, title, date, limit]);

  useEffect(() => {
    fetchLogs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setLimit(4);
    fetchLogs({ lim: 4 });
  };

  const handleClear = () => {
    setUserId('');
    setTitle('');
    setDate('');
    setLimit(4);
    // Re-fetch with cleared filters after state update
    setTimeout(() => fetchLogs({ lim: 4 }), 0);
  };

  const handleLoadMore = () => {
    const next = limit + 10;
    setLimit(next);
    fetchLogs({ lim: next });
  };

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <ScrollText className="h-5 w-5" />
        全局操作日志
      </h2>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">人员</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">全部人员</option>
                <optgroup label="A 端">
                  {users.filter((u) => u.user_type === 'A').map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </optgroup>
                <optgroup label="B 端">
                  {users.filter((u) => u.user_type === 'B').map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">订单标题</label>
              <Input
                placeholder="搜索标题..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-[180px] h-9"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">日期</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-[160px] h-9"
              />
            </div>
            <Button size="sm" onClick={handleSearch} className="h-9">
              <Search className="mr-1.5 h-4 w-4" />
              查询
            </Button>
            <Button size="sm" variant="outline" onClick={handleClear} className="h-9">
              <X className="mr-1.5 h-4 w-4" />
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 日志列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无记录
          </CardContent>
        </Card>
      ) : (
        <>
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
                        <span className="text-xs text-muted-foreground hidden md:inline">
                          {log.sender_name} → {log.receiver_name}
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
                          <span className="text-muted-foreground">接收人</span>
                          <span>{log.receiver_name}</span>
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
          <div className="text-center pt-2">
            <Button variant="outline" size="sm" onClick={handleLoadMore}>
              加载更多
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
