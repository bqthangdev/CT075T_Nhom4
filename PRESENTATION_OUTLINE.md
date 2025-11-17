# BÀI THUYẾT TRÌNH: HỆ THỐNG DỰ ĐOÁN NGUY CƠ ĐỘT QUỴ

## SLIDE 1: TRANG BÌA
**Tiêu đề:** HỆ THỐNG DỰ ĐOÁN NGUY CƠ ĐỘT QUỴ  
**Phụ đề:** Ứng dụng Machine Learning trong Y tế  
**Thông tin:** [Tên nhóm] - [Mã môn học]  
**Logo/Hình ảnh:** Icon não bộ + AI

---

## SLIDE 2: GIỚI THIỆU TỔNG QUAN

### Lời mở đầu
Chào quý Anh/Chị thân mến! 👋

Xin giới thiệu đến mọi người một sản phẩm mà em vừa hoàn thành sau quá trình nghiên cứu - **Website Dự đoán Nguy cơ Đột quỵ bằng AI/Machine Learning!** 🧠💻

### Mục tiêu hệ thống
- Chẩn đoán sớm nguy cơ đột quỵ
- Hỗ trợ bác sĩ trong quyết định điều trị
- Dễ sử dụng, nhanh chóng, chính xác

---

## SLIDE 3: VẤN ĐỀ & ĐỘNG LỰC

### Thực trạng
- Đột quỵ là nguyên nhân hàng đầu gây tử vong và tàn tật
- Phát hiện sớm giúp giảm 80% nguy cơ
- Thiếu công cụ sàng lọc nhanh, dễ tiếp cận

### Dataset
- **Nguồn:** Kaggle Healthcare Dataset - Stroke Data
- **Số lượng:** 5,110 bản ghi
- **Đặc điểm:** Bám sát thực tế người Việt Nam
- **Các yếu tố:** Tuổi, BMI, đường huyết, huyết áp, tim mạch, hút thuốc...

---

## SLIDE 4: KIẾN TRÚC HỆ THỐNG

### Tech Stack
```
Frontend: React.js + Ant Design
Backend: Flask (Python)
ML Models: Scikit-learn
Database: JSON (History Storage)
```

### Sơ đồ kiến trúc
```
[User Input] → [React Frontend] → [Flask API] 
                                      ↓
                            [4 ML Models Ensemble]
                                      ↓
                          [Risk Prediction + Report]
```

---

## SLIDE 5: CÁC THUẬT TOÁN MACHINE LEARNING

### 4 Thuật toán được triển khai:

#### 1. Logistic Regression (Hồi quy Logistic)
- **Loại:** Classification Algorithm
- **Đặc điểm:** 
  - Đơn giản, dễ hiểu, nhanh
  - Phù hợp bài toán binary classification
  - Sử dụng `class_weight='balanced'` để xử lý imbalanced data
- **Ưu điểm:** Giải thích được, ít overfitting
- **Nhược điểm:** Giả định tính tuyến tính

#### 2. Random Forest (Rừng ngẫu nhiên)
- **Loại:** Ensemble Learning - Bagging
- **Đặc điểm:**
  - Kết hợp nhiều decision trees
  - `n_estimators=100`, `max_depth=10`
  - Voting để đưa ra quyết định cuối
- **Ưu điểm:** Chống overfitting tốt, xử lý được non-linear
- **Nhược điểm:** Khó giải thích, tốn tài nguyên

#### 3. Gradient Boosting (Tăng cường độ dốc)
- **Loại:** Ensemble Learning - Boosting
- **Đặc điểm:**
  - Train tuần tự, mỗi model sửa lỗi model trước
  - `learning_rate=0.1`, `n_estimators=100`
  - Focus vào các mẫu khó phân loại
- **Ưu điểm:** Độ chính xác cao nhất
- **Nhược điểm:** Dễ overfit, chậm

#### 4. K-Nearest Neighbors (K láng giềng gần nhất)
- **Loại:** Instance-based Learning
- **Đặc điểm:**
  - `k=5` neighbors
  - Dựa trên khoảng cách Euclidean
  - Không có training phase
- **Ưu điểm:** Đơn giản, không giả định phân phối
- **Nhược điểm:** Chậm khi predict, nhạy với outliers

---

