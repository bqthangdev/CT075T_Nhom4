# Hướng Dẫn Chức Năng Xuất Báo Cáo PDF

## 📋 Tổng Quan

Hệ thống hiện đã được bổ sung chức năng **Xuất Báo Cáo Chuẩn Đoán Y Khoa** theo định dạng PDF chuyên nghiệp, tuân thủ tiêu chuẩn báo cáo y tế.

## ✨ Tính Năng

### 1. Báo Cáo Bao Gồm:

#### **I. Thông Tin Bệnh Nhân**
- Họ và tên
- Số CCCD
- Tuổi, Giới tính
- Tình trạng sức khỏe (Tăng huyết áp, Bệnh tim)
- Tình trạng hôn nhân
- Loại công việc
- Nơi cư trú
- Chỉ số Glucose trung bình
- Chỉ số BMI
- Tình trạng hút thuốc

#### **II. Kết Quả Chẩn Đoán**
- **Điểm rủi ro đột quỵ** (0-100%)
- **Mức độ nguy hiểm** (Thấp/Trung bình/Cao)
- Màu sắc phân biệt theo mức độ:
  - 🟢 Xanh: Rủi ro thấp
  - 🟠 Cam: Rủi ro trung bình
  - 🔴 Đỏ: Rủi ro cao

#### **III. Phân Tích Chi Tiết Từ Các Thuật Toán**
- So sánh kết quả từ 4 thuật toán ML:
  - ⭐ **Logistic Regression** (Thuật toán chính - được đánh dấu)
  - Random Forest
  - Gradient Boosting
  - K-Nearest Neighbors
- Điểm rủi ro và mức độ từ mỗi thuật toán

#### **IV. Khuyến Nghị Y Tế**
- Danh sách khuyến nghị dựa trên:
  - Tuổi
  - Tình trạng bệnh nền
  - Chỉ số sức khỏe
  - Mức độ rủi ro

#### **V. Ghi Chú Y Khoa**
Khuyến nghị chi tiết theo từng mức độ rủi ro:

**Rủi ro CAO (≥66%):**
- ⚠️ Cảnh báo nghiêm trọng
- Khám bác sĩ chuyên khoa NGAY LẬP TỨC
- Xét nghiệm chuyên sâu (CT, MRI não, siêu âm tim)
- Kiểm soát chặt chẽ huyết áp, đường huyết
- Tuân thủ nghiêm ngặt điều trị

**Rủi ro TRUNG BÌNH (33-66%):**
- ⚡ Chú ý theo dõi
- Khám định kỳ 3-6 tháng
- Kiểm tra định kỳ các chỉ số
- Duy trì lối sống lành mạnh
- Tuân thủ điều trị bệnh nền

**Rủi ro THẤP (<33%):**
- ✅ Tình trạng tốt
- Duy trì lối sống lành mạnh
- Khám sức khỏe định kỳ hàng năm
- Theo dõi các yếu tố nguy cơ

#### **VI. Tuyên Bố Trách Nhiệm**
- Thông tin về tính chất tham khảo của AI/ML
- Khuyến nghị tham khảo bác sĩ chuyên khoa
- Thông tin hệ thống và phiên bản

#### **VII. Phần Ký Tên**
- Khu vực dành cho bác sĩ ký tên và đóng dấu
- Ngày tạo báo cáo
- Mã báo cáo duy nhất

---

## 🚀 Cách Sử Dụng

### **A. Từ Trang Chuẩn Đoán (PredictionPage)**

1. Nhập đầy đủ thông tin bệnh nhân
2. Nhấn nút **"Chuẩn đoán"**
3. Sau khi có kết quả, nhấn nút **"📄 Xuất báo cáo PDF"** (màu xanh lá, góc phải trên của card "Kết quả tổng hợp")
4. File PDF sẽ được tải xuống tự động với tên: `Bao_cao_chan_doan_[timestamp].pdf`

### **B. Từ Trang Lịch Sử (HistoryPage)**

1. Xem danh sách lịch sử chuẩn đoán
2. Ở cột "Thao tác", nhấn nút **"PDF"** (màu xanh lá) của bản ghi muốn xuất
3. File PDF sẽ được tải xuống với tên: `Bao_cao_chan_doan_[tên bệnh nhân]_[timestamp].pdf`

---

## 🛠️ Chi Tiết Kỹ Thuật

### **Backend (Python Flask)**

#### File Mới:
- **`ml-api/app/services/report_service.py`**: Service tạo PDF sử dụng ReportLab
- **`ml-api/app/routes/report.py`**: API endpoint `/api/v1/report/generate`

#### Thư Viện:
```python
reportlab==4.0.7  # Tạo PDF
Pillow>=10.2.0    # Xử lý hình ảnh
```

#### API Endpoint:
```
POST /api/v1/report/generate
Content-Type: application/json

Request Body:
{
  "patientData": {
    "patientName": "Trần Văn B",
    "patientId": "023154668455",
    "age": 55,
    "gender": "Male",
    ...
  },
  "predictionResult": {
    "riskScore": 0.8671,
    "riskLevel": "High Risk",
    "models": [...],
    "recommendations": [...]
  }
}

Response: PDF file (application/pdf)
```

