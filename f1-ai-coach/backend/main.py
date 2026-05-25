import os
import threading
import time
from f1_23_telemetry.listener import TelemetryListener

# ==========================================
# 1. THE VOICE ENGINE (macOS Native)
# ==========================================
def speak(text):
    """
    Runs the native macOS 'say' command in a background thread.
    This guarantees zero latency and no blocked telemetry loops.
    """
    def run_speech():
        # The macOS 'say' command natively handles text-to-speech
        os.system(f"say '{text}'")
        
    threading.Thread(target=run_speech, daemon=True).start()

# ==========================================
# 2. THE TELEMETRY LISTENER
# ==========================================
print("Booting up F1 AI Coach...")
listener = TelemetryListener(port=20777, host='localhost')

# Toggle variable to prevent the coach from stuttering/spamming
is_braking = False

def main():
    global is_braking
    print("Listening for game data on port 20777...")
    
    # Audio check to confirm the TTS engine is working
    speak("Radio check, Uday. Do you read me? This is your pitwall engineer. And I will be guiding you throughout this session.")

    while True:
        packet = listener.get()
        
        if packet:
            # We are looking for Car Telemetry (Packet ID 6)
            if packet.m_header.m_packetId == 6:
                
                # Identify which of the 22 cars is yours
                my_car_index = packet.m_header.m_playerCarIndex
                my_telemetry = packet.m_carTelemetryData[my_car_index]
                
                # Extract your current pedal inputs and speed
                speed = my_telemetry.m_speed
                brake = my_telemetry.m_brake * 100
                throttle = my_telemetry.m_throttle * 100
                
                # --- PHASE 2 TESTING LOGIC ---
                # If you press the brake past 50%, the coach speaks once.
                if brake > 50 and not is_braking:
                    speak("Heavy braking zone.")
                    is_braking = True # Lock the toggle
                    print(f"[{speed} km/h] COACH TRIGGERED: Heavy braking zone.")
                    
                # Once you let off the brake, unlock the toggle for the next corner
                elif brake < 5 and is_braking:
                    is_braking = False

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nShutting down AI Coach backend.")