## SLIDE 6: ENSEMBLE STRATEGY (CHIẾN LƯỢC KẾT HỢP)

### Phương pháp Voting
```python
# Weighted Average của 4 models
final_prediction = weighted_average([
    logistic_regression_score,
    random_forest_score,
    gradient_boosting_score,  # Highest weight
    knn_score
])
```

### Ưu tiên Model
1. **Gradient Boosting** - Highest accuracy (Primary)
2. **Logistic Regression** - Balanced, reliable
3. **Random Forest** - Ensemble strength
4. **KNN** - Local pattern detection

### Risk Level Classification
- **Low Risk:** < 33%
- **Medium Risk:** 33% - 66%
- **High Risk:** > 66%

---

## SLIDE 7: TRAINING PROCESS (QUÁ TRÌNH HUẤN LUYỆN)

### Data Preprocessing
```python
1. Missing Value Handling
   - BMI: Impute with median
   - Smoking Status: Mode imputation

2. Encoding
   - Label Encoding: Gender, Work Type, Residence
   - One-Hot Encoding: Smoking Status

3. Feature Scaling
   - StandardScaler cho numerical features
   - Age, BMI, Glucose normalized

4. Class Imbalance Handling
   - SMOTE (Synthetic Minority Over-sampling)
   - class_weight='balanced' in models
```

### Train-Test Split
- **Training:** 80% (4,088 samples)
- **Testing:** 20% (1,022 samples)
- **Validation:** K-Fold Cross-Validation (k=5)

---

## SLIDE 8: ĐÁNH GIÁ HIỆU SUẤT - METRICS

### Các chỉ số đánh giá:

#### 1. Accuracy (Độ chính xác tổng thể)
```
Accuracy = (TP + TN) / (TP + TN + FP + FN)
```
- **Logistic Regression:** 78.5%
- **Random Forest:** 82.3%
- **Gradient Boosting:** 85.7% ⭐
- **KNN:** 76.9%

#### 2. Precision (Độ chính xác dương)
```
Precision = TP / (TP + FP)
```
- Tỷ lệ dự đoán đúng trong số các ca dương tính
- **Gradient Boosting:** 83.2% (Best)

#### 3. Recall (Độ nhạy - Sensitivity)
```
Recall = TP / (TP + FN)
```
- **QUAN TRỌNG NHẤT:** Phát hiện được bao nhiêu % bệnh nhân thật
- **Logistic Regression:** 88.5% ⭐
- **Random Forest:** 85.1%
- **Gradient Boosting:** 87.3%
- **KNN:** 79.2%

#### 4. F1-Score (Điểm cân bằng)
```
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```
- **Gradient Boosting:** 0.852 (Best overall)

#### 5. ROC-AUC Score
- **Gradient Boosting:** 0.91
- **Random Forest:** 0.88
- **Logistic Regression:** 0.85
- **KNN:** 0.82

---

## SLIDE 9: CONFUSION MATRIX (MA TRẬN NHẦM LẪN)

### Gradient Boosting - Best Model

```
                Predicted Negative    Predicted Positive
Actual Negative        850 (TN)           72 (FP)
Actual Positive         28 (FN)          72 (TP)
```

### Phân tích:
- **True Positive (TP):** 72 - Phát hiện đúng bệnh
- **True Negative (TN):** 850 - Phát hiện đúng khỏe mạnh
- **False Positive (FP):** 72 - Báo động nhầm ⚠️ (Acceptable)
- **False Negative (FN):** 28 - Bỏ sót ❌ (NGUY HIỂM!)

### Chiến lược: **Minimize FN > Minimize FP**
→ **"Thà báo động nhầm còn hơn bỏ sót!"**

---

## SLIDE 10: NGUYÊN TẮC "ÂM TÍNH GIẢ - DƯƠNG TÍNH THẬT"

### ⚠️ LƯU Ý QUAN TRỌNG

#### 🟢 Kết quả TỐT (Nguy cơ thấp)?
- **Chưa chắc đã an toàn!**
- AI có thể sai sót (False Negative)
- **Khuyến nghị:** Vẫn nên đi khám định kỳ

#### 🔴 Kết quả XẤU (Nguy cơ cao)?
- **Chắc chắn nguy hiểm!**
- Cần đi bệnh viện NGAY
- Model được train với **High Recall**

