import pandas as pd
import joblib
import firebase_admin
from firebase_admin import credentials, db
import time

# =============================
# KONFIGURASI
# =============================
FIREBASE_URL = "https://test-mode-62bda-default-rtdb.firebaseio.com/"

SENSOR_NODE = "sensor_data/latest"
PREDICTION_NODE = "prediction/latest"

MODEL_PATH = r"C:\Users\lapto\Documents\Digital-twin-predictive-maintenance-for-motor-electric\lib\machine-learning\klasifikasi.pkl"
SERVICE_ACCOUNT_PATH = r"C:\Users\lapto\Documents\Digital-twin-predictive-maintenance-for-motor-electric\lib\machine-learning\serviceAccountKey.json"

# =============================
# LOAD MODEL ML
# =============================
def load_ml_model(path):
    try:
        print("🔄 Load model ML...")
        return joblib.load(path)
    except Exception as e:
        print(f"❌ Gagal load model ML: {e}")
        return None

model_ml = load_ml_model(MODEL_PATH)

# =============================
# INIT FIREBASE
# =============================
def initialize_firebase():
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(
                cred,
                {"databaseURL": FIREBASE_URL}
            )
        print("✅ Firebase terhubung")
        return db.reference()
    except Exception as e:
        print(f"❌ Gagal koneksi Firebase: {e}")
        return None

root_ref = initialize_firebase()

# =============================
# AMBIL DATA → PREDIKSI → SIMPAN
# =============================
def predict_and_push():
    if root_ref is None or model_ml is None:
        print("❌ Aplikasi belum siap")
        return

    try:
        # === Ambil data sensor latest ===
        data = root_ref.child(SENSOR_NODE).get()

        if not data:
            print("⏳ Menunggu data sensor...")
            return

        # === Buat DataFrame ===
        df = pd.DataFrame([{
            "vibration_rms_mm_s": data["vibration_rms_mm_s"]
        }])

        # === Prediksi ===
        prediction = model_ml.predict(df)[0]

        # === Simpan hasil ke Firebase ===
        result = {
            "result": str(prediction),
            "source_timestamp": data.get("timestamp"),
            "created_at": int(time.time())
        }

        root_ref.child(PREDICTION_NODE).set(result)

        print("✅ Prediksi berhasil dikirim ke Firebase")
        print(result)

    except KeyError as e:
        print(f"❌ Field tidak ditemukan: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

# =============================
# LOOP (REALTIME)
# =============================
if __name__ == "__main__":
    print("🚀 ML Service berjalan...")
    while True:
        predict_and_push()
        time.sleep(5)
