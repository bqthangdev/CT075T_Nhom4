# Stroke Prediction ML API (Flask)

API Flask phục vụ mô hình ML (demo) cho hệ thống chuẩn đoán nguy cơ đột quỵ.

## Endpoints

- `GET /health` — Health check
- `POST /api/v1/predictions/predict` — Dự đoán nguy cơ đột quỵ
- `GET /api/v1/predictions/history` — Lịch sử dự đoán (in-memory)

## Yêu cầu hệ thống
# Python 3.10+
# pip

## Cài đặt (Windows PowerShell)

```powershell
cd ml-api
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python run.py
```

Server chạy tại: `http://localhost:8000`

## Huấn luyện mô hình (đa thuật toán)

Dataset đã có tại: `app/Dataset/healthcare-dataset-stroke-data.csv`

Chạy script huấn luyện để tạo file model `app/models/stroke_pipeline.joblib`:

```powershell
cd ml-api
. .venv\Scripts\Activate.ps1
python train_model.py
```

Script sẽ huấn luyện nhiều thuật toán (Logistic Regression, Random Forest, Gradient Boosting, KNN),
lưu từng pipeline vào `app/models/<ten_thuat_toan>.joblib` và ghi `models.json`, `metrics.json` để tham khảo.

Sau khi huấn luyện thành công, restart lại Flask API để tải các mô hình. Nếu chưa có mô hình,
service sẽ dùng heuristic fallback.

## Dữ liệu đầu vào (JSON)
```json
{
  "age": 45,
  "gender": "Male",
  "hypertension": false,
  "heartDisease": false,
  "everMarried": "Yes",
  "workType": "Private",
  "residenceType": "Urban",
  "smokingStatus": "never smoked",
  "avgGlucoseLevel": 105.2,
  "bmi": 24.6
}
```

## Phản hồi mẫu
```json
{
  "success": true,
  "data": {
    "riskScore": 0.23,
    "riskLevel": "Low Risk",
    "recommendations": ["Duy trì lối sống lành mạnh và kiểm tra sức khỏe định kỳ."]
  },
  "message": "Prediction completed successfully"
}
```

## Ghi chú
- Lịch sử được lưu tạm thời trong bộ nhớ (mất khi restart)
- Logic tính điểm hiện tại chỉ là heuristic để demo; sẽ thay bằng mô hình ML thật sau
 ## Ghi chú
- Lịch sử được lưu vào file JSON tại `app/data/history.json` (giữ 100 bản ghi gần nhất)
- Để thay đổi đường dẫn model: đặt biến môi trường `MODEL_PATH`
- Để thay đổi file lịch sử: đặt biến môi trường `HISTORY_FILE`
