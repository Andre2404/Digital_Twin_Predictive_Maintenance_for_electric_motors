# ML Service for Bearing Failure Prediction

FastAPI service untuk menjalankan model klasifikasi dan regresi bearing failure.

## Setup

```bash
cd ml_service
pip install -r requirements.txt
python app.py
```

Server akan berjalan di `http://localhost:8000`

## Endpoints

- `GET /health` - Health check
- `POST /predict/classification` - Prediksi apakah bearing akan gagal dalam 300 menit
- `POST /predict/regression` - Prediksi berapa menit lagi sebelum bearing gagal
- `POST /predict/both` - Kedua prediksi sekaligus

## Input Format

```json
{
  "readings": [
    {"vibration_rms": 2.5, "timestamp": 1704300000},
    {"vibration_rms": 2.7, "timestamp": 1704300010},
    ...
  ]
}
```
Minimal 10 readings untuk hasil yang terbaik.
