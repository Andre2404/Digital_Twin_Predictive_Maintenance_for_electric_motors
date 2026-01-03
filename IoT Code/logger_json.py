import serial
import json
import csv
import time

# ================== CONFIG ==================
SERIAL_PORT = 'COM11'
BAUD_RATE = 115200
FILENAME = 'data_motor_training.csv'
READ_TIMEOUT = 2  # detik

# ================== CSV SCHEMA ==================
fieldnames = [
    # ELECTRICAL
    'voltage',
    'current',
    'power',
    'energy',
    'frequency',
    'pf',
    'apparent_power',
    'load_index',
    'current_freq_ratio',

    # TEMPERATURE
    'motor_temp',
    'ambient_temp',
    'bearing_temp',
    'delta_temp',
    'temp_gradient',
    'bearing_motor_diff',
    'hotspot',

    # DUST
    'dust',
    'soiling_loss',

    # VIBRATION
    'vibration_rms_mm_s',
    'vibration_peak_g',
    'crest_factor',
    'unbalance',

    # HEALTH
    'bearing_health',
    'health_index',

    # TIME
    'timestamp'
]

# ================== SERIAL CONNECT ==================
try:
    ser = serial.Serial(
        SERIAL_PORT,
        BAUD_RATE,
        timeout=READ_TIMEOUT
    )
    time.sleep(2)
    print(f"[OK] Connected to {SERIAL_PORT}")
except Exception as e:
    print(f"[FATAL] Serial error: {e}")
    exit(1)

# ================== CSV INIT ==================
try:
    with open(FILENAME, 'x', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        print("[OK] CSV header created")
except FileExistsError:
    print("[OK] CSV file exists, appending")

# ================== MAIN LOOP ==================
with open(FILENAME, 'a', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)

    try:
        while True:
            line = ser.readline().decode('utf-8', errors='ignore').strip()

            if not line:
                continue

            # HARD FILTER: hanya proses JSON
            if not line.startswith('{') or not line.endswith('}'):
                continue

            try:
                payload = json.loads(line)

                # Normalize row (schema lock)
                row = {key: payload.get(key, None) for key in fieldnames}
                writer.writerow(row)
                f.flush()

                print(f"[LOGGED] ts={row['timestamp']} | V={row['voltage']}")

            except json.JSONDecodeError:
                # sengaja DIAM, karena ini noise dari device
                continue

    except KeyboardInterrupt:
        print("\n[STOP] Logging terminated by user")

    finally:
        ser.close()
