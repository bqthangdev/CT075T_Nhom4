# 🚀 Hướng dẫn Setup nhanh

## Cài đặt tất cả dependencies

### Windows (PowerShell)

```powershell
# Cài đặt ML API (Flask)
cd ml-api
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
cd ..

# Cài đặt Backend (Node.js - optional)
cd backend
npm install
copy .env.example .env
cd ..

# Cài đặt Frontend
cd frontend
npm install
copy .env.example .env
cd ..
```

### Linux/Mac

```bash
# Cài đặt ML API (Flask)
cd ml-api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
cd ..

# Cài đặt Backend (Node.js - optional)
cd backend
npm install
cp .env.example .env
cd ..

# Cài đặt Frontend
cd frontend
npm install
cp .env.example .env
cd ..
```

## Chạy cả Backend và Frontend

### Cách 1: Sử dụng 2-3 terminal riêng biệt

**Terminal 1 - ML API (Flask):**
```powershell
cd ml-api
# (khuyến nghị) Huấn luyện model trước lần chạy đầu:
# python train_model.py
python run.py
```

**Terminal 2 - Backend (Node.js - optional):**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```

### Cách 2: Script tự động (sắp tới)

Tạo file `start.ps1` (Windows) hoặc `start.sh` (Linux/Mac) để chạy cả 2 cùng lúc.

## Kiểm tra

1. ML API đang chạy tại: `http://localhost:8000`
   - Health check: `http://localhost:8000/health`

2. Backend (optional) đang chạy tại: `http://localhost:5000`
   - Health check: `http://localhost:5000/health`

3. Frontend đang chạy tại: `http://localhost:3001`

## Cấu hình mặc định

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/stroke_prediction
CORS_ORIGIN=http://localhost:3000
API_VERSION=v1
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_VERSION=v1
PORT=3001
```

## Xử lý lỗi thường gặp

### 1. Port đã được sử dụng
- Thay đổi PORT trong file `.env` của backend
- Cập nhật REACT_APP_API_URL trong `.env` của frontend

### 2. CORS Error
- Kiểm tra CORS_ORIGIN trong backend `.env`
- Đảm bảo frontend đang chạy đúng port

### 3. Dependencies lỗi
```bash
# Xóa node_modules và cài lại
rm -rf node_modules
npm install
```

## Next Steps

1. ✅ Setup cấu trúc dự án
2. ⏳ Tích hợp MongoDB (nếu cần)
3. ⏳ Implement ML algorithm
4. ⏳ Thêm authentication
5. ⏳ Deployment

## Tài liệu tham khảo

- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Ant Design](https://ant.design/)
- [MongoDB](https://www.mongodb.com/docs/)
