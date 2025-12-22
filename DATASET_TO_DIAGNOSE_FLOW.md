# 🔬 LUỒNG HOẠT ĐỘNG: DATASET → MODEL → DIAGNOSE

## 📋 MỤC LỤC
1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Giai đoạn 1: Dataset (Dữ liệu)](#2-giai-đoạn-1-dataset-dữ-liệu)
3. [Giai đoạn 2: Training (Huấn luyện Model)](#3-giai-đoạn-2-training-huấn-luyện-model)
4. [Giai đoạn 3: Prediction (Chẩn đoán)](#4-giai-đoạn-3-prediction-chẩn-đoán)
5. [Feature Importance & Fallback Heuristic](#5-feature-importance--fallback-heuristic)
6. [Kết luận](#6-kết-luận)

---

## 1. TỔNG QUAN HỆ THỐNG

```mermaid
Dataset (CSV)
    ↓
[Tiền xử lý] → Làm sạch, chuẩn hóa
    ↓
[Training] → Huấn luyện 3 Models (KNN, SVM, Decision Tree)
    ↓
[Lưu Models] → Lưu thành .joblib files
    ↓
[API] → Load models vào bộ nhớ
    ↓
[User Input] → Nhập thông tin bệnh nhân
    ↓
[Prediction] → Chẩn đoán bằng 3 models
    ↓
[Result] → Trả về % nguy cơ đột quỵ
```

---

## 2. GIAI ĐOẠN 1: DATASET (Dữ liệu)

### 📁 File: `healthcare-dataset-stroke-data.csv`
- **Vị trí**: `ml-api/app/data/healthcare-dataset-stroke-data.csv`
- **Kích thước**: 5,110 bệnh nhân (dòng)
- **Cột (Features)**: 12 cột

### 🔢 CẤU TRÚC DỮ LIỆU

#### **A. Categorical Features (Đặc trưng phân loại)** - 7 cột
```
1. gender             → Nam/Nữ/Khác
2. hypertension       → Có tăng huyết áp? (0/1)
3. heart_disease      → Có bệnh tim? (0/1)
4. ever_married       → Đã kết hôn? (Yes/No)
5. work_type          → Nghề nghiệp (Private/Govt_job/Self-employed/children)
6. Residence_type     → Nơi cư trú (Urban/Rural)
7. smoking_status     → Hút thuốc? (formerly smoked/never smoked/smokes/Unknown)
```

#### **B. Numerical Features (Đặc trưng số)** - 3 cột
```
1. age                → Tuổi (0-82)
2. avg_glucose_level  → Đường huyết trung bình (55-271 mg/dL)
3. bmi                → Chỉ số BMI (10-97.6)
```

#### **C. Target Variable (Biến mục tiêu)** - 1 cột
```
stroke                → Đột quỵ? (0=Không, 1=Có)
```

### 📊 ĐẶC ĐIỂM DATASET

```python
# Phân bố mất cân bằng (Imbalanced)
- Stroke = 0 (Không đột quỵ): 4,861 mẫu (95.13%)
- Stroke = 1 (Có đột quỵ):      249 mẫu (4.87%)
- Tỷ lệ: 1:19.5

# Dữ liệu thiếu (Missing values)
- BMI: Một số giá trị "N/A" cần xử lý
- Các cột khác: Ít hoặc không thiếu
```

### 🎯 VÍ DỤ 1 DÒNG DỮ LIỆU
```csv
id,gender,age,hypertension,heart_disease,ever_married,work_type,Residence_type,avg_glucose_level,bmi,smoking_status,stroke
9046,Male,67,0,1,Yes,Private,Urban,228.69,36.6,formerly smoked,1
```

**Giải thích**: Nam 67 tuổi, không tăng huyết áp (0), có bệnh tim (1), đã kết hôn, làm việc tư nhân, sống ở thành thị, đường huyết 228.69, BMI 36.6, từng hút thuốc → **KẾT QUẢ: Có đột quỵ (1)**

---

## 3. GIAI ĐOẠN 2: TRAINING (Huấn luyện Model)

### 📜 File: `train_model.py`

### 🔄 QUY TRÌNH TRAINING (Chi tiết từng bước)

#### **BƯỚC 1: Load Dataset**
```python
df = pd.read_csv('app/Dataset/healthcare-dataset-stroke-data.csv')
df = df.dropna(subset=['age', 'avg_glucose_level'])  # Loại bỏ dòng thiếu age hoặc glucose
```
- Đọc file CSV vào DataFrame
- Xóa dòng thiếu dữ liệu quan trọng (age, glucose)

#### **BƯỚC 2: Chia Dataset**
```python
X = df[NUM_COLS + CAT_COLS]  # Features (10 cột đầu)
y = df['stroke']              # Target (cột cuối)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)
```
- **75% Training set**: 3,832 mẫu để huấn luyện
- **25% Test set**: 1,278 mẫu để đánh giá
- **stratify=y**: Giữ tỷ lệ cân bằng giữa 2 nhóm (stroke=0 và stroke=1)

#### **BƯỚC 3: Xây dựng Preprocessor (Tiền xử lý)**

##### **3A. Numerical Transformer (Xử lý số)**
```python
numeric_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='median'))  # Điền giá trị thiếu = median
])
```
- **Chức năng**: Điền các giá trị thiếu bằng giá trị trung vị (median)
- **Áp dụng cho**: age, avg_glucose_level, bmi

##### **3B. Categorical Transformer (Xử lý phân loại)**
```python
categorical_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='most_frequent')),  # Điền giá trị thiếu = mode
    ('onehot', OneHotEncoder(handle_unknown='ignore'))     # Chuyển thành số nhị phân
])
```
- **Chức năng 1**: Điền giá trị thiếu bằng giá trị phổ biến nhất
- **Chức năng 2**: OneHotEncoder chuyển category → binary vectors

**VÍ DỤ OneHotEncoder**:
```
gender = "Male" → [1, 0, 0]
gender = "Female" → [0, 1, 0]
gender = "Other" → [0, 0, 1]
```

##### **3C. Column Transformer (Kết hợp)**
```python
preprocessor = ColumnTransformer([
    ('num', numeric_transformer, ['age', 'avg_glucose_level', 'bmi']),
    ('cat', categorical_transformer, ['gender', 'hypertension', 'heart_disease', ...])
])
```
- **Kết quả**: Biến đổi 10 features gốc → ~30 features số (sau OneHotEncoding)

#### **BƯỚC 4: Load Hyperparameters từ Config**
```json
// model_config.json
{
  "knn": {
    "n_neighbors": 15,
    "weights": "uniform",
    "algorithm": "auto"
  },
  "svm": {
    "C": 1.0,
    "kernel": "rbf",
    "gamma": "scale",
    "class_weight": "balanced",
    "probability": true
  },
  "decision_tree": {
    "max_depth": 8,
    "min_samples_split": 15,
    "min_samples_leaf": 7,
    "criterion": "gini",
    "class_weight": "balanced"
  }
}
```
- **Tại sao dùng config?** Dễ thay đổi tham số mà không cần sửa code

#### **BƯỚC 5: Tạo 3 Models**
```python
algos = {
    'knn': KNeighborsClassifier(n_neighbors=15, weights='uniform'),
    'svm': SVC(C=1.0, kernel='rbf', probability=True, class_weight='balanced'),
    'decision_tree': DecisionTreeClassifier(max_depth=8, class_weight='balanced')
}
```

##### **Giải thích từng Model:**

| Model | Cách hoạt động | Tại sao chọn? |
|-------|----------------|---------------|
| **KNN** | Tìm 15 bệnh nhân gần nhất, xem đa số có đột quỵ không | Đơn giản, không cần giả định về phân phối dữ liệu |
| **SVM** | Tìm siêu phẳng tối ưu để chia 2 nhóm | Tốt với dữ liệu mất cân bằng (class_weight='balanced') |
| **Decision Tree** | Cây quyết định theo các điều kiện (if-else) | Dễ hiểu, giải thích được |

#### **BƯỚC 6: Training Loop (Vòng lặp huấn luyện)**
```python
for name, clf in algos.items():
    # Tạo Pipeline: Preprocessing → Model
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('model', clf)
    ])
    
    # Huấn luyện
    pipeline.fit(X_train, y_train)
    
    # Đánh giá
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]
    
    # Tính metrics
    accuracy = accuracy_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_proba)
    
    # Lưu model
    joblib.dump(pipeline, f'app/models/{name}.joblib')
```

**Giải thích chi tiết:**
1. **Pipeline**: Kết hợp preprocessing + model thành 1 đối tượng
2. **fit()**: Huấn luyện model từ X_train, y_train
3. **predict()**: Dự đoán nhãn (0/1) trên test set
4. **predict_proba()**: Dự đoán xác suất (0.0-1.0)
5. **joblib.dump()**: Lưu pipeline thành file `.joblib`

#### **BƯỚC 7: Lưu Metrics**
```python
# Lưu vào metrics.json
{
  "knn": {
    "roc_auc": 0.7080,
    "accuracy": 0.9453,
    "recall": 0.4999,
    "precision": 0.1765
  },
  "svm": {
    "roc_auc": 0.7780,
    "accuracy": 0.8617,
    "recall": 0.6968,
    "precision": 0.1275
  },
  "decision_tree": {
    "roc_auc": 0.7314,
    "accuracy": 0.9273,
    "recall": 0.6927,
    "precision": 0.1786
  }
}
```

### 🎯 KẾT QUẢ TRAINING
- **3 files được tạo**:
  - `app/models/knn.joblib`
  - `app/models/svm.joblib`
  - `app/models/decision_tree.joblib`
- **2 files metadata**:
  - `app/models/models.json` (danh sách models + thời gian training)
  - `app/models/metrics.json` (hiệu suất models)

---

## 4. GIAI ĐOẠN 3: PREDICTION (Chẩn đoán)

### 📜 File: `prediction_service.py`

### 🔄 QUY TRÌNH PREDICTION (Chi tiết từng bước)

#### **BƯỚC 1: Load Models vào bộ nhớ**
```python
class PredictionService:
    def __init__(self):
        self._models = {}
        # Load các file .joblib
        for file in glob.glob('app/models/*.joblib'):
            name = os.path.basename(file).replace('.joblib', '')
            self._models[name] = joblib.load(file)
        
        # Kết quả:
        # self._models = {
        #     'knn': <Pipeline object>,
        #     'svm': <Pipeline object>,
        #     'decision_tree': <Pipeline object>
        # }
```

#### **BƯỚC 2: User gửi thông tin bệnh nhân**
```json
// Request từ Frontend
{
  "age": 67,
  "gender": "Male",
  "hypertension": 0,
  "heartDisease": 1,
  "everMarried": "Yes",
  "workType": "Private",
  "residenceType": "Urban",
  "avgGlucoseLevel": 228.69,
  "bmi": 36.6,
  "smokingStatus": "formerly smoked"
}
```

#### **BƯỚC 3: Validate Input**
```python
errors = validate_input(data)
# Kiểm tra:
# - age: 0-120
# - glucose: 0-300
# - bmi: 10-100
# - gender: Male/Female/Other
# - ...
if errors:
    raise ValueError("Invalid input")
```

#### **BƯỚC 4: Adapt Payload (Chuyển đổi tên cột)**
```python
FEATURE_MAPPING = {
    'avgGlucoseLevel': 'avg_glucose_level',
    'heartDisease': 'heart_disease',
    'residenceType': 'Residence_type',
    'everMarried': 'ever_married',
    'workType': 'work_type',
    'smokingStatus': 'smoking_status',
}

adapted = self._adapt_payload(data)
# Kết quả:
# {
#     'age': 67,
#     'gender': 'Male',
#     'hypertension': 0,
#     'heart_disease': 1,           ← Đã đổi tên
#     'ever_married': 'Yes',        ← Đã đổi tên
#     'work_type': 'Private',       ← Đã đổi tên
#     'Residence_type': 'Urban',    ← Đã đổi tên
#     'avg_glucose_level': 228.69,  ← Đã đổi tên
#     'bmi': 36.6,
#     'smoking_status': 'formerly smoked'  ← Đã đổi tên
# }
```

#### **BƯỚC 5: Convert to DataFrame**
```python
def _to_dataframe(data):
    cols = ['age', 'avg_glucose_level', 'bmi', 'gender', 'hypertension',
            'heart_disease', 'ever_married', 'work_type', 'Residence_type', 'smoking_status']
    row = {c: data.get(c) for c in cols}
    return pd.DataFrame([row])

# Kết quả: DataFrame với 1 dòng, 10 cột
#    age  avg_glucose_level   bmi gender  hypertension  heart_disease  ...
# 0   67           228.69    36.6   Male            0              1  ...
```

#### **BƯỚC 6: Predict với từng Model**
```python
def _predict_with_models(data):
    results = {}
    input_df = self._to_dataframe(data)
    
    for name, model in self._models.items():
        # model.predict_proba(input_df) → [[prob_class_0, prob_class_1]]
        proba = model.predict_proba(input_df)[0, 1]  # Lấy xác suất class 1 (stroke)
        results[name] = float(proba)
    
    return results

# Kết quả:
# {
#     'knn': 0.267,
#     'svm': 0.723,
#     'decision_tree': 0.651
# }
```

**Giải thích `predict_proba()`:**
```python
# predict_proba() trả về: [[xác_suất_không_đột_quỵ, xác_suất_có_đột_quỵ]]
output = model.predict_proba(input_df)
# VD: [[0.277, 0.723]]
#       ↑       ↑
#   Class 0  Class 1 (stroke)

proba = output[0, 1]  # Lấy cột thứ 2 (class 1)
# → 0.723 (72.3% nguy cơ đột quỵ)
```

#### **BƯỚC 7: Chọn Score cuối cùng (Priority Logic)**
```python
score = None
if 'svm' in model_scores:
    score = model_scores['svm']           # Ưu tiên SVM (tốt nhất)
elif 'knn' in model_scores:
    score = model_scores['knn']            # Thứ 2: KNN
elif 'decision_tree' in model_scores:
    score = model_scores['decision_tree']  # Thứ 3: Decision Tree
else:
    # Trung bình tất cả models
    score = sum(model_scores.values()) / len(model_scores)
```

**VÍ DỤ**: Với `{'knn': 0.267, 'svm': 0.723, 'decision_tree': 0.651}`
→ **score = 0.723** (chọn SVM vì tốt nhất)

#### **BƯỚC 8: Fallback Heuristic (Nếu không có model)**
```python
if score is None:
    # Tính điểm thủ công dựa trên Feature Importance
    score = 0.0
    score += min(age / 120.0, 1.0) * 0.376         # 37.6% - Age
    score += min(glucose / 300.0, 1.0) * 0.20      # 20.0% - Glucose
    score += min(bmi / 50.0, 1.0) * 0.177          # 17.7% - BMI
    
    if ever_married == 'Yes':
        score += 0.039  # 3.9%
    
    if hypertension == 1:
        score += 0.034  # 3.4%
    
    if heart_disease == 1:
        score += 0.025  # 2.5%
    
    score = max(0.0, min(score, 1.0))  # Giới hạn 0.0-1.0
```

**VÍ DỤ Tính toán Fallback:**
```python
# Bệnh nhân: age=67, glucose=228.69, bmi=36.6, hypertension=0, heart_disease=1, ever_married=Yes
score = 0.0
score += min(67/120, 1.0) * 0.376     # = 0.558 * 0.376 = 0.210
score += min(228.69/300, 1.0) * 0.20  # = 0.762 * 0.20 = 0.152
score += min(36.6/50, 1.0) * 0.177    # = 0.732 * 0.177 = 0.130
score += 0.039                        # Ever married = Yes
score += 0.025                        # Heart disease = 1
# Total: 0.210 + 0.152 + 0.130 + 0.039 + 0.025 = 0.556 (55.6%)
```

#### **BƯỚC 9: Xác định Risk Level**
```python
def _risk_level(score):
    if score < 0.30:
        return 'low'
    elif score < 0.60:
        return 'medium'
    else:
        return 'high'
```

#### **BƯỚC 10: Trả về Response**
```json
{
  "strokeRisk": 0.723,
  "riskLevel": "high",
  "models": [
    {
      "name": "knn",
      "riskScore": 0.267,
      "riskLevel": "low"
    },
    {
      "name": "svm",
      "riskScore": 0.723,
      "riskLevel": "high"
    },
    {
      "name": "decision_tree",
      "riskScore": 0.651,
      "riskLevel": "high"
    }
  ],
  "recommendations": [
    "Giảm cân nếu BMI > 25",
    "Kiểm tra đường huyết định kỳ",
    "Khám tim mạch 3 tháng/lần"
  ]
}
```

---

## 5. FEATURE IMPORTANCE & FALLBACK HEURISTIC

### 📊 PHÂN TÍCH FEATURE IMPORTANCE
Từ quá trình training, ta biết được tầm quan trọng của từng feature:

| Rank | Feature | Importance | Giải thích |
|------|---------|------------|------------|
| 1 | **Age** | 37.6% | Tuổi càng cao, nguy cơ càng lớn |
| 2 | **Avg Glucose Level** | 20.0% | Đường huyết cao → nguy cơ cao |
| 3 | **BMI** | 17.7% | Béo phì → nguy cơ cao |
| 4 | **Ever Married** | 3.9% | Đã kết hôn có thể liên quan đến lối sống |
| 5 | **Hypertension** | 3.4% | Tăng huyết áp → nguy cơ cao |
| 6 | **Heart Disease** | ~2.5% | Bệnh tim → nguy cơ cao |
| 7-10 | Other | ~15% | Gender, work_type, smoking, residence |

### 🎯 TẠI SAO CẦN FALLBACK HEURISTIC?
- **Trường hợp 1**: Models bị lỗi hoặc không load được
- **Trường hợp 2**: Môi trường production không có scikit-learn
- **Trường hợp 3**: Cần dự đoán nhanh mà không cần load models (lightweight)

### 🧮 CÔNG THỨC FALLBACK
```python
Risk Score = (age/120) × 37.6%
           + (glucose/300) × 20.0%
           + (bmi/50) × 17.7%
           + ever_married × 3.9%
           + hypertension × 3.4%
           + heart_disease × 2.5%
```

**Giải thích normalization:**
- `age/120`: Chuẩn hóa tuổi về 0-1 (giả sử tuổi max = 120)
- `glucose/300`: Chuẩn hóa đường huyết về 0-1 (giả sử max = 300)
- `bmi/50`: Chuẩn hóa BMI về 0-1 (giả sử max = 50)

---

## 6. KẾT LUẬN

### 🎯 TÓM TẮT LUỒNG HOẠT ĐỘNG

```
1. DATASET (CSV file)
   ↓
2. LOAD & CLEAN (Đọc và làm sạch dữ liệu)
   ↓
3. SPLIT (Chia 75% train / 25% test)
   ↓
4. PREPROCESSING
   - Numerical: Impute với median
   - Categorical: Impute với mode → OneHotEncoding
   ↓
5. TRAINING
   - KNN: Tìm 15 láng giềng gần nhất
   - SVM: Tìm siêu phẳng tối ưu (RBF kernel)
   - Decision Tree: Xây dựng cây quyết định (max_depth=8)
   ↓
6. SAVE MODELS (Lưu .joblib files)
   ↓
7. LOAD MODELS (Khi API khởi động)
   ↓
8. USER INPUT (Frontend gửi thông tin bệnh nhân)
   ↓
9. VALIDATE (Kiểm tra input hợp lệ)
   ↓
10. ADAPT (Chuyển đổi tên cột)
   ↓
11. CONVERT TO DATAFRAME
   ↓
12. PREDICT với 3 models
   - predict_proba() → Xác suất 0.0-1.0
   ↓
13. PRIORITY LOGIC (Chọn SVM > KNN > Decision Tree)
   ↓
14. FALLBACK (Nếu không có model, dùng công thức thủ công)
   ↓
15. RISK LEVEL (low/medium/high)
   ↓
16. RECOMMENDATIONS (Đề xuất cho bệnh nhân)
   ↓
17. RETURN JSON (Trả về kết quả cho Frontend)
```

### 🔑 ĐIỂM QUAN TRỌNG CẦN NHỚ

1. **Pipeline = Preprocessing + Model**: Khi load .joblib, ta load cả 2 thứ
2. **predict_proba()**: Trả về xác suất (0.0-1.0), KHÔNG phải nhãn (0/1)
3. **Feature Importance**: Quyết định trọng số trong Fallback Heuristic
4. **class_weight='balanced'**: Xử lý dữ liệu mất cân bằng (1:19.5)
5. **Priority: SVM > KNN > DT**: Dựa trên ROC-AUC và Recall từ validation

### 📈 HIỆU SUẤT HỆ THỐNG (K-Fold Validation)

| Model | ROC-AUC | Recall | Precision | Đánh giá |
|-------|---------|--------|-----------|----------|
| **SVM** | 77.80% | 69.68% | 12.75% | ⭐ Tốt nhất - Ưu tiên sử dụng |
| **Decision Tree** | 73.14% | 69.27% | 17.86% | ⭐ Tốt - Dự phòng |
| **KNN** | 70.80% | 49.99% | 17.65% | ⚠️ Yếu nhất - Recall thấp |

**Kết luận**: SVM là model tốt nhất cho bài toán này!

### 🧪 VÍ DỤ ĐẦY ĐỦ

**Input**:
```json
{
  "age": 67,
  "gender": "Male",
  "hypertension": 0,
  "heartDisease": 1,
  "everMarried": "Yes",
  "workType": "Private",
  "residenceType": "Urban",
  "avgGlucoseLevel": 228.69,
  "bmi": 36.6,
  "smokingStatus": "formerly smoked"
}
```

**Processing**:
1. Validate ✅
2. Adapt field names ✅
3. Convert to DataFrame ✅
4. Predict:
   - KNN: 26.7%
   - **SVM: 72.3%** ← Chọn cái này
   - Decision Tree: 65.1%

**Output**:
```json
{
  "strokeRisk": 0.723,
  "riskLevel": "high",
  "models": [
    {"name": "knn", "riskScore": 0.267, "riskLevel": "low"},
    {"name": "svm", "riskScore": 0.723, "riskLevel": "high"},
    {"name": "decision_tree", "riskScore": 0.651, "riskLevel": "high"}
  ],
  "recommendations": [
    "Cần khám tim mạch gấp",
    "Giảm đường huyết xuống dưới 140 mg/dL",
    "Giảm cân (BMI hiện tại 36.6)"
  ]
}
```

---

## 📚 TÀI LIỆU THAM KHẢO

- **Dataset**: Kaggle - Healthcare Dataset Stroke Data
- **Libraries**: scikit-learn 1.x, pandas, numpy
- **Algorithms**: KNN, SVM (RBF), Decision Tree
- **Metrics**: ROC-AUC, Recall, Precision, F1-Score

---

**Tạo bởi**: CT075T_Nhóm 4  
**Ngày**: 22/12/2025  
**Phiên bản**: 1.0
