import { useState, useEffect } from 'react';

export interface CarTelemetry {
  name: string;
  speed: number;
  brake: number;
  throttle: number;
  gear: number;
}

export interface GridTelemetry {
  [driverIndex: string]: CarTelemetry;
}

export const useTelemetry = (url: string) => {
  const [telemetry, setTelemetry] = useState<GridTelemetry>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      const data: GridTelemetry = JSON.parse(event.data);
      setTelemetry(data);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return { telemetry, isConnected };
};