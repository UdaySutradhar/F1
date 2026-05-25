import { useState, useEffect } from 'react';

// Define the shape of the data coming from Python
export interface CarTelemetry {
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
      // The Python backend sends a JSON string of the 22-car dictionary
      const data: GridTelemetry = JSON.parse(event.data);
      setTelemetry(data);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return { telemetry, isConnected };
};