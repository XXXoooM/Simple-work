import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface WSMessage {
  type: string;
  orderId?: number;
  senderName?: string;
  orderTitle?: string;
  orderDate?: string;
  timestamp?: number;
}

/**
 * B 端 WebSocket 实时通知 hook
 * 连接到 Worker 的 /ws?token=xxx 端点
 * 收到 NEW_ORDER 消息时弹出 toast 通知
 */
export function useOrderWebSocket(onNewOrder?: () => void) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttempts = useRef(0);
  const navigate = useNavigate();

  const connect = useCallback(() => {
    // 只有 B 端用户才需要 WebSocket
    if (!token || user?.userType !== 'B') return;

    // 清理之前的连接
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787';
    const wsBase = apiBase.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[WS] Connected');
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);

        if (data.type === 'CONNECTED') {
          console.log('[WS] Server confirmed connection');
          return;
        }

        if (data.type === 'NEW_ORDER') {
          toast('📦 新订单到达', {
            description: `${data.senderName} 给您下了一个订单：${data.orderTitle}`,
            action: {
              label: '查看',
              onClick: () => navigate('/b/receive'),
            },
            duration: 8000,
          });

          // 触发外部回调（例如刷新列表）
          onNewOrder?.();
        }
      } catch {
        console.error('[WS] Failed to parse message');
      }
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected');
      wsRef.current = null;

      // 指数退避重连（最大 30 秒）
      const delay = Math.min(3000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current++;

      reconnectTimer.current = setTimeout(() => {
        console.log(`[WS] Reconnecting (attempt ${reconnectAttempts.current})...`);
        connect();
      }, delay);
    };

    wsRef.current = ws;
  }, [token, user?.userType, navigate, onNewOrder]);

  useEffect(() => {
    connect();

    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);
}
