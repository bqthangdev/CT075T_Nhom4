# CT075T_Nhom4 - Hệ thống chuẩn đoán nguy cơ đột quỵ

Dự án demo hệ thống chuẩn đoán nguy cơ đột quỵ áp dụng các giải thuật chuẩn đoán hiện đại.

## 📋 Mô tả dự án

Hệ thống sử dụng công nghệ Machine Learning để dự đoán nguy cơ đột quỵ dựa trên các thông tin sức khỏe và lối sống của bệnh nhân. Dự án bao gồm:
- **Frontend**: React.js application với giao diện thân thiện
- **ML API (Flask)**: API cho mô hình dự đoán (đang dùng cho demo)
- **Backend (Node.js)**: REST API với Express.js (giữ cấu trúc, có thể tạm thời không chạy)

## 🗂️ Cấu trúc dự án

```
CT075T_Nhom4/
├── backend/                 # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── config/         # Database & environment config
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic & ML algorithms
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Entry point
│   └── package.json
│
├── frontend/               # Frontend application (React.js)
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API integration
│   │   ├── contexts/      # React contexts
│   │   ├── utils/         # Helper functions
│   │   └── styles/        # CSS files
│   └── package.json
│
├── ml-api/                 # Flask ML API (demo)
│   ├── app/               # Source code
│   ├── run.py             # Entry point (PORT=8000)
│   └── requirements.txt   # Python deps
└── README.md              # This file
```

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js (v16 trở lên)
- npm hoặc yarn
- MongoDB (optional - cho phần lưu trữ dữ liệu)

### ML API (Flask) Setup

1. Di chuyển vào thư mục ml-api:
```powershell
cd ml-api
```

2. Tạo virtualenv và cài đặt dependencies:
```powershell
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

3. Chạy server Flask:
```powershell
python run.py
```

Server Flask sẽ chạy tại `http://localhost:8000`

### Backend Setup (Node.js - optional)

1. Di chuyển vào thư mục backend:
```bash
cd backend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` từ `.env.example`:
```bash
copy .env.example .env
```

4. Chạy server:
```bash
# Development mode (với nodemon)
npm run dev

# Production mode
npm start
```

Server Node sẽ chạy tại `http://localhost:5000`

### Frontend Setup

1. Di chuyển vào thư mục frontend:
```bash
cd frontend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` từ `.env.example`:
```bash
copy .env.example .env
```

4. Chạy ứng dụng:
```bash
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3001`

Mặc định frontend sẽ gọi ML API tại `http://localhost:8000` (có thể chỉnh trong `frontend/.env`).

## 📊 Data source

- **URL**: https://www.kaggle.com/datasets/fedesoriano/stroke-prediction-dataset
- **Mô tả**: Stroke Prediction Dataset | Kaggle - 11 clinical features for predicting stroke events

## 🔧 Công nghệ sử dụng

### Backend
- Node.js - JavaScript runtime
- Express.js - Web framework
- MongoDB - Database (NoSQL)
- Mongoose - ODM for MongoDB

### Frontend
- Flask (ML API)
	- Flask, flask-cors, python-dotenv

- React.js - UI library
- React Router - Routing
- Ant Design - UI components
- Axios - HTTP client

## 📝 Tính năng

✅ **Đã hoàn thành:**
- Cấu trúc dự án cơ bản
- API endpoints cơ bản
- UI/UX với Ant Design
- Form nhập liệu bệnh nhân
- Trang lịch sử và giới thiệu

⏳ **Đang phát triển:**
- Tích hợp thuật toán Machine Learning
- Kết nối MongoDB
- Authentication & Authorization
- Data visualization với charts
- Unit tests

## 🎯 Hướng dẫn sử dụng

1. Truy cập trang chủ tại `http://localhost:3000`
2. Nhấn "Bắt đầu chuẩn đoán" hoặc vào menu "Chuẩn đoán"
3. Điền đầy đủ thông tin bệnh nhân vào form
4. Nhấn nút "Chuẩn đoán" để nhận kết quả
5. Xem lịch sử các lần chuẩn đoán tại menu "Lịch sử"

## ⚠️ Lưu ý quan trọng

Kết quả từ hệ thống chỉ mang tính chất tham khảo và hỗ trợ. Không thay thế cho chẩn đoán y khoa chuyên nghiệp. Vui lòng tham khảo ý kiến bác sĩ để có đánh giá chính xác nhất.

## 👥 Nhóm phát triển

Nhóm 4 - CT075T

## 📄 License

MIT License 