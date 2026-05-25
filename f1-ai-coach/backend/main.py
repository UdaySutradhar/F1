import os
import threading
import time
import asyncio
import websockets
import json
from f1_23_telemetry.listener import TelemetryListener

def speak(text):
    """Runs the macOS native text-to-speech in the background."""
    def run_speech():
        os.system(f"say '{text}'")
    threading.Thread(target=run_speech, daemon=True).start()

print("Booting up F1 AI Coach & Pit Wall Broadcaster...")
listener = TelemetryListener(port=20777, host='localhost')

# Memory variables for the AI & Dashboard
leader_index = 0
last_advice_time = 0
driver_names = {} 
grid_telemetry = {} 

# ==========================================
# 1. THE WEBSOCKET SERVER
# ==========================================
async def broadcast_telemetry(websocket):
    """Sends the 22-car grid data to your React frontend 10 times a second."""
    while True:
        if grid_telemetry:
            await websocket.send(json.dumps(grid_telemetry))
        await asyncio.sleep(0.1) 

async def start_websocket_server():
    print("WebSocket server running on ws://localhost:8765")
    async with websockets.serve(broadcast_telemetry, "localhost", 8765):
        await asyncio.Future()

# Start the WebSocket server in a background thread
threading.Thread(target=lambda: asyncio.run(start_websocket_server()), daemon=True).start()

# ==========================================
# 2. THE TELEMETRY LOOP
# ==========================================
def main():
    global leader_index, last_advice_time, grid_telemetry, driver_names
    
    speak("System online. Coach and Pit Wall Broadcaster are active.")

    while True:
        packet = listener.get()
        
        if packet:
            packet_id = packet.m_header.m_packetId
            my_index = packet.m_header.m_playerCarIndex
            
            # --- PACKET 2: Track the Race Leader ---
            if packet_id == 2:
                for i in range(22):
                    if packet.m_lapData[i].m_carPosition == 1:
                        leader_index = i
                        break
                        
            # --- PACKET 4: Catch the Driver Names ---
            elif packet_id == 4:
                # m_numActiveCars tells us exactly how many people are in the session
                for i in range(packet.m_numActiveCars):
                    raw_name = packet.m_participants[i].m_name
                    # Decode the byte string into a clean Python string
                    name = raw_name.decode('utf-8').strip('\x00') if isinstance(raw_name, bytes) else str(raw_name).strip('\x00')
                    
                    if name:
                        driver_names[i] = name

            # --- PACKET 6: Analyze Telemetry & Build Pit Wall Data ---
            elif packet_id == 6:
                for i in range(22):
                    car_data = packet.m_carTelemetryData[i]
                    
                    # Look up the real name, default to "Driver X" if Packet 4 hasn't fired yet
                    display_name = driver_names.get(i, f"Driver {i}")
                    
                    grid_telemetry[i] = {
                        "name": display_name,
                        "speed": car_data.m_speed,
                        "brake": car_data.m_brake * 100,
                        "throttle": car_data.m_throttle * 100,
                        "gear": car_data.m_gear
                    }

                # --- AI Coaching Logic ---
                # Only give advice if you are not the leader
                if my_index != leader_index:
                    my_brake = grid_telemetry[my_index]["brake"]
                    my_speed = grid_telemetry[my_index]["speed"]
                    leader_brake = grid_telemetry[leader_index]["brake"]
                    leader_speed = grid_telemetry[leader_index]["speed"]

                    current_time = time.time()
                    
                    # 5-second cooldown so the AI doesn't spam you mid-corner
                    if current_time - last_advice_time > 5.0:
                        
                        # Mistake 1: Braking too early
                        if my_brake > 50 and leader_brake < 10:
                            speak("Braking early. The leader is carrying speed here.")
                            last_advice_time = current_time
                            
                        # Mistake 2: Missing apex speed
                        elif my_brake == 0 and leader_brake == 0:
                            speed_delta = leader_speed - my_speed
                            if speed_delta > 20: 
                                speak(f"You lost momentum. Leader is {speed_delta} kilometers per hour faster.")
                                last_advice_time = current_time

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nShutting down system.")