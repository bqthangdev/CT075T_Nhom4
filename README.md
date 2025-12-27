# HỆ THỐNG CHUẨN ĐOÁN NGUY CƠ ĐỘT QUỴ

Hệ thống dự đoán nguy cơ đột quỵ sử dụng thuật toán Machine Learning K-Nearest Neighbors (KNN).

## 📋 MÔ TẢ DỰ ÁN

Hệ thống sử dụng công nghệ Machine Learning để dự đoán nguy cơ đột quỵ dựa trên các thông tin sức khỏe và lối sống của bệnh nhân. 

**Thành phần:**
- **Frontend**: React.js + Ant Design - Giao diện người dùng
- **ML API**: Flask (Python) - API dự đoán sử dụng thuật toán KNN
- **Dataset**: 5,110 bản ghi từ Kaggle Healthcare Dataset

**Thuật toán:** K-Nearest Neighbors (KNN) với k=15 neighbors

## 🗂️ CẤU TRÚC DỰ ÁN

```
CT075T_Nhom4/
├── ml-api/                      # Flask ML API (Python)
│   ├── app/
│   │   ├── config/             # Model config & thresholds
│   │   ├── data/               # Dataset CSV
│   │   ├── models/             # Trained models (.joblib)
│   │   ├── routes/             # API endpoints
│   │   └── services/           # Prediction logic
│   ├── train_model.py          # Training script
│   ├── run.py                  # Server entry point
│   └── requirements.txt        # Python dependencies
│
├── frontend/                    # React.js Frontend
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API calls
│   │   └── styles/             # CSS files
│   └── package.json
│
└── backend/                     # Node.js Backend (Optional)
    └── src/                    # Express.js structure
```

## ⚙️ YÊU CẦU HỆ THỐNG

- **Python**: 3.8+
- **Node.js**: 16+
- **npm**: 8+

## 🚀 HƯỚNG DẪN CÀI ĐẶT

### Bước 1: Cài đặt ML API (Flask)

**Windows (PowerShell):**
```powershell
cd ml-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

**Linux/Mac:**
```bash
cd ml-api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### Bước 2: Cài đặt Frontend

**Windows:**
```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

**Linux/Mac:**
```bash
cd frontend
npm install
cp .env.example .env
```

### Bước 3: Training Model (Lần đầu tiên)

```bash
cd ml-api
python train_model.py
```

Model KNN sẽ được tạo tại `ml-api/app/models/knn.joblib`

## ▶️ CHẠY DỰ ÁN

### Terminal 1 - Khởi động ML API

```powershell
cd ml-api
.\.venv\Scripts\Activate.ps1  # Windows
# source .venv/bin/activate    # Linux/Mac
python run.py
```

API chạy tại: **http://localhost:8000**

### Terminal 2 - Khởi động Frontend

```bash
cd frontend
npm start
```

Frontend chạy tại: **http://localhost:3001**

### Kiểm tra

- ML API Health: http://localhost:8000/health
- Frontend: http://localhost:3001

## 📖 HƯỚNG DẪN SỬ DỤNG

### 1. Chẩn đoán nguy cơ đột quỵ

1. Truy cập http://localhost:3001
2. Nhấn "Bắt đầu chuẩn đoán" hoặc menu "Chuẩn đoán"
3. Điền đầy đủ thông tin bệnh nhân:
   - Thông tin cá nhân (tuổi, giới tính, nghề nghiệp...)
   - Chỉ số sức khỏe (BMI, đường huyết, huyết áp...)
   - Tiền sử bệnh (tim mạch, hút thuốc...)
4. Nhấn "Chuẩn đoán" → Xem kết quả
5. Xuất báo cáo PDF (nếu cần)

### 2. Xem lịch sử

- Menu "Lịch sử" → Xem các lần chuẩn đoán trước
- Nhấn "PDF" để xuất báo cáo

### 3. Cấu hình Model (Nâng cao)

1. Menu "Cấu hình Hyperparameters"
2. Điều chỉnh tham số KNN:
   - `n_neighbors`: Số láng giềng (5-30)
   - `weights`: uniform/distance
   - `algorithm`: auto/ball_tree/kd_tree
   - `metric`: minkowski/euclidean
3. Nhấn "Lưu cấu hình"
4. Nhấn "Train Models" để huấn luyện lại

**Hoặc training thủ công:**
```bash
cd ml-api
python train_model.py
python run.py  # Restart server
```

## 🔧 CẤU HÌNH MÔI TRƯỜNG

### ml-api/.env
```env
FLASK_ENV=development
FLASK_APP=run.py
PORT=8000
```

### frontend/.env
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_VERSION=v1
PORT=3001
```

## 📊 THUẬT TOÁN KNN

Hệ thống sử dụng **K-Nearest Neighbors (KNN)** với cấu hình:
- **k = 15**: Số láng giềng gần nhất
- **weights = uniform**: Trọng số đồng đều
- **metric = minkowski (p=2)**: Khoảng cách Euclidean

**Lý do chọn KNN:**
- Đơn giản, dễ hiểu và triển khai
- Không cần giả định về phân phối dữ liệu
- Hiệu quả với dữ liệu phi tuyến
- Phù hợp với tập dữ liệu y tế

## 📈 DATASET

**Nguồn:** Kaggle - Healthcare Stroke Dataset  
**Link:** https://www.kaggle.com/datasets/fedesoriano/stroke-prediction-dataset

**Thông tin:**
- 5,110 bản ghi bệnh nhân
- 11 features: tuổi, giới tính, BMI, đường huyết, huyết áp, bệnh tim, hút thuốc...
- Imbalanced: 4.87% stroke, 95.13% no stroke

## 🛠️ XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi 1: Port đã được sử dụng
```bash
# Thay đổi port trong .env
PORT=8001  # ml-api/.env
PORT=3002  # frontend/.env
```

### Lỗi 2: Module not found
```bash
# Cài lại dependencies
cd ml-api
pip install -r requirements.txt

cd frontend
npm install
```

### Lỗi 3: CORS Error
```bash
# Kiểm tra frontend/.env
REACT_APP_API_URL=http://localhost:8000  # Phải khớp với ML API port
```

### Lỗi 4: Model not found
```bash
# Training lại model
cd ml-api
python train_model.py
```

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Kết quả chỉ mang tính tham khảo**, không thay thế chẩn đoán y khoa chuyên nghiệp
2. **Luôn tham khảo ý kiến bác sĩ** để có đánh giá chính xác
3. Model được train trên dataset có giới hạn, có thể không áp dụng cho mọi trường hợp
4. **Nguyên tắc "Âm tính giả - Dương tính thật":**
   - Kết quả tốt (nguy cơ thấp) → Chưa chắc an toàn, vẫn nên khám định kỳ
   - Kết quả xấu (nguy cơ cao) → Chắc chắn cần đi khám ngay

## 👥 NHÓM PHÁT TRIỂN

**Nhóm 4 - CT075T**  
Môn: Kho dữ liệu và Khai phá dữ liệu  
Năm học: 2025-2027

## 📄 GIẤY PHÉP

MIT License 