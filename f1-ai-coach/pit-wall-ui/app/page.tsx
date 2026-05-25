'use client';

import { Box, SimpleGrid, Text, Progress, Badge, Flex, Heading } from '@chakra-ui/react';
import { useTelemetry } from '../hooks/useTelemetry';

export default function PitWall() {
  const { telemetry, isConnected } = useTelemetry('ws://localhost:8765');

  return (
    <Box bg="gray.900" minH="100vh" p={6} color="white">
      
      {/* Header Section */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" letterSpacing="tight">
          F1 Pit Wall Telemetry
        </Heading>
        <Badge colorPalette={isConnected ? 'green' : 'red'} p={2} borderRadius="md">
          {isConnected ? 'LIVE (10Hz)' : 'DISCONNECTED'}
        </Badge>
      </Flex>
      
      {/* 22-Car Grid */}
      <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} gap={4}>
        {Object.entries(telemetry).map(([driverIndex, data]) => (
          <Box 
            key={driverIndex} 
            p={4} 
            bg="gray.800" 
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.700"
          >
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="bold" fontSize="lg" color="gray.300" truncate maxWidth="150px">
                {data.name}
              </Text>
              <Badge colorPalette="blue">GEAR {data.gear}</Badge>
            </Flex>
            
            <Text fontSize="2xl" fontWeight="black" mb={4}>
              {data.speed} <Text as="span" fontSize="sm" color="gray.400">km/h</Text>
            </Text>
            
            <Box mb={3}>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="xs" color="gray.400" fontWeight="bold">THROTTLE</Text>
                <Text fontSize="xs" color="green.400">{Math.round(data.throttle)}%</Text>
              </Flex>
              <Progress.Root value={data.throttle} size="sm" colorPalette="green">
                <Progress.Track bg="gray.700">
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
            </Box>
            
            <Box>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="xs" color="gray.400" fontWeight="bold">BRAKE</Text>
                <Text fontSize="xs" color="red.400">{Math.round(data.brake)}%</Text>
              </Flex>
              <Progress.Root value={data.brake} size="sm" colorPalette="red">
                <Progress.Track bg="gray.700">
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
            </Box>
          </Box>
        ))}
      </SimpleGrid>

    </Box>
  );
}