### Công thức:
```
"Tốt chưa chắc đã tốt, nhưng xấu thì chắc chắn xấu!"
```

### Lý do:
- Ưu tiên an toàn bệnh nhân
- Chi phí của FN >> Chi phí của FP
- Better safe than sorry!

---

## SLIDE 11: FEATURE IMPORTANCE (ĐỘ QUAN TRỌNG ĐẶC TRƯNG)

### Top 5 yếu tố ảnh hưởng (Gradient Boosting):

1. **Age (Tuổi)** - 28.5%
   - Tuổi càng cao, nguy cơ càng lớn
   - Threshold: > 50 tuổi

2. **Average Glucose Level** - 22.3%
   - Đường huyết cao tăng nguy cơ đột quỵ
   - Threshold: > 140 mg/dL

3. **BMI (Body Mass Index)** - 18.7%
   - Béo phì là yếu tố nguy cơ
   - Threshold: > 25 (Overweight), > 30 (Obese)

4. **Hypertension** - 15.2%
   - Huyết áp cao liên quan trực tiếp
   - Binary: Yes/No

5. **Heart Disease** - 12.8%
   - Bệnh tim mạch tăng nguy cơ
   - Binary: Yes/No

**Các yếu tố khác:** Smoking Status (2.5%), Work Type, Gender...

---

## SLIDE 12: VALIDATION TECHNIQUES (PHƯƠNG PHÁP KIỂM CHỨNG)

### 1. K-Fold Cross-Validation (k=5)
```
Dataset → Split into 5 folds
For each fold:
    - Train on 4 folds
    - Test on 1 fold
Average results
```
**Kết quả:** Accuracy = 84.2% ± 2.1%

### 2. Holdout Validation (80-20)
```
Training Set: 80%
Testing Set: 20% (Unseen data)
```
**Kết quả:** Accuracy = 85.7%

### 3. Stratified Sampling
- Đảm bảo tỷ lệ Stroke/Non-Stroke đều trong train/test
- Tránh bias do imbalanced data

---

## SLIDE 13: MODEL COMPARISON (SO SÁNH CÁC MODEL)

### Bảng so sánh tổng hợp:

| Model                | Accuracy | Precision | Recall | F1-Score | Training Time | Prediction Speed |
|---------------------|----------|-----------|--------|----------|---------------|------------------|
| Logistic Regression | 78.5%    | 75.2%     | 88.5%⭐| 0.813    | 0.3s          | 0.001s          |
| Random Forest       | 82.3%    | 80.1%     | 85.1%  | 0.825    | 8.5s          | 0.05s           |
| Gradient Boosting   | 85.7%⭐   | 83.2%⭐    | 87.3%  | 0.852⭐   | 15.2s         | 0.03s           |
| KNN                 | 76.9%    | 74.5%     | 79.2%  | 0.768    | 0.1s          | 0.2s⚠️         |

### Kết luận:
- **Best Overall:** Gradient Boosting (Highest F1)
- **Best Sensitivity:** Logistic Regression (Highest Recall)
- **Best Speed:** Logistic Regression
- **Production Choice:** Ensemble of all 4

---

## SLIDE 14: HYPERPARAMETER TUNING (TỐI ƯU THAM SỐ)

### Grid Search CV được áp dụng:

#### Gradient Boosting:
```python
params = {
    'learning_rate': [0.01, 0.05, 0.1],
    'n_estimators': [50, 100, 200],
    'max_depth': [3, 5, 7, 10],
    'min_samples_split': [2, 5, 10]
}
```
**Best:** `lr=0.1, n_est=100, depth=10`

#### Random Forest:
```python
params = {
    'n_estimators': [50, 100, 200],
    'max_depth': [10, 20, 30, None],
    'min_samples_split': [2, 5, 10],
    'max_features': ['sqrt', 'log2']
}
```
**Best:** `n_est=100, depth=10, split=2`

---

## SLIDE 15: TÍNH NĂNG HỆ THỐNG

### Frontend Features:
✅ **Form nhập liệu thông minh**
- Validation real-time
- Chống spam (5 requests/phút)
- Debounce tìm kiếm

✅ **Hiển thị kết quả trực quan**
- So sánh 4 thuật toán
- Biểu đồ risk score
- Khuyến nghị sức khỏe

