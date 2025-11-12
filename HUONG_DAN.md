# Hướng dẫn sử dụng hệ thống

## Khởi động Flask API

```bash
cd ml-api
python run.py
```

API sẽ chạy tại: http://localhost:8000

## Khởi động React Frontend

```bash  
cd frontend
npm start
```

Frontend sẽ chạy tại: http://localhost:3001

## Training Models

```bash
cd ml-api
python train_model.py
```

Sau khi train xong, restart Flask API để load models mới.

## Cấu hình Hyperparameters

1. Truy cập: http://localhost:3001/model-config
2. Điều chỉnh các hyperparameters
3. Nhấn "Lưu cấu hình"
4. Chạy `python train_model.py` để train lại
5. Restart Flask API

## Xem kết quả so sánh thuật toán

Sau khi train, truy cập trang Chuẩn đoán và nhập dữ liệu.
Kết quả sẽ hiển thị:
- Điểm rủi ro từ từng thuật toán
- Metrics đầy đủ (MAE, MSE, Accuracy, Precision, Recall, F1, ROC-AUC, Confusion Matrix)
- Nhấn vào từng hàng để xem chi tiết metrics
