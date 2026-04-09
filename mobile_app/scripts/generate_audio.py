import wave
import struct
import math
import os

def generate_beep(filename, frequency, duration_ms, volume=0.5, sample_rate=44100):
    num_samples = int(sample_rate * (duration_ms / 1000.0))
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    with wave.open(filename, 'w') as wav_file:
        # Mono, 2 bytes per sample, sample_rate, num_samples, 'NONE', 'not compressed'
        wav_file.setparams((1, 2, sample_rate, num_samples, 'NONE', 'not compressed'))
        
        for i in range(num_samples):
            # Sine wave
            value = int(volume * 32767.0 * math.sin(2.0 * math.pi * frequency * (i / sample_rate)))
            wav_file.writeframes(struct.pack('<h', value))
    print(f"Generated: {filename}")

if __name__ == "__main__":
    base_path = "mobile_app/assets/audio"
    
    # 1. High Alert (Emergency) - High pitch, short
    generate_beep(os.path.join(base_path, "alert_high.wav"), 1000, 300, volume=0.8)
    
    # 2. Medium Alert (Warning) - Mid pitch
    generate_beep(os.path.join(base_path, "alert_medium.wav"), 600, 400, volume=0.6)
    
    # 3. Low Alert (Information) - Low pitch, longer
    generate_beep(os.path.join(base_path, "alert_low.wav"), 300, 500, volume=0.4)