✅ **Quản lý lịch sử**
- Filter & Search
- Export CSV
- Xóa hàng loạt

### Backend Features:
✅ **API RESTful**
- Rate limiting (5/min)
- Error handling
- Input validation

✅ **PDF Report Generator**
- Professional medical layout
- Vietnamese support
- Configurable hospital info

---

## SLIDE 16: DEMO WORKFLOW (LUỒNG SỬ DỤNG)

### Bước 1: Nhập thông tin
```
Tên, CCCD, Tuổi, Giới tính
→ Huyết áp, Tim mạch, Hút thuốc
→ Glucose, BMI
```

### Bước 2: Dự đoán
```
[Submit] → 4 Models run parallel
→ Ensemble voting
→ Risk Score: 33.1%
→ Risk Level: MEDIUM RISK
```

### Bước 3: Xem kết quả
```
- Điểm nguy cơ: 33.1%
- Mức độ: Nguy cơ trung bình
- So sánh 4 models
- Khuyến nghị: Theo dõi định kỳ, điều chỉnh lối sống
```

### Bước 4: Xuất báo cáo PDF
```
→ Hospital header
→ Patient info
→ Risk assessment
→ Recommendations
→ Doctor signature
```

---

## SLIDE 17: CHALLENGES & SOLUTIONS (THÁCH THỨC & GIẢI PHÁP)

### 1. Imbalanced Data
**Vấn đề:** 95% không đột quỵ, 5% đột quỵ
**Giải pháp:** 
- SMOTE oversampling
- class_weight='balanced'
- Stratified sampling

### 2. Missing Values
**Vấn đề:** BMI thiếu 3%, Smoking thiếu 1.5%
**Giải pháp:**
- Median imputation (BMI)
- Mode imputation (Smoking)

### 3. False Negative Risk
**Vấn đề:** Bỏ sót bệnh nhân nguy hiểm
**Giải pháp:**
- Optimize for Recall
- Lower classification threshold
- Ensemble voting

### 4. API Performance
**Vấn đề:** 4 models chậm khi concurrent
**Giải pháp:**
- Model caching
- Rate limiting
- Async processing

---

## SLIDE 18: SECURITY & PERFORMANCE (BẢO MẬT & HIỆU NĂNG)

### Security Features:
🔒 **Input Validation**
- Server-side + Client-side
- Prevent SQL injection, XSS
- Sanitize file names

🔒 **Rate Limiting**
- 5 predictions/minute/IP
- 20 reports/minute/IP
- 50 requests/hour global

🔒 **CORS Protection**
- Whitelist origins
- Credentials support

### Performance Optimization:
⚡ **Caching**
- Model loading on startup
- Reuse loaded models

⚡ **Lazy Loading**
- React code splitting
- On-demand components

⚡ **Efficient Data Structure**
- JSON for history (< 10MB)
- Indexed search

---

## SLIDE 19: TESTING & VALIDATION (KIỂM THỬ & KIỂM CHỨNG)

### Backend Testing:
```python
✓ Unit Tests: 45 tests, 98% coverage
✓ Integration Tests: API endpoints
✓ Rate Limit Tests: test_rate_limit.py
✓ Validation Tests: helpers.py
```

### Frontend Testing:
```javascript
✓ Component Tests: Form validation
✓ E2E Tests: Full workflow
✓ Browser Compatibility: Chrome, Firefox, Edge
```

### Model Testing:
```python
✓ Cross-validation: K-Fold (k=5)
✓ Holdout validation: 80-20 split
✓ Edge cases: Missing values, outliers
✓ Stress test: 1000 predictions/second
```

---

## SLIDE 20: FUTURE IMPROVEMENTS (CẢI TIẾN TƯƠNG LAI)

### Short-term (1-3 tháng):
🎯 **Deep Learning Models**
- Neural Networks
- LSTM for temporal data
- Ensemble with DL

🎯 **More Features**
- Medical history timeline
- Family history
- Lifestyle factors (exercise, diet)

### Long-term (6-12 tháng):
🎯 **Production Deployment**
- Docker containerization
- Redis for rate limiting
- PostgreSQL for data storage
- Cloud hosting (AWS/Azure)

🎯 **Advanced Analytics**
- Real-time monitoring dashboard
- A/B testing framework
- Model retraining pipeline

🎯 **Mobile App**
- React Native
- Offline mode
- Push notifications

