import { useState, useEffect, useCallback } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button, Popover, PopoverTrigger, PopoverContent, Badge, ScrollShadow } from '@heroui/react';
import api from '@/lib/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string | null;
  is_read: number;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch { /* ignore */ }
  }, []);

  // 初始加载 + 30秒轮询
  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await api.put('/api/notifications/read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch { /* ignore */ }
    setLoading(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr + 'Z').getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Button
          variant="light"
          isIconOnly
          className="relative h-9 w-9 data-[hover=true]:bg-transparent"
        >
          <Badge
            content={unreadCount > 99 ? '99+' : unreadCount}
            color="danger"
            isInvisible={unreadCount === 0}
            shape="circle"
          >
            <Bell className="h-5 w-5 text-default-600" />
          </Badge>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0">
        <div className="w-full">
          <div className="flex items-center justify-between border-b border-divider px-4 py-3">
            <span className="text-sm font-medium">消息通知</span>
            {unreadCount > 0 && (
              <Button
                variant="light"
                size="sm"
                color="primary"
                onPress={handleMarkAllRead}
                isLoading={loading}
                startContent={!loading && <Check className="h-3 w-3" />}
                className="h-7 text-xs"
              >
                全部已读
              </Button>
            )}
          </div>
          <ScrollShadow className="max-h-[320px] w-full">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-default-400">
                暂无消息
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-divider last:border-0 px-4 py-3 transition-colors ${
                    n.is_read === 0 ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {n.is_read === 0 && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                        <span className="text-sm font-medium truncate">{n.title}</span>
                      </div>
                      {n.content && (
                        <p className="mt-1 text-xs text-default-500 line-clamp-2 whitespace-pre-wrap">
                          {n.content}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-default-400">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </ScrollShadow>
        </div>
      </PopoverContent>
    </Popover>
  );
}
