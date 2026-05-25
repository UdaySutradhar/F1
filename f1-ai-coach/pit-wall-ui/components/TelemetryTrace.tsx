'use client';

import { useState, useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { CarTelemetry } from '../hooks/useTelemetry';

interface TelemetryTraceProps {
  carData: CarTelemetry | undefined;
}

// Define the shape of our historical data points
interface TracePoint {
  time: string;
  speed: number;
  throttle: number;
  brake: number;
}

export default function TelemetryTrace({ carData }: TelemetryTraceProps) {
  const [history, setHistory] = useState<TracePoint[]>([]);

  useEffect(() => {
    if (!carData) return;

    setHistory((prev) => {
      const newPoint = {
        // Just grab the seconds and milliseconds for the X-axis
        time: new Date().toISOString().substring(17, 23),
        speed: carData.speed,
        throttle: carData.throttle,
        brake: carData.brake,
      };

      // Keep only the last 100 ticks (10 seconds of data at 10Hz)
      // If we don't slice, the browser will eventually freeze
      const updatedHistory = [...prev, newPoint];
      return updatedHistory.slice(-100);
    });
  }, [carData]);

  if (!carData) return <Text color="gray.400">Waiting for car data...</Text>;

  return (
    <Box h="300px" w="100%" bg="gray.800" p={4} borderRadius="lg" border="1px solid" borderColor="gray.700">
      <Text fontWeight="bold" color="gray.300" mb={4}>
        LIVE TELEMETRY TRACE: {carData.name}
      </Text>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
          <XAxis dataKey="time" stroke="#718096" fontSize={12} />
          
          {/* Left Axis for Speed (0-350 km/h) */}
          <YAxis 
            yAxisId="speed" 
            domain={[0, 350]} 
            stroke="#8884d8" 
            fontSize={12}
          />
          
          {/* Right Axis for Pedals (0-100%) */}
          <YAxis 
            yAxisId="pedals" 
            orientation="right" 
            domain={[0, 100]} 
            stroke="#48BB78" 
            fontSize={12}
          />
          
          <Tooltip 
            contentStyle={{ backgroundColor: '#1A202C', borderColor: '#4A5568' }}
            itemStyle={{ fontWeight: 'bold' }}
          />

          {/* 
            PRO TIP: isAnimationActive={false} is MANDATORY for live data.
            If you leave it on, Recharts tries to animate every single tick 
            and your CPU will choke.
          */}
          <Line 
            yAxisId="speed" 
            type="monotone" 
            dataKey="speed" 
            stroke="#8884d8" 
            strokeWidth={2}
            dot={false} 
            isAnimationActive={false} 
          />
          <Line 
            yAxisId="pedals" 
            type="monotone" 
            dataKey="throttle" 
            stroke="#48BB78" 
            strokeWidth={2}
            dot={false} 
            isAnimationActive={false} 
          />
          <Line 
            yAxisId="pedals" 
            type="stepAfter" 
            dataKey="brake" 
            stroke="#F56565" 
            strokeWidth={2}
            dot={false} 
            isAnimationActive={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}