### **Frontend (React)**

#### Thay Đổi:
1. **`frontend/src/services/api.js`**:
   - Thêm hàm `generateReport(patientData, predictionResult)`
   - Xử lý response type `blob` cho file PDF

2. **`frontend/src/pages/PredictionPage.js`**:
   - State mới: `generatingReport`, `patientFormData`
   - Hàm mới: `handleGenerateReport()`
   - UI: Nút "Xuất báo cáo PDF" trong card "Kết quả tổng hợp"

3. **`frontend/src/pages/HistoryPage.js`**:
   - State mới: `generatingReport`
   - Hàm mới: `handleGenerateReport(record)`
   - UI: Nút "PDF" trong cột "Thao tác" của bảng

---

## 📝 Định Dạng PDF

### **Layout:**
- Khổ giấy: **A4**
- Margins: 72 points (khoảng 2.5cm)
- Font: Helvetica, Helvetica-Bold
- Colors: 
  - Primary: #1890ff (xanh dương)
  - Success: #52c41a (xanh lá)
  - Warning: #fa8c16 (cam)
  - Danger: #f5222d (đỏ)

### **Cấu Trúc:**
1. Header với tiêu đề chính
2. Metadata (ngày, mã báo cáo)
3. 6 phần nội dung chính
4. Phần ký tên
5. Footer với thông tin hệ thống

---

## 🎨 Giao Diện

### **Nút Xuất Báo Cáo:**
- **Icon**: 📄 (FilePdfOutlined)
- **Màu**: Xanh lá (#52c41a)
- **Text**: "📄 Xuất báo cáo PDF" (PredictionPage) hoặc "PDF" (HistoryPage)
- **Loading State**: Hiển thị spinner khi đang tạo PDF

---

## ⚙️ Cài Đặt & Chạy

### **1. Cài Đặt Dependencies:**
```bash
cd ml-api
pip install -r requirements.txt
```

### **2. Khởi Động Backend:**
```bash
cd ml-api
python run.py
```

### **3. Khởi Động Frontend:**
```bash
cd frontend
npm run dev
```

### **4. Kiểm Tra:**
- Backend: http://localhost:8000/health
- Frontend: http://localhost:3000
- Test Report API: http://localhost:8000/api/v1/report/test

---

## 🔍 Test

### **Test API Trực Tiếp:**
```bash
curl -X POST http://localhost:8000/api/v1/report/generate \
  -H "Content-Type: application/json" \
  -d '{
    "patientData": {
      "patientName": "Test Patient",
      "age": 55,
      ...
    },
    "predictionResult": {
      "riskScore": 0.5,
      "riskLevel": "Medium Risk",
      ...
    }
  }' \
  --output test_report.pdf
```

---

## 🐛 Xử Lý Lỗi

### **Lỗi Thường Gặp:**

1. **"Import reportlab could not be resolved"**
   - **Giải pháp**: Chạy `pip install reportlab Pillow`

2. **"Failed to generate report"**
   - **Kiểm tra**: Dữ liệu patient và prediction có đầy đủ không
   - **Log**: Xem console backend để biết chi tiết lỗi

3. **PDF không tải xuống**
   - **Kiểm tra**: CORS settings trong Flask
   - **Kiểm tra**: Browser console cho lỗi network

4. **PDF bị lỗi font hoặc layout**
   - **Nguyên nhân**: ReportLab chỉ hỗ trợ một số font chuẩn
   - **Giải pháp**: Sử dụng Helvetica, Times, Courier

---

## 📊 Mẫu Báo Cáo

Xem file PDF mẫu được tạo ra:
- Header: "BÁO CÁO CHẨN ĐOÁN Y KHOA"
- Thông tin đầy đủ và chuyên nghiệp
- Bảng biểu rõ ràng, dễ đọc
- Màu sắc phân biệt mức độ rủi ro
- Footer với thông tin hệ thống

---

## 🔒 Bảo Mật

- ⚠️ **Lưu ý**: PDF chứa thông tin y tế nhạy cảm
- Không lưu trữ PDF trên server (chỉ tạo và trả về)
- Client tự quyết định lưu trữ
- Khuyến nghị mã hóa khi lưu trữ dài hạn

---

## 📈 Phát Triển Tương Lai

### **Có Thể Bổ Sung:**
1. Thêm logo bệnh viện/phòng khám
2. Watermark "BẢN SAO" cho các bản không chính thức
3. QR code để xác thực báo cáo
4. Chữ ký điện tử
5. Export sang các định dạng khác (Word, HTML)
6. Gửi email báo cáo trực tiếp
7. In trực tiếp từ trình duyệt
8. Tùy chỉnh template theo yêu cầu

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console (backend & frontend) để xem lỗi
2. Xác nhận đã cài đặt đầy đủ dependencies
3. Kiểm tra API endpoint đang hoạt động: `/api/v1/report/test`
4. Xem log chi tiết trong terminal backend

---

**© 2025 CT075T - Nhóm 4. All rights reserved.**
