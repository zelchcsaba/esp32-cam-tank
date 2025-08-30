import { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import type { ReactNode } from 'react';

type WSContextType = {
  imageData: string | null;
  sendMessage: (msg: any) => void; // üzenet küldés WS-en JSON-ként
};

const WSContext = createContext<WSContextType>({
  imageData: null,
  sendMessage: () => {},
});

const wsUrl = import.meta.env.VITE_WS_SERVER;

export const WSProvider = ({ children }: { children: ReactNode }) => {
  const [imageData, setImageData] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => console.log('[WS] Connected');
    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        // itt lehet más szöveges üzenet is
        // pl. JSON parsolás, vagy log
        console.log('[WS] Message:', event.data);
      } else {
        // bináris kép
        const blob = new Blob([event.data], { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        setImageData(url);
      }
    };
    ws.onclose = () => console.log('[WS] Closed');
    ws.onerror = (e) => console.error('[WS] Error', e);

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = (msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  const contextValue = useMemo(() => ({ imageData, sendMessage }), [imageData]);

  return <WSContext.Provider value={contextValue}>{children}</WSContext.Provider>;
};

export const useWS = () => useContext(WSContext);