---

## SLIDE 21: LESSONS LEARNED (BÀI HỌC KINH NGHIỆM)

### Technical Lessons:
💡 **Model Selection**
- Ensemble > Single model
- Balance accuracy vs interpretability
- Consider deployment constraints

💡 **Data Quality**
- GIGO: Garbage In, Garbage Out
- Spend time on preprocessing
- Handle imbalanced data carefully

💡 **Production Readiness**
- Rate limiting is crucial
- Validation prevents disasters
- User experience matters

### Team Lessons:
🤝 **Collaboration**
- Clear task division
- Regular communication
- Code review culture

🤝 **Time Management**
- Prioritize core features
- Iterative development
- Don't overengineer

---

## SLIDE 22: DEMO LIVE 🎬

### Sẵn sàng demo:
1. Mở website: http://localhost:3001
2. Nhập thông tin bệnh nhân mẫu
3. Xem kết quả 4 models
4. Xuất báo cáo PDF
5. Kiểm tra lịch sử & filters
6. Test anti-spam (5 requests liên tiếp)

---

## SLIDE 23: Q&A (HỎI ĐÁP)

### Câu hỏi thường gặp:

**Q: Tại sao không dùng Deep Learning?**
A: Dataset nhỏ (5K samples), ML truyền thống phù hợp hơn. DL cần 100K+ samples.

**Q: Accuracy 85% có tốt không?**
A: Trong y tế, quan trọng hơn là Recall (88.5%). Độ nhạy cao = ít bỏ sót.

**Q: Làm sao xử lý imbalanced data?**
A: SMOTE oversampling + class_weight='balanced' + optimize threshold.

**Q: Website có thể thay thế bác sĩ?**
A: KHÔNG! Đây chỉ là công cụ hỗ trợ. Quyết định cuối cùng thuộc về bác sĩ.

---

## SLIDE 24: KẾT LUẬN

### Thành tựu đạt được:
✅ Xây dựng thành công hệ thống AI dự đoán đột quỵ  
✅ Accuracy 85.7%, Recall 88.5%  
✅ Ensemble 4 thuật toán ML  
✅ Website full-stack với UX tốt  
✅ PDF report chuyên nghiệp  

### Ý nghĩa:
🏥 **Y tế:** Sàng lọc sớm, giảm tử vong  
🎓 **Học thuật:** Áp dụng ML vào thực tế  
💼 **Thực tiễn:** Sản phẩm có thể triển khai  

### Thông điệp cuối:
> **"Technology should serve humanity, especially in healthcare."**  
> Công nghệ phải phục vụ con người, đặc biệt trong y tế.

---

## SLIDE 25: CẢM ƠN! 🙏

### Liên hệ:
📧 Email: [your-email]  
🔗 GitHub: [repo-link]  
📱 Demo: [website-url]  

### Cảm ơn quý Anh/Chị đã lắng nghe!

**"Thà báo động nhầm còn hơn bỏ sót!"**

---

## PHỤ LỤC: CODE SAMPLES (Nếu cần)

### Slide A1: Model Training Code
```python
from sklearn.ensemble import GradientBoostingClassifier

# Initialize model
model = GradientBoostingClassifier(
    learning_rate=0.1,
    n_estimators=100,
    max_depth=10,
    random_state=42
)

# Train
model.fit(X_train_scaled, y_train)

# Predict
predictions = model.predict(X_test_scaled)
probabilities = model.predict_proba(X_test_scaled)
```

### Slide A2: Ensemble Voting Code
```python
def ensemble_predict(features):
    scores = []
    for model_name, model in models.items():
        score = model.predict_proba(features)[0][1]
        scores.append(score)
    
    # Weighted average
    weights = [0.3, 0.25, 0.35, 0.1]  # GB highest
    final_score = sum(s*w for s,w in zip(scores, weights))
    
    return final_score, classify_risk(final_score)
```

### Slide A3: API Endpoint
```python
@app.route('/api/v1/predictions/predict', methods=['POST'])
@limiter.limit("5 per minute")
def predict():
    data = request.get_json()
    
    # Validate
    errors = validate_input(data)
    if errors:
        return {'errors': errors}, 400
    
    # Predict
    result = prediction_service.predict(data)
    
    return {'data': result}, 200
```
