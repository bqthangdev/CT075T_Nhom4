# 📁 Chi tiết cấu trúc dự án

## Tổng quan

Dự án được chia thành 3 phần chính:
- **Backend**: RESTful API server (Node.js + Express) — hiện giữ cấu trúc, có thể tạm thời không chạy.
- **ML API**: Dịch vụ Flask cung cấp endpoint dự đoán (đang dùng cho demo).
- **Frontend**: Single Page Application (React.js).

---

## 🔧 Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js              # Cấu hình kết nối MongoDB
│   │
│   ├── controllers/
│   │   └── predictionController.js  # Xử lý logic cho API predictions
│   │
│   ├── models/
│   │   └── Patient.js               # Schema MongoDB cho bệnh nhân
│   │
│   ├── routes/
│   │   └── predictionRoutes.js      # Định nghĩa routes cho predictions
│   │
│   ├── services/
│   │   └── predictionService.js     # Business logic & ML algorithms
│   │
│   ├── middleware/
│   │   └── validator.js             # Validation middleware
│   │
│   ├── utils/
│   │   ├── helpers.js               # Các hàm tiện ích
│   │   └── logger.js                # Logger utility
│   │
│   └── server.js                    # Entry point - khởi tạo Express server
│
├── .env.example                     # Template cho environment variables
├── .gitignore                       # Git ignore rules
├── package.json                     # Dependencies & scripts
└── README.md                        # Hướng dẫn backend

```

### API Endpoints (Dự kiến)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/predictions/predict` | Dự đoán nguy cơ đột quỵ |
| GET | `/api/v1/predictions/history` | Lấy lịch sử dự đoán |

---

## 🤖 ML API (Flask) Structure

```
ml-api/
├── app/
│   ├── __init__.py                 # Tạo Flask app, CORS, routes
│   ├── routes/
│   │   └── predictions.py          # /predict, /history endpoints
│   ├── services/
│   │   └── prediction_service.py   # Heuristic scoring (placeholder ML)
│   └── utils/
│       └── helpers.py              # Validate input
├── run.py                          # Entry point (PORT=8000)
├── requirements.txt                # Python dependencies
└── .env.example                    # Flask env
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/predictions/predict` | Dự đoán nguy cơ đột quỵ |
| GET | `/api/v1/predictions/history` | Lịch sử dự đoán (in-memory) |

---

## 🎨 Frontend Structure

```
frontend/
├── public/
│   └── index.html                   # HTML template
│
├── src/
│   ├── components/
│   │   └── Layout.js                # Main layout component (Header, Footer, Navigation)
│   │
│   ├── pages/
│   │   ├── HomePage.js              # Trang chủ
│   │   ├── PredictionPage.js        # Trang chuẩn đoán (form input)
│   │   ├── HistoryPage.js           # Trang lịch sử
│   │   └── AboutPage.js             # Trang giới thiệu
│   │
│   ├── services/
│   │   └── api.js                   # Axios configuration & API calls
│   │
│   ├── contexts/
│   │   └── (empty)                  # React Context API (sẽ thêm sau)
│   │
│   ├── utils/
│   │   └── helpers.js               # Utility functions (format, validate...)
│   │
│   ├── styles/
│   │   ├── index.css                # Global styles
│   │   ├── App.css                  # App component styles
│   │   └── Layout.css               # Layout component styles
│   │
│   ├── App.js                       # Main App component với routing
│   └── index.js                     # Entry point - render React app
│
├── .env.example                     # Template cho environment variables
├── .gitignore                       # Git ignore rules
├── package.json                     # Dependencies & scripts
└── README.md                        # Hướng dẫn frontend
```

### Routing

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HomePage | Trang chủ giới thiệu |
| `/prediction` | PredictionPage | Form nhập thông tin & chuẩn đoán |
| `/history` | HistoryPage | Xem lịch sử các lần chuẩn đoán |
| `/about` | AboutPage | Thông tin về dự án |

---

## 🔄 Luồng dữ liệu (Data Flow)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │ ◄─────► │   React     │ ◄─────► │   Flask     │
│   (User)    │         │  Frontend   │         │   ML API    │
└─────────────┘         └─────────────┘         └─────────────┘
                      │
                      ▼
                   ┌─────────────┐
                   │   (Future)  │
                   │   Model DB  │
                   └─────────────┘
```

### Quy trình chuẩn đoán:

1. **User Input**: Người dùng nhập thông tin vào form (PredictionPage)
2. **Validation**: Frontend validate dữ liệu (utils/helpers.js)
3. **API Call**: Gửi request tới backend qua axios (services/api.js)
4. **ML API Processing (hiện tại)**:
   - Flask nhận request (routes/predictions.py)
   - Service tính điểm risk (services/prediction_service.py)
   - Trả kết quả về frontend

5. **Backend Processing (tương lai)**: 
   - Middleware validation (middleware/validator.js)
   - Controller nhận request (controllers/predictionController.js)
   - Service xử lý logic ML (services/predictionService.js)
   - Lưu vào database (models/Patient.js)
6. **Response**: API trả kết quả về frontend
7. **Display**: Frontend hiển thị kết quả cho người dùng

---

## 📦 Dependencies chính

### Backend
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `cors`: Xử lý Cross-Origin Resource Sharing
- `dotenv`: Quản lý environment variables
- `helmet`: Security headers
- `morgan`: HTTP request logger
- `nodemon`: Auto-restart server (dev)

### Frontend
- `react`: UI library
- `react-router-dom`: Client-side routing
- `axios`: HTTP client
- `antd`: UI component library
- `recharts`: Charting library

---

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=5000                                           # Server port
NODE_ENV=development                                # Environment
MONGODB_URI=mongodb://localhost:27017/stroke_prediction  # Database URL
CORS_ORIGIN=http://localhost:3000                  # Allowed origin
API_VERSION=v1                                     # API version
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000           # Flask ML API URL
REACT_APP_API_VERSION=v1                          # API version
PORT=3001                                          # Frontend port
```

---

## 🚀 Next Steps

1. **Tích hợp ML Model**:
   - Train model với dataset từ Kaggle
   - Export model (Python → Node.js)
   - Implement prediction logic trong `predictionService.js`

2. **Database Integration**:
   - Cài đặt MongoDB locally hoặc sử dụng MongoDB Atlas
   - Kết nối database trong `config/database.js`
   - Test CRUD operations

3. **Authentication** (Optional):
   - Thêm user authentication
   - JWT tokens
   - Protected routes

4. **Testing**:
   - Unit tests cho backend (Jest)
   - Component tests cho frontend (React Testing Library)

5. **Deployment**:
   - Backend: Heroku, Railway, hoặc VPS
   - Frontend: Vercel, Netlify
   - Database: MongoDB Atlas

---

## 📚 Tài liệu tham khảo

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Ant Design Components](https://ant.design/components/overview/)
