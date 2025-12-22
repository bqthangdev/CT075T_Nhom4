# Thay đổi thuật toán: Chỉ giữ lại KNN

## Tóm tắt
Hệ thống đã được điều chỉnh để chỉ sử dụng thuật toán **K-Nearest Neighbors (KNN)**, comment out các thuật toán khác (Logistic Regression, Random Forest, Gradient Boosting) mà không xóa code.

## Các file đã thay đổi

### Backend (Python - ml-api)

#### 1. `train_model.py`
- ✅ Comment out import cho Logistic Regression, Random Forest, Gradient Boosting
- ✅ Comment out việc load params và khởi tạo các model khác
- ✅ Chỉ giữ lại KNN trong dictionary `algorithms`

#### 2. `app/services/prediction_service.py`
- ✅ Comment out logic ưu tiên sử dụng Logistic Regression
- ✅ Thay đổi để ưu tiên sử dụng KNN cho dự đoán cuối cùng
- ✅ Fallback vẫn hoạt động nếu KNN không có

#### 3. `app/routes/validation.py`
- ✅ Comment out import cho Logistic Regression, Random Forest, Gradient Boosting
- ✅ Comment out default config cho các model khác
- ✅ Comment out việc khởi tạo pipeline cho các model khác
- ✅ Chỉ giữ lại KNN trong validation

#### 4. `app/routes/config.py`
- ✅ Cập nhật default config trong `reset_config()` 
- ✅ Đổi tên key từ `logistic_regression` → `_disabled_logistic_regression`
- ✅ Tương tự cho `random_forest` và `gradient_boosting`

#### 5. `app/config/model_config.json`
- ✅ Backup file gốc thành `model_config.json.backup`
- ✅ Đổi tên key config của các model khác (prefix `_disabled_`)
- ✅ Chỉ giữ active config cho KNN

### Frontend (React - frontend)

#### 1. `src/pages/AlgorithmsPage.js`
- ✅ Comment out các object định nghĩa cho Logistic Regression và Random Forest
- ✅ Chỉ hiển thị thông tin về KNN
- ✅ Thay đổi Alert message từ "đánh giá đa thuật toán" → "đánh giá KNN"
- ✅ Đổi `defaultActiveKey` từ `'logistic_regression'` → `'knn'`

#### 2. `src/pages/ModelConfigPage.js`
- ✅ Comment out khai báo Form cho Logistic Regression, Random Forest, Gradient Boosting
- ✅ Comment out việc set field values cho các form đã disable
- ✅ Comment out validation và save config cho các model khác
- ✅ Comment out việc check config changes cho các model khác
- ✅ Comment out toàn bộ Panel UI cho Logistic Regression và Random Forest
- ✅ Đổi `defaultActiveKey` từ `'lr'` → `'knn'`

#### 3. `src/pages/HistoryPage.js`
- ✅ Thay đổi Alert description từ "Logistic Regression" → "KNN"
- ✅ Thay đổi thông báo so sánh thuật toán
- ✅ Filter chỉ hiển thị KNN trong bảng so sánh (`filter(m => m.name === 'knn')`)

## Hướng dẫn khôi phục (nếu cần)

Nếu muốn khôi phục lại các thuật toán khác, thực hiện các bước sau:

### Backend:
1. Uncomment các dòng code đã comment trong các file Python
2. Khôi phục `model_config.json` từ backup:
   ```bash
   cd ml-api/app/config
   cp model_config.json.backup model_config.json
   ```
3. Chạy lại training:
   ```bash
   python train_model.py
   ```

### Frontend:
1. Uncomment các dòng code trong AlgorithmsPage.js, ModelConfigPage.js, HistoryPage.js
2. Đổi lại `defaultActiveKey` về giá trị cũ
3. Rebuild frontend nếu cần:
   ```bash
   cd frontend
   npm run build
   ```

## Kiểm tra sau thay đổi

### Backend:
```bash
cd ml-api
python train_model.py  # Chỉ train KNN
python run.py          # Khởi động API server
```

### Frontend:
```bash
cd frontend
npm start              # Development mode
```

### Kiểm tra các chức năng:
- ✅ Training chỉ tạo model KNN
- ✅ Prediction sử dụng KNN
- ✅ Validation chỉ test KNN
- ✅ Config page chỉ hiển thị KNN settings
- ✅ History page hiển thị kết quả KNN
- ✅ Algorithms page chỉ giới thiệu KNN

## Ghi chú

- Code của các thuật toán khác vẫn được giữ nguyên (comment out), không bị xóa
- File backup: `ml-api/app/config/model_config.json.backup`
- Các model file cũ (.joblib) vẫn còn trong `ml-api/app/models/` nhưng không được load
- History data cũ vẫn chứa thông tin của các model khác, nhưng sẽ không được tạo mới

## Thời gian thực hiện
- Ngày: 22/12/2025
- Trạng thái: ✅ Hoàn thành
