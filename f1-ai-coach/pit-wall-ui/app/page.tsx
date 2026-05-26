'use client';

import { useState, useEffect } from 'react';
import { Box, SimpleGrid, Text, Progress, Badge, Flex, Heading, Grid, GridItem } from '@chakra-ui/react';
import { useTelemetry } from '../hooks/useTelemetry';
import TelemetryTrace from '../components/TelemetryTrace';

const formatTime = (ms: number) => {
  if (!ms) return "0:00.000";
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
};

export default function PitWall() {
  const [mounted, setMounted] = useState(false);
  const { telemetry, isConnected } = useTelemetry('ws://localhost:8765');
  const playerCarData = Object.values(telemetry).find(car => (car as any).is_player) || telemetry["0"];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Box bg="gray.900" minH="100vh" p={6} color="white">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" letterSpacing="tight">
          PRO F1 Pit Wall
        </Heading>
        <Badge colorPalette={isConnected ? 'green' : 'red'} p={2} borderRadius="md">
          {isConnected ? 'LIVE (10Hz)' : 'DISCONNECTED'}
        </Badge>
      </Flex>
      
      <Box mb={8}>
        <TelemetryTrace carData={playerCarData} />
      </Box>
      
      <Heading size="md" mb={4} color="gray.400">Grid Overview</Heading>
      <SimpleGrid columns={{ base: 1, md: 3, lg: 4, xl: 5 }} gap={4}>
        {Object.entries(telemetry).map(([driverIndex, data]) => (
          <Box key={driverIndex} p={4} bg="gray.800" borderRadius="lg" border="1px solid" borderColor="gray.700">
            
            {/* Header: Position & Name */}
            <Flex justify="space-between" align="center" mb={2}>
              <Flex align="center" gap={2}>
                <Badge colorPalette="yellow" variant="solid">P{data.position || "-"}</Badge>
                <Text fontWeight="bold" fontSize="md" truncate maxWidth="120px">
                  {data.name}
                </Text>
              </Flex>
              <Badge colorPalette={data.flag === 3 ? "yellow" : "gray"}>
                {data.gear === 0 ? "N" : data.gear === -1 ? "R" : `G${data.gear}`}
              </Badge>
            </Flex>

            {/* Core Metrics: Speed, RPM, Lap Time */}
            <Grid templateColumns="repeat(2, 1fr)" gap={2} mb={3} p={2} bg="gray.900" borderRadius="md">
              <GridItem>
                <Text fontSize="xs" color="gray.400">SPEED</Text>
                <Text fontWeight="black" color="blue.300">{data.speed} km/h</Text>
              </GridItem>
              <GridItem>
                <Text fontSize="xs" color="gray.400">RPM</Text>
                <Text fontWeight="bold">{data.rpm}</Text>
              </GridItem>
              <GridItem colSpan={2}>
                <Text fontSize="xs" color="gray.400">LIVE LAP</Text>
                <Text fontWeight="bold" color="purple.300" fontFamily="monospace">
                  {formatTime(data.lap_time_ms)}
                </Text>
              </GridItem>
            </Grid>

            {/* Engineering Data: Temps, Wear, Fuel */}
            <Grid templateColumns="repeat(2, 1fr)" gap={2} mb={4}>
              <GridItem>
                <Text fontSize="xs" color="gray.500">TIRE TEMP</Text>
                <Text fontSize="sm" color={data.tire_temp > 100 ? "red.400" : "green.400"}>{data.tire_temp}°C</Text>
              </GridItem>
              <GridItem>
                <Text fontSize="xs" color="gray.500">BRAKE TEMP</Text>
                <Text fontSize="sm" color={data.brake_temp > 600 ? "red.400" : "gray.300"}>{data.brake_temp}°C</Text>
              </GridItem>
              <GridItem>
                <Text fontSize="xs" color="gray.500">TIRE WEAR</Text>
                <Text fontSize="sm" color={data.tire_wear > 50 ? "red.400" : "yellow.400"}>{Math.round(data.tire_wear)}%</Text>
              </GridItem>
              <GridItem>
                <Text fontSize="xs" color="gray.500">FUEL</Text>
                <Text fontSize="sm">{data.fuel} kg</Text>
              </GridItem>
            </Grid>

            {/* Driver Inputs: Throttle & Brake */}
            <Box mb={2}>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="xs" color="gray.400">THR</Text>
                <Text fontSize="xs" color="green.400">{Math.round(data.throttle)}%</Text>
              </Flex>
              <Progress.Root value={data.throttle} size="sm" colorPalette="green">
                <Progress.Track bg="gray.700"><Progress.Range /></Progress.Track>
              </Progress.Root>
            </Box>
            
            <Box>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="xs" color="gray.400">BRK</Text>
                <Text fontSize="xs" color="red.400">{Math.round(data.brake)}%</Text>
              </Flex>
              <Progress.Root value={data.brake} size="sm" colorPalette="red">
                <Progress.Track bg="gray.700"><Progress.Range /></Progress.Track>
              </Progress.Root>
            </Box>

          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}