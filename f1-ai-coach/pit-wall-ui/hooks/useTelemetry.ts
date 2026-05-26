import { useState, useEffect } from 'react';

export interface CarTelemetry {
  name: string;
  position: number;
  speed: number;
  brake: number;
  throttle: number;
  gear: number;
  rpm: number;
  tire_temp: number;
  brake_temp: number;
  tire_wear: number;
  wing_damage: number;
  fuel: number;
  lap_time_ms: number;
  flag: number;
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