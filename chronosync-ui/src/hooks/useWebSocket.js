import { useEffect, useRef, useState } from 'react';
import { WS_URL } from '../constants';

export const useWebSocket = ({
  side,
  onMessageDelivered,
  onTaskSynced,
  onNetworkUpdate,
  onConflictDetected
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = () => {
    console.log(`Connecting to WebSocket as ${side}...`);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'REGISTER', side }));
    };

    ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        console.log('WebSocket event:', type, payload);

        switch (type) {
          case 'MESSAGE_DELIVERED':
            if (onMessageDelivered) onMessageDelivered(payload);
            break;
          case 'TASK_SYNCED':
            if (onTaskSynced) onTaskSynced(payload);
            break;
          case 'NETWORK_UPDATE':
            if (onNetworkUpdate) onNetworkUpdate(payload);
            break;
          case 'CONFLICT_DETECTED':
            if (onConflictDetected) onConflictDetected(payload);
            break;
          default:
            console.warn('Unknown WebSocket event type:', type);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket closed. Attempting reconnect in 3s...');
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error', err);
      ws.close();
    };
  };

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [side]);

  return { isConnected };
};
