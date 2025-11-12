# Stroke Prediction Frontend

Frontend application cho hệ thống chuẩn đoán nguy cơ đột quỵ.

## Cấu trúc thư mục

```
frontend/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── contexts/       # React contexts
│   ├── utils/          # Utility functions
│   ├── styles/         # CSS files
│   ├── App.js          # Main App component
│   └── index.js        # Entry point
├── package.json
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
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

### Build for production
```bash
npm run build
```

## Tính năng

- ✅ Trang chủ giới thiệu hệ thống
- ✅ Form nhập liệu thông tin bệnh nhân
- ✅ Hiển thị kết quả chuẩn đoán
- ✅ Lịch sử các lần chuẩn đoán
- ✅ Trang giới thiệu về dự án

## Công nghệ sử dụng

- **React.js** - UI Library
- **React Router** - Routing
- **Ant Design** - UI Components
- **Axios** - HTTP Client
- **Recharts** - Charts library

## TODO

- [ ] Thêm biểu đồ trực quan hóa dữ liệu
- [ ] Implement authentication
- [ ] Add unit tests
- [ ] Responsive design improvements
- [ ] Dark mode support
