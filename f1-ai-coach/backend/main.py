import os
import threading
import time
import asyncio
import websockets
import json
from f1_23_telemetry.listener import TelemetryListener

def speak(text):
    def run_speech():
        os.system(f"say '{text}'")
    threading.Thread(target=run_speech, daemon=True).start()

print("Booting up F1 AI Coach & PRO Pit Wall Broadcaster...")
listener = TelemetryListener(port=20777, host='localhost')

leader_index = 0
last_advice_time = 0

# Initialize a persistent dictionary with default values for all 22 cars
grid_telemetry = {
    i: {
        "name": f"Driver {i}", "position": 0, "speed": 0, "gear": 0, "throttle": 0, "brake": 0, 
        "rpm": 0, "tire_temp": 0, "brake_temp": 0, "tire_wear": 0, "wing_damage": 0, 
        "fuel": 0.0, "lap_time_ms": 0, "flag": 0
    } for i in range(22)
}

# ==========================================
# 1. THE WEBSOCKET SERVER
# ==========================================
async def broadcast_telemetry(websocket):
    while True:
        await websocket.send(json.dumps(grid_telemetry))
        await asyncio.sleep(0.1) 

async def start_server():
    async with websockets.serve(broadcast_telemetry, "localhost", 8765):
        await asyncio.Future() # Keeps the server running indefinitely

threading.Thread(target=lambda: asyncio.run(start_server()), daemon=True).start()
# ==========================================
# 2. THE TELEMETRY LOOP
# ==========================================
def main():
    global leader_index, last_advice_time, grid_telemetry
    speak("Pro telemetry system online.")

    while True:
        packet = listener.get()
        print(f"DEBUG: Caught a packet! ID: {packet.m_header.m_packetId if packet else 'None'}")
        if not packet:
            continue
            
        packet_id = packet.m_header.m_packetId
        my_index = packet.m_header.m_playerCarIndex
        
        # --- PACKET 2: LAP DATA (Times & Positions) ---
        if packet_id == 2:
            for i in range(22):
                lap = packet.m_lapData[i]
                if lap.m_carPosition == 1:
                    leader_index = i
                
                grid_telemetry[i].update({
                    "position": lap.m_carPosition,
                    "lap_time_ms": lap.m_currentLapTimeInMS
                })

        # --- PACKET 4: PARTICIPANTS (Names) ---
        elif packet_id == 4:
            for i in range(packet.m_numActiveCars):
                raw = packet.m_participants[i].m_name
                name = raw.decode('utf-8').strip('\x00') if isinstance(raw, bytes) else str(raw).strip('\x00')
                if name:
                    grid_telemetry[i]["name"] = name

        # --- PACKET 6: TELEMETRY (Speed, Pedals, Temps) ---
        elif packet_id == 6:
            for i in range(22):
                car = packet.m_carTelemetryData[i]
                grid_telemetry[i].update({
                    "is_player": (i == my_index),
                    "speed": car.m_speed,
                    "brake": car.m_brake * 100,
                    "throttle": car.m_throttle * 100,
                    "gear": car.m_gear,
                    "rpm": car.m_engineRPM,
                    # Index 2 is the Front Left Tire in the EA UDP Spec
                    "tire_temp": car.m_tyresSurfaceTemperature[2], 
                    "brake_temp": car.m_brakesTemperature[2]
                })

            # AI Coaching Logic
            if my_index != leader_index:
                my_brake = grid_telemetry[my_index]["brake"]
                lead_brake = grid_telemetry[leader_index]["brake"]
                curr_time = time.time()
                
                if curr_time - last_advice_time > 5.0:
                    if my_brake > 50 and lead_brake < 10:
                        speak("Braking early.")
                        last_advice_time = curr_time

        # --- PACKET 7: CAR STATUS (Fuel & Flags) ---
        elif packet_id == 7:
            for i in range(22):
                status = packet.m_carStatusData[i]
                grid_telemetry[i].update({
                    "fuel": round(status.m_fuelInTank, 2),
                    "flag": status.m_vehicleFiaFlags # 0=none, 1=green, 2=blue, 3=yellow, 4=red
                })

        # --- PACKET 8: CAR DAMAGE (Wear & Aero) ---
        elif packet_id == 8:
            for i in range(22):
                dmg = packet.m_carDamageData[i]
                grid_telemetry[i].update({
                    "tire_wear": dmg.m_tyresWear[2], # Front Left Wear %
                    "wing_damage": dmg.m_frontLeftWingDamage
                })

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nShutting down.")