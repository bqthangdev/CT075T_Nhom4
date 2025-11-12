# Stroke Prediction Backend API

Backend API cho hệ thống chuẩn đoán nguy cơ đột quỵ.

## Cấu trúc thư mục

```
backend/
├── src/
│   ├── config/          # Cấu hình database, env
│   ├── controllers/     # Xử lý request/response
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── package.json
├── .env.example
└── README.md
```

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

3. Cập nhật các biến môi trường trong file `.env`

## Chạy ứng dụng

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Kiểm tra trạng thái server

### Predictions
- `POST /api/v1/predictions/predict` - Dự đoán nguy cơ đột quỵ
- `GET /api/v1/predictions/history` - Lấy lịch sử dự đoán

## Công nghệ sử dụng

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB

## TODO

- [ ] Tích hợp thuật toán machine learning
- [ ] Kết nối MongoDB
- [ ] Implement authentication
- [ ] Add unit tests
- [ ] API documentation (Swagger)
