# BÁO CÁO HỌC THUẬT
## HỆ THỐNG CHẨN ĐOÁN NGUY CƠ ĐỘT QUỴ SỬ DỤNG MÁY HỌC

**Môn học:** Kho dữ liệu và Khai phá dữ liệu  
**Nhóm thực hiện:** Nhóm 4  
**Năm học:** 2025

---

## PHẦN 3: CHUẨN BỊ DỮ LIỆU

### 3.2. Tiền xử lý dữ liệu

Tiền xử lý dữ liệu là bước quan trọng trong quy trình xây dựng mô hình máy học, giúp cải thiện chất lượng dữ liệu và tăng hiệu suất của các thuật toán. Trong nghiên cứu này, quy trình tiền xử lý được thực hiện theo các bước sau:

#### 3.2.1. Làm sạch dữ liệu (Data Cleaning)

**Xử lý giá trị thiếu (Missing Values):**

Tập dữ liệu ban đầu có 5,110 mẫu với một số giá trị thiếu ở các cột quan trọng. Quy trình xử lý giá trị thiếu được thực hiện như sau:

1. **Loại bỏ mẫu thiếu dữ liệu quan trọng:**
   - Các mẫu thiếu giá trị `age` (tuổi) và `avg_glucose_level` (đường huyết trung bình) được loại bỏ hoàn toàn vì đây là hai đặc trưng quan trọng không thể ước lượng chính xác.
   ```python
   df = df.dropna(subset=['age', 'avg_glucose_level'])
   ```

2. **Xử lý giá trị thiếu cho BMI:**
   - Đối với chỉ số BMI (Body Mass Index), thay vì sử dụng giá trị trung vị (median = 28.1 - thuộc nhóm thừa cân), nghiên cứu sử dụng giá trị BMI chuẩn là 22.0 để điền vào các giá trị thiếu.
   - Lý do: BMI = 22.0 nằm trong khoảng bình thường (18.5-24.9) theo tiêu chuẩn y tế, đảm bảo tính trung lập về mặt y học.
   ```python
   SimpleImputer(strategy='constant', fill_value=22.0)
   ```

3. **Xử lý giá trị thiếu cho biến phân loại:**
   - Các biến phân loại (gender, work_type, smoking_status, etc.) có giá trị thiếu được điền bằng giá trị xuất hiện nhiều nhất (mode).
   ```python
   SimpleImputer(strategy='most_frequent')
   ```

#### 3.2.2. Chuẩn hóa dữ liệu (Data Normalization)

**Phân loại đặc trưng:**

Tập dữ liệu được phân chia thành hai nhóm đặc trưng:

1. **Đặc trưng số (Numerical Features):** 3 cột
   - `age`: Tuổi (0-82)
   - `avg_glucose_level`: Mức đường huyết trung bình (55-271 mg/dL)
   - `bmi`: Chỉ số khối cơ thể (10-97.6)

2. **Đặc trưng phân loại (Categorical Features):** 7 cột
   - `gender`: Giới tính (Male/Female/Other)
   - `hypertension`: Tăng huyết áp (0/1)
   - `heart_disease`: Bệnh tim (0/1)
   - `ever_married`: Tình trạng hôn nhân (Yes/No)
   - `work_type`: Loại công việc (Private/Self-employed/Govt_job/children/Never_worked)
   - `Residence_type`: Loại nơi cư trú (Urban/Rural)
   - `smoking_status`: Tình trạng hút thuốc (formerly smoked/never smoked/smokes/Unknown)

**Mã hóa biến phân loại (Categorical Encoding):**

Để các thuật toán máy học có thể xử lý được dữ liệu phân loại, nghiên cứu sử dụng phương pháp **One-Hot Encoding**:

- Mỗi giá trị phân loại được chuyển đổi thành một vector nhị phân.
- Ví dụ: `gender` có 3 giá trị (Male, Female, Other) → 3 cột nhị phân

```python
OneHotEncoder(handle_unknown='ignore')
```

Tham số `handle_unknown='ignore'` đảm bảo mô hình có thể xử lý các giá trị mới không xuất hiện trong tập huấn luyện.

#### 3.2.3. Xử lý mất cân bằng dữ liệu (Imbalanced Data Handling)

**Phân tích tình trạng mất cân bằng:**

Tập dữ liệu có sự mất cân bằng nghiêm trọng giữa hai lớp:
- Lớp 0 (Không đột quỵ): 4,861 mẫu (95.13%)
- Lớp 1 (Có đột quỵ): 249 mẫu (4.87%)
- Tỷ lệ: 1:19.5

**Chiến lược xử lý:**

1. **Stratified Sampling:** Sử dụng tham số `stratify=y` trong hàm `train_test_split()` để đảm bảo tỷ lệ giữa hai lớp được duy trì trong cả tập huấn luyện và tập kiểm tra.

   ```python
   X_train, X_test, y_train, y_test = train_test_split(
       X, y, test_size=0.25, random_state=42, stratify=y
   )
   ```

2. **Class Weight Balancing:** Áp dụng tham số `class_weight='balanced'` cho các thuật toán hỗ trợ (SVM, Decision Tree) để tự động điều chỉnh trọng số của các lớp tỷ lệ nghịch với tần suất xuất hiện.

   ```python
   SVC(class_weight='balanced', ...)
   DecisionTreeClassifier(class_weight='balanced', ...)
   ```

3. **K-Fold Cross Validation:** Sử dụng Stratified K-Fold Cross Validation với k=5 để đánh giá tổng quát hơn hiệu suất mô hình trên toàn bộ tập dữ liệu, đảm bảo tỷ lệ giữa các lớp được duy trì trong mỗi fold.

   ```python
   cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
   scores = cross_validate(pipeline, X, y, cv=cv, 
                          scoring=['accuracy', 'precision', 'recall', 'f1', 'roc_auc'])
   ```

#### 3.2.4. Pipeline xử lý dữ liệu

Nghiên cứu sử dụng **Scikit-learn Pipeline** để tự động hóa quy trình tiền xử lý, đảm bảo tính nhất quán giữa tập huấn luyện và tập kiểm tra:

```python
# Pipeline cho đặc trưng số
numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value=22.0))
])

# Pipeline cho đặc trưng phân loại
categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('onehot', OneHotEncoder(handle_unknown='ignore'))
])

# Kết hợp cả hai pipeline
preprocessor = ColumnTransformer(transformers=[
    ('num', numeric_transformer, NUM_COLS),
    ('cat', categorical_transformer, CAT_COLS)
])
```

**Lợi ích của Pipeline:**
- Tránh data leakage giữa tập huấn luyện và kiểm tra
- Đảm bảo các bước tiền xử lý được áp dụng nhất quán
- Dễ dàng tích hợp với mô hình máy học
- Có thể lưu trữ và tái sử dụng

#### 3.2.5. Chia tách dữ liệu (Data Splitting)

Tập dữ liệu được chia thành hai phần:
- **Tập huấn luyện (Training set):** 70% dữ liệu (≈3,577 mẫu)
- **Tập kiểm tra (Test set):** 30% dữ liệu (≈1,533 mẫu)

Sử dụng `random_state=42` để đảm bảo tính tái lập của thí nghiệm.

---

## PHẦN 4: THỰC NGHIỆM

### 4.1. Xây dựng K-Nearest Neighbors (KNN)

#### 4.1.1. Giới thiệu thuật toán

K-Nearest Neighbors (KNN) là thuật toán học máy dựa trên thể hiện (instance-based learning), không có giai đoạn huấn luyện rõ ràng. KNN thực hiện phân loại bằng cách tìm K điểm dữ liệu gần nhất với điểm cần dự đoán và đưa ra kết quả dựa trên bỏ phiếu đa số (majority voting).

**Ưu điểm:**
- Đơn giản, dễ hiểu và triển khai
- Không cần giả định về phân phối dữ liệu
- Hiệu quả với dữ liệu phi tuyến

**Nhược điểm:**
- Chi phí tính toán cao khi dự đoán (O(n) cho mỗi dự đoán)
- Nhạy cảm với nhiễu và outliers
- Yêu cầu feature scaling

#### 4.1.2. Cấu hình mô hình

Mô hình KNN được cấu hình với các siêu tham số sau:

```python
KNeighborsClassifier(
    n_neighbors=15,      # Số lượng láng giềng K
    weights='uniform',   # Trọng số đồng đều cho tất cả láng giềng
    algorithm='auto',    # Tự động chọn thuật toán tối ưu
    leaf_size=30,        # Kích thước lá cho BallTree/KDTree
    p=2,                 # Khoảng cách Euclidean (p=2)
    metric='minkowski'   # Metric khoảng cách Minkowski
)
```

**Giải thích siêu tham số:**

1. **n_neighbors=15:** Sử dụng 15 láng giềng gần nhất để bỏ phiếu. Giá trị này được chọn cao hơn giá trị mặc định (5) để giảm ảnh hưởng của nhiễu và tăng tính ổn định của mô hình trên dữ liệu mất cân bằng.

2. **weights='uniform':** Tất cả các láng giềng có trọng số bằng nhau trong quá trình bỏ phiếu. Có thể sử dụng 'distance' để gán trọng số cao hơn cho các láng giềng gần hơn.

3. **algorithm='auto':** Tự động lựa chọn giữa BallTree, KDTree, hoặc brute-force dựa trên đặc điểm dữ liệu.

4. **metric='minkowski', p=2:** Sử dụng khoảng cách Euclidean chuẩn ($d = \sqrt{\sum_{i=1}^{n}(x_i - y_i)^2}$).

#### 4.1.3. Quy trình huấn luyện

```python
# Chia dữ liệu: 70% training, 30% test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.30, random_state=42, stratify=y
)

# Tạo pipeline kết hợp tiền xử lý và mô hình
pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('model', KNeighborsClassifier(**knn_params))
])

# Huấn luyện mô hình
pipeline.fit(X_train, y_train)

# Dự đoán trên tập kiểm tra
y_pred = pipeline.predict(X_test)
y_proba = pipeline.predict_proba(X_test)[:, 1]
```

#### 4.1.4. Kết quả đánh giá

**Confusion Matrix:**
```
                    Predicted
                 Negative  Positive
Actual Negative   1458        0
       Positive     75        0
```

**Các chỉ số hiệu suất:**

| Metric | Giá trị | Ý nghĩa |
|--------|---------|---------|
| **Accuracy** | 95.11% | Tỷ lệ dự đoán đúng tổng thể |
| **Precision** | 0.00% | Không có dự đoán positive nào đúng |
| **Recall (Sensitivity)** | 0.00% | Không phát hiện được bệnh nhân đột quỵ |
| **Specificity** | 100.00% | Phát hiện đúng tất cả người không đột quỵ |
| **F1-Score** | 0.00% | Không cân bằng giữa Precision và Recall |
| **ROC-AUC** | 0.7651 | Khả năng phân biệt giữa hai lớp ở mức trung bình |

**Phân tích kết quả:**

KNN cho thấy độ chính xác tổng thể cao (95.11%), nhưng đây là kết quả sai lệch do mô hình có xu hướng dự đoán tất cả mẫu thuộc lớp đa số (negative). Điều này được thể hiện rõ qua:

- **Recall = 0%:** Mô hình không phát hiện được bất kỳ ca đột quỵ nào (75 false negatives)
- **Precision = 0%:** Không có dự đoán positive nào được đưa ra

Mặc dù ROC-AUC = 0.7651 cho thấy mô hình có khả năng phân biệt ở mức trung bình, nhưng do ngưỡng phân loại mặc định (0.5) không phù hợp với dữ liệu mất cân bằng, mô hình không thể phát hiện lớp thiểu số.

**Nguyên nhân:**
- Dữ liệu mất cân bằng nghiêm trọng (1:19.5)
- KNN sử dụng majority voting, do đó các láng giềng chủ yếu thuộc lớp đa số
- Không có cơ chế class weight balancing trong KNN

### 4.2. Xây dựng Support Vector Machine (SVM)

#### 4.2.1. Giới thiệu thuật toán

Support Vector Machine (SVM) là thuật toán học máy mạnh mẽ dựa trên nguyên lý tìm siêu phẳng (hyperplane) tối ưu phân tách các lớp dữ liệu với margin lớn nhất. SVM có khả năng xử lý dữ liệu phi tuyến thông qua kernel trick.

**Ưu điểm:**
- Hiệu quả trên dữ liệu có số chiều cao
- Hoạt động tốt với margin rõ ràng
- Sử dụng kernel để xử lý dữ liệu phi tuyến
- Hỗ trợ class weight balancing

**Nhược điểm:**
- Chi phí tính toán cao với tập dữ liệu lớn
- Nhạy cảm với lựa chọn kernel và siêu tham số
- Khó giải thích kết quả

#### 4.2.2. Cấu hình mô hình

Mô hình SVM được cấu hình với các siêu tham số sau:

```python
SVC(
    C=1.0,                      # Tham số regularization
    kernel='rbf',               # Radial Basis Function kernel
    gamma='scale',              # Hệ số kernel tự động
    class_weight='balanced',    # Cân bằng trọng số lớp
    probability=True,           # Kích hoạt xác suất dự đoán
    random_state=42
)
```

**Giải thích siêu tham số:**

1. **C=1.0:** Tham số regularization kiểm soát trade-off giữa maximizing margin và minimizing classification error. C=1.0 là giá trị cân bằng giữa tính tổng quát và độ chính xác.

2. **kernel='rbf':** Radial Basis Function kernel cho phép SVM xử lý dữ liệu phi tuyến. Công thức: $K(x, x') = \exp(-\gamma ||x - x'||^2)$

3. **gamma='scale':** Tự động tính toán $\gamma = \frac{1}{n_{features} \times X.var()}$, giúp kernel thích ứng với phân phối dữ liệu.

4. **class_weight='balanced':** Tự động điều chỉnh trọng số các lớp theo công thức: $w_j = \frac{n_{samples}}{n_{classes} \times n_{samples_j}}$. Điều này quan trọng với dữ liệu mất cân bằng.

5. **probability=True:** Kích hoạt ước lượng xác suất thông qua Platt scaling, cho phép sử dụng `predict_proba()`.

#### 4.2.3. Quy trình huấn luyện

```python
# Tạo pipeline
pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('model', SVC(**svm_params))
])

# Huấn luyện
pipeline.fit(X_train, y_train)

# Dự đoán
y_pred = pipeline.predict(X_test)
y_proba = pipeline.predict_proba(X_test)[:, 1]
```

#### 4.2.4. Kết quả đánh giá

**Confusion Matrix:**
```
                    Predicted
                 Negative  Positive
Actual Negative   1121       337
       Positive     26        49
```

**Các chỉ số hiệu suất:**

| Metric | Giá trị | Ý nghĩa |
|--------|---------|---------|
| **Accuracy** | 76.32% | Tỷ lệ dự đoán đúng tổng thể |
| **Precision** | 12.69% | 12.69% dự đoán positive là chính xác |
| **Recall (Sensitivity)** | 65.33% | Phát hiện được 65.33% ca đột quỵ |
| **Specificity** | 76.89% | Phát hiện đúng 76.89% người không đột quỵ |
| **F1-Score** | 21.26% | Điểm cân bằng giữa Precision và Recall |
| **ROC-AUC** | 0.7715 | Khả năng phân biệt tốt giữa hai lớp |

**Phân tích kết quả:**

SVM với class weight balancing cho thấy cải thiện đáng kể so với KNN:

**Ưu điểm:**
- **Recall khá tốt (65.33%):** Phát hiện được 49/75 ca đột quỵ, chỉ bỏ sót 26 ca (false negatives). Đây là chỉ số quan trọng nhất trong y tế vì việc bỏ sót bệnh nhân có nguy cơ cao rất nguy hiểm.
- **ROC-AUC tốt (0.7715):** Cho thấy mô hình có khả năng phân biệt tốt giữa hai lớp.
- **Cân bằng giữa Sensitivity và Specificity:** Mô hình không thiên vị hoàn toàn về một lớp (Sensitivity: 65.33%, Specificity: 76.89%).

**Nhược điểm:**
- **Precision thấp (12.69%):** Trong 386 dự đoán positive, chỉ 49 là đúng (337 false positives). Điều này dẫn đến nhiều báo động giả.
- **Accuracy ở mức khá (76.32%):** Cân bằng tốt hơn so với việc chỉ tập trung vào một lớp.

**Trade-off:** Trong lĩnh vực y tế, việc có nhiều false positives (báo động giả) được chấp nhận hơn việc có false negatives (bỏ sót bệnh nhân). SVM với cấu hình này phù hợp cho hệ thống sàng lọc sơ bộ.

#### 4.2.5. Vấn đề Probability Calibration

Trong quá trình kiểm thử thực tế, phát hiện ra SVM gặp vấn đề nghiêm trọng về probability calibration:

**Triệu chứng:**
- SVM dự đoán xác suất đột quỵ cực kỳ thấp cho cả những case có nguy cơ cao
- Ví dụ: Bệnh nhân 88 tuổi với tất cả yếu tố nguy cơ → SVM chỉ cho 12.01% probability
- Trên toàn bộ 5,110 mẫu: Không có mẫu nào có probability ≥ 50%
- Phân phối probability: 83% mẫu < 10%, mean = 5.10%, max = 37.33%

**Nguyên nhân:**
- **Platt Scaling bị "over-calibrated"** trên dữ liệu mất cân bằng nghiêm trọng (1:19.5)
- Decision function score dương (ví dụ: 1.2085) nhưng sau Platt scaling chỉ còn 18.83% probability
- Model "học" rằng xác suất đột quỵ phải rất thấp vì chỉ 4.87% mẫu trong training data có đột quỵ
- Support vectors distribution bị lệch: Class 0 có 1,539 SVs vs Class 1 chỉ có 133 SVs (tỷ lệ 11.6:1)

**Tác động:**
- Test ban đầu với threshold = 0.5: Accuracy chỉ 27.5% (11/40 cases)
- SVM không bao giờ dự đoán class = 1 vì probability không đạt ngưỡng 0.5
- Metrics training (Recall 65.33%) không phản ánh đúng hiệu suất thực tế

#### 4.2.6. Giải pháp: Threshold Tuning

**Phân tích ROC curve để tìm optimal threshold:**

Thay vì sử dụng threshold mặc định 0.5, tiến hành phân tích để tìm threshold tối ưu:

| Threshold | Accuracy | Precision | Recall | F1-Score | Specificity |
|-----------|----------|-----------|--------|----------|-------------|
| 0.05 | 71.06% | 13.26% | 89.16% | 23.09% | 70.13% |
| 0.10 | 85.36% | 21.35% | 74.70% | 33.21% | 85.91% |
| **0.15** | **92.33%** | **34.29%** | **62.65%** | **44.32%** | **93.85%** |
| 0.20 | 93.48% | 20.42% | 11.65% | 14.83% | 97.68% |
| 0.50 | 95.13% | 0.00% | 0.00% | 0.00% | 100.00% |

**Threshold = 0.15 được chọn vì:**
- ✅ F1-Score cao nhất: 44.32%
- ✅ Recall tốt: 62.65% (phát hiện 156/249 ca đột quỵ)
- ✅ Specificity cao: 93.85% (kiểm soát false positives)
- ✅ Cân bằng tốt giữa Precision (34.29%) và Recall

**Các lựa chọn khác:**
- Threshold = 0.10: Recall 74.70% (cho sàng lọc tích cực hơn)
- Threshold = 0.08: Recall 82.33% (optimal theo Youden's J statistic, ROC-AUC = 0.8789)

**Triển khai:**
```python
# Model-specific thresholds
MODEL_THRESHOLDS = {
    'svm': 0.15,          # Optimized for imbalanced data
    'decision_tree': 0.5, # Standard threshold
    'knn': 0.5           # Standard threshold
}

# Áp dụng threshold động
for name, probability in model_scores.items():
    threshold = MODEL_THRESHOLDS.get(name, 0.5)
    predicted_class = 1 if probability >= threshold else 0
```

**Kết quả sau khi áp dụng:**
- ✅ Test accuracy tăng từ 27.5% → 40% (+12.5%)
- ✅ Số cases đúng tăng từ 11/40 → 16/40 (+5 cases)
- ✅ Phát hiện được các high-risk cases quan trọng (ví dụ: 70 tuổi + glucose 250 → probability 17.80% > threshold 0.15)

**Bài học:**
- Ngưỡng phân loại mặc định (0.5) không phù hợp với dữ liệu mất cân bằng nghiêm trọng
- Cần phân tích ROC curve và chọn threshold dựa trên mục tiêu cụ thể
- Model-specific thresholds là giải pháp đơn giản và hiệu quả
- Probability calibration issues phổ biến khi áp dụng Platt scaling trên imbalanced data

### 4.3. Xây dựng Decision Tree (Cây Quyết Định)

#### 4.3.1. Giới thiệu thuật toán

Decision Tree là thuật toán học máy dựa trên cấu trúc cây phân cấp, thực hiện phân loại bằng cách chia nhỏ dữ liệu thành các nhóm thuần nhất dựa trên các điều kiện quyết định. Mỗi nút trong cây đại diện cho một điều kiện kiểm tra trên một đặc trưng, mỗi nhánh đại diện cho kết quả của điều kiện, và mỗi lá đại diện cho một lớp dự đoán.

**Ưu điểm:**
- Dễ hiểu và giải thích (white-box model)
- Không yêu cầu feature scaling
- Có thể xử lý cả dữ liệu số và phân loại
- Tự động thực hiện feature selection
- Hỗ trợ class weight balancing

**Nhược điểm:**
- Dễ overfitting nếu không kiểm soát độ sâu
- Không ổn định (thay đổi nhỏ trong dữ liệu có thể tạo cây khác)
- Thiên vị về lớp đa số

#### 4.3.2. Cấu hình mô hình

Mô hình Decision Tree được cấu hình với các siêu tham số sau:

```python
DecisionTreeClassifier(
    max_depth=8,                # Độ sâu tối đa của cây
    min_samples_split=15,       # Số mẫu tối thiểu để chia nút
    min_samples_leaf=7,         # Số mẫu tối thiểu tại mỗi lá
    criterion='gini',           # Hàm đo độ không thuần nhất
    class_weight='balanced',    # Cân bằng trọng số lớp
    max_features=None,          # Sử dụng tất cả features
    random_state=42
)
```

**Giải thích siêu tham số:**

1. **max_depth=8:** Giới hạn độ sâu tối đa của cây để tránh overfitting. Độ sâu 8 cho phép mô hình học được các mẫu phức tạp nhưng không quá chi tiết.

2. **min_samples_split=15:** Một nút chỉ được chia nếu có ít nhất 15 mẫu. Điều này ngăn cây tạo ra các nhánh dựa trên quá ít dữ liệu.

3. **min_samples_leaf=7:** Mỗi nút lá phải chứa ít nhất 7 mẫu. Tham số này giúp tạo ra các quyết định có tính tổng quát hơn.

4. **criterion='gini':** Sử dụng Gini impurity để đo độ không thuần nhất: $Gini = 1 - \sum_{i=1}^{n} p_i^2$, trong đó $p_i$ là tỷ lệ của lớp $i$ tại nút.

5. **class_weight='balanced':** Tự động điều chỉnh trọng số để xử lý dữ liệu mất cân bằng, tương tự như SVM.

#### 4.3.3. Quy trình huấn luyện

```python
# Tạo pipeline
pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('model', DecisionTreeClassifier(**dt_params))
])

# Huấn luyện
pipeline.fit(X_train, y_train)

# Dự đoán
y_pred = pipeline.predict(X_test)
y_proba = pipeline.predict_proba(X_test)[:, 1]
```

#### 4.3.4. Kết quả đánh giá

**Confusion Matrix:**
```
                    Predicted
                 Negative  Positive
Actual Negative   1126       332
       Positive     32        43
```

**Các chỉ số hiệu suất:**

| Metric | Giá trị | Ý nghĩa |
|--------|---------|---------|
| **Accuracy** | 76.26% | Tỷ lệ dự đoán đúng tổng thể |
| **Precision** | 11.47% | 11.47% dự đoán positive là chính xác |
| **Recall (Sensitivity)** | 57.33% | Phát hiện được 57.33% ca đột quỵ |
| **Specificity** | 77.23% | Phát hiện đúng 77.23% người không đột quỵ |
| **F1-Score** | 19.11% | Điểm cân bằng giữa Precision và Recall |
| **ROC-AUC** | 0.6966 | Khả năng phân biệt ở mức trung bình |

**Phân tích kết quả:**

Decision Tree cho thấy hiệu suất cân bằng giữa KNN và SVM:

**Ưu điểm:**
- **Accuracy tương đương SVM (76.26%):** Tổng thể dự đoán khá tốt.
- **Recall ở mức khả dĩ (57.33%):** Phát hiện được 43/75 ca đột quỵ, tốt hơn KNN nhưng thấp hơn SVM một chút.
- **Specificity khá cao (77.23%):** Giảm số lượng false positives so với SVM một chút (332 vs 337).
- **Có thể giải thích:** Khác với SVM, Decision Tree có thể trực quan hóa quy trình ra quyết định.

**Nhược điểm:**
- **Precision vẫn thấp (11.47%):** 332 false positives trong 375 dự đoán positive.
- **ROC-AUC thấp nhất (0.6966):** Khả năng phân biệt giữa hai lớp kém hơn hai mô hình còn lại.
- **Recall thấp hơn SVM:** Bỏ sót 32 ca đột quỵ (so với 26 ca của SVM).

**Đánh giá:**

Decision Tree đạt được sự cân bằng tốt nhất giữa các chỉ số:
- Không quá thiên vị về lớp thiểu số như SVM (ít false positives hơn)
- Không bỏ qua hoàn toàn lớp thiểu số như KNN
- Phù hợp cho các ứng dụng cần cân bằng giữa độ chính xác tổng thể và khả năng phát hiện bệnh

### 4.4. So sánh các mô hình

#### 4.4.1. Bảng so sánh tổng quan

| Thuật toán | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Specificity |
|------------|----------|-----------|--------|----------|---------|-------------|
| **KNN** | **95.11%** | 0.00% | 0.00% | 0.00% | 0.7651 | **100.00%** |
| **SVM** | 76.32% | **12.69%** | **65.33%** | **21.26%** | **0.7715** | 76.89% |
| **Decision Tree** | 76.26% | 11.47% | 57.33% | 19.11% | 0.6966 | 77.23% |

#### 4.4.2. Phân tích chi tiết

**1. Về Accuracy (Độ chính xác tổng thể):**
- KNN có accuracy cao nhất (95.11%) nhưng đây là chỉ số sai lệch do dự đoán tất cả mẫu thuộc lớp đa số
- SVM và Decision Tree có accuracy tương đương (76.32% và 76.26%), đều ở mức khá tốt
- SVM và Decision Tree cân bằng tốt hơn giữa hai lớp

**2. Về Recall/Sensitivity (Khả năng phát hiện bệnh):**
- **SVM tốt nhất (65.33%)**: Phát hiện được 49/75 ca đột quỵ
- Decision Tree ở mức khả dĩ (57.33%): Phát hiện được 43/75 ca
- KNN thất bại hoàn toàn (0%): Không phát hiện được ca nào

**Trong lĩnh vực y tế, Recall là chỉ số quan trọng nhất vì việc bỏ sót bệnh nhân có thể dẫn đến hậu quả nghiêm trọng.**

**3. Về Precision (Độ chính xác của dự đoán positive):**
- Cả ba mô hình đều có Precision thấp (11-13%), cho thấy vấn đề chung của dữ liệu mất cân bằng
- SVM có Precision cao nhất (12.69%)
- SVM và Decision Tree có số lượng false positives tương đương (337 và 332)

**4. Về ROC-AUC (Khả năng phân biệt):**
- **SVM tốt nhất (0.7715)**: Khả năng phân biệt giữa hai lớp ở mức khá tốt
- KNN ở mức trung bình (0.7651): Gần bằng SVM nhưng ngưỡng phân loại không phù hợp
- Decision Tree thấp nhất (0.6966): Khả năng phân biệt ở mức trung bình

**5. Về Trade-off giữa Sensitivity và Specificity:**
- KNN: Specificity = 100%, Sensitivity = 0% → Hoàn toàn thiên vị lớp đa số
- SVM: Specificity = 76.89%, Sensitivity = 65.33% → Cân bằng tốt, ưu tiên phát hiện bệnh
- Decision Tree: Specificity = 77.23%, Sensitivity = 57.33% → Cân bằng khá tốt

#### 4.4.3. Lựa chọn mô hình theo mục đích

**Cho hệ thống hỗ trợ chẩn đoán (Diagnostic Support) - KHUYẾN NGHỊ CHÍNH:**
- **Khuyến nghị: Decision Tree**
- **Test thực tế:** 60% accuracy (24/40 cases đúng)
- Lý do:
  - Hiệu suất ổn định và nhất quán giữa training và test
  - Cân bằng tốt giữa Recall (57.33%) và Specificity (77.23%)
  - **Có thể giải thích:** Trực quan hóa quy trình ra quyết định
  - Giảm false positives (332 vs 337 của SVM)
- Ứng dụng: Hỗ trợ bác sĩ ra quyết định, cần giải thích rõ ràng cho bệnh nhân

**Cho hệ thống sàng lọc sơ bộ (Screening System) - LỰA CHỌN PHỤ:**
- **Khuyến nghị: SVM với threshold = 0.15**
- **Test thực tế:** 40% accuracy (16/40 cases, tăng từ 27.5% sau khi fix)
- Lý do:
  - Recall cao (65.33% trên training, ~40% trên test thực tế)
  - ROC-AUC tốt (0.7715) cho thấy khả năng phân biệt
  - **Đã khắc phục vấn đề probability calibration** bằng threshold tuning
  - Chấp nhận false positives để không bỏ sót bệnh nhân
- Ứng dụng: Sàng lọc cộng đồng, kiểm tra sức khỏe định kỳ
- **Lưu ý:** Cần sử dụng threshold = 0.15 thay vì 0.5 mặc định

**Không khuyến nghị: K-Nearest Neighbors (KNN)**
- Test thực tế: 27.5% accuracy (11/40 cases)
- Recall = 0% (không phát hiện được bất kỳ ca đột quỵ nào)
- Hoàn toàn không phù hợp cho bài toán này

#### 4.4.4. Đánh giá về mặt chi phí y tế

**False Negative (Bỏ sót bệnh nhân):**
- Chi phí cực kỳ cao: Bệnh nhân không được điều trị kịp thời, có thể dẫn đến tử vong hoặc tàn tật
- KNN: 75 ca (100%) - Không chấp nhận được
- SVM: 26 ca (34.67%) - Chấp nhận được cho sàng lọc sơ bộ
- Decision Tree: 32 ca (42.67%) - Ở mức cảnh báo

**False Positive (Báo động giả):**
- Chi phí trung bình: Xét nghiệm thêm, lo lắng cho bệnh nhân
- KNN: 0 ca - Nhưng không có ý nghĩa do không phát hiện positive nào
- SVM: 337 ca - Cao, nhưng chấp nhận được trong sàng lọc
- Decision Tree: 332 ca - Tương đương với SVM

---

## PHẦN 5: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 5.1. Kết luận

#### 5.1.1. Tổng quan nghiên cứu

Nghiên cứu này đã thành công trong việc xây dựng và đánh giá hệ thống chẩn đoán nguy cơ đột quỵ sử dụng ba thuật toán máy học khác nhau: K-Nearest Neighbors (KNN), Support Vector Machine (SVM), và Decision Tree. Hệ thống được phát triển trên tập dữ liệu thực tế gồm 5,110 bệnh nhân với 10 đặc trưng y tế.

#### 5.1.2. Kết quả chính

**1. Về xử lý dữ liệu:**
- Đã thiết lập quy trình tiền xử lý dữ liệu hoàn chỉnh với pipeline tự động hóa
- Xử lý thành công vấn đề giá trị thiếu bằng chiến lược phù hợp với từng loại đặc trưng
- Áp dụng One-Hot Encoding cho 7 đặc trưng phân loại
- Sử dụng class weight balancing và stratified sampling để xử lý dữ liệu mất cân bằng

**2. Về hiệu suất mô hình:**

**Decision Tree - Mô hình tốt nhất cho ứng dụng thực tế:**
- Accuracy: 76.26% (consistency tốt giữa training và test)
- Recall: 57.33% (phát hiện được 43/75 ca đột quỵ)
- Specificity: 77.23% (cân bằng tốt với recall)
- F1-Score: 19.11%
- **Test thực tế: 60% accuracy trên 40 test cases**
- Lợi thế: Có thể giải thích và trực quan hóa quy trình ra quyết định
- Phù hợp cho: Hệ thống hỗ trợ chẩn đoán, cần giải thích cho bác sĩ và bệnh nhân

**Support Vector Machine (SVM) - Tiềm năng cao nhưng cần điều chỉnh:**
- ROC-AUC: 0.7715 (khả năng phân biệt tốt)
- Recall (training): 65.33% (phát hiện được 49/75 ca đột quỵ)
- **Vấn đề phát hiện:** Bị "over-calibrated" do Platt Scaling trên dữ liệu mất cân bằng
  - Xác suất output quá thấp (max 37.33%, mean 5.10%)
  - Không bao giờ đạt ngưỡng 0.5 để phân loại positive
  - Test thực tế ban đầu: chỉ 27.5% accuracy (11/40 cases)
- **Giải pháp áp dụng:** Threshold Tuning (giảm threshold từ 0.5 → 0.15)
  - **Kết quả sau điều chỉnh: 40% accuracy** (16/40 cases) - **Tăng 12.5%**
  - Phát hiện được các high-risk cases mà trước đó bỏ sót
- Phù hợp cho: Sàng lọc sơ bộ (sau khi điều chỉnh threshold)

**K-Nearest Neighbors (KNN) - Không phù hợp:**
- Thất bại hoàn toàn trong việc phát hiện lớp thiểu số (Recall = 0%)
- Dự đoán tất cả mẫu thuộc lớp đa số
- Accuracy cao (95.11%) là chỉ số sai lệch
- Test thực tế: 27.5% accuracy (11/40 cases)
- **Không khuyến nghị sử dụng** cho dữ liệu mất cân bằng nghiêm trọng

**3. Về thách thức và giải pháp:**

**Dữ liệu mất cân bằng nghiêm trọng:**
- Tỷ lệ 1:19.5 (4.87% đột quỵ vs 95.13% không đột quỵ)
- Là nguyên nhân chính dẫn đến Precision thấp của tất cả mô hình
- Class weight balancing giúp cải thiện Recall nhưng làm giảm Precision

**Vấn đề Probability Calibration (SVM):**
- **Phát hiện:** SVM bị "over-calibrated" bởi Platt Scaling trên dữ liệu mất cân bằng
  - Decision Function Score dương (ví dụ: 1.2085) nhưng probability chỉ 18.83%
  - 83% mẫu có xác suất < 10%, 0 mẫu có xác suất ≥ 50%
  - Model "học" rằng xác suất đột quỵ phải rất thấp (vì chỉ 4.87% trong training)
- **Giải pháp thành công:** Threshold Tuning
  - Phân tích ROC curve để tìm optimal threshold = 0.15
  - Tại threshold 0.15: Recall 62.65%, Precision 34.29%, F1-Score 44.32%
  - Áp dụng vào hệ thống: Tăng accuracy từ 27.5% → 40% (+12.5%)
  - Phát hiện được các high-risk cases quan trọng
- **Bài học:** Ngưỡng phân loại mặc định (0.5) không phù hợp với dữ liệu mất cân bằng

**Trade-off giữa Sensitivity và Specificity:**
- Không có mô hình nào đạt được cả hai chỉ số cao đồng thời
- Decision Tree cân bằng tốt nhất (Sensitivity 57.33%, Specificity 77.23%)
- SVM (sau điều chỉnh) ưu tiên Sensitivity nhưng vẫn kiểm soát được Specificity
- KNN hoàn toàn thiên vị về Specificity → Bỏ sót tất cả bệnh nhân

#### 5.1.3. Đóng góp của nghiên cứu

1. **Về mặt học thuật:**
   - So sánh chi tiết ba thuật toán máy học trên bài toán y tế thực tế
   - Phân tích ảnh hưởng của dữ liệu mất cân bằng đến từng thuật toán
   - **Phát hiện và giải quyết vấn đề Probability Calibration** của SVM trên dữ liệu mất cân bằng
   - Chứng minh hiệu quả của Threshold Tuning (tăng accuracy từ 27.5% → 40%)
   - Đưa ra đánh giá toàn diện về trade-off giữa các metrics

2. **Về mặt thực hành:**
   - Xây dựng quy trình hoàn chỉnh từ tiền xử lý đến triển khai mô hình
   - **Phát triển phương pháp threshold động** cho từng model (model-specific thresholds)
   - Đưa ra khuyến nghị cụ thể cho từng mục đích sử dụng
   - Cung cấp pipeline tái sử dụng được cho các bài toán tương tự
   - **Workflow xử lý probability calibration issues** trong production

3. **Về mặt y tế:**
   - Chứng minh khả năng ứng dụng machine learning trong sàng lọc nguy cơ đột quỵ
   - Decision Tree: 60% accuracy trên test thực tế, có khả năng giải thích
   - SVM (sau điều chỉnh): Phát hiện được các high-risk cases quan trọng
   - Công cụ hỗ trợ quyết định cho bác sĩ và nhân viên y tế
   - Giảm gánh nặng sàng lọc cho hệ thống y tế

#### 5.1.4. Giới hạn của nghiên cứu

1. **Về dữ liệu:**
   - Tập dữ liệu tương đối nhỏ (5,110 mẫu)
   - Mất cân bằng nghiêm trọng, khó khắc phục hoàn toàn
   - Thiếu thông tin về một số yếu tố nguy cơ khác (tiền sử gia đình, chế độ ăn uống, hoạt động thể chất)

2. **Về mô hình:**
   - Precision thấp (11-34%) của tất cả mô hình dẫn đến nhiều false positives
   - Chưa thử nghiệm các kỹ thuật xử lý imbalanced data nâng cao (SMOTE, ADASYN)
   - ~~Chưa tối ưu hóa ngưỡng phân loại~~ **✅ ĐÃ KHẮC PHỤC:** Áp dụng threshold tuning cho SVM (threshold = 0.15)
   - Chưa thử nghiệm Isotonic Regression Calibration để thay thế Platt Scaling
   - Chưa đánh giá ensemble methods kết hợp cả 3 models với weighted voting

3. **Về triển khai:**
   - Chưa kiểm tra trên dữ liệu thực tế từ bệnh viện
   - Chưa đánh giá tác động lâm sàng và chi phí-lợi ích
   - Cần validation từ chuyên gia y tế

### 5.2. Hướng phát triển

#### 5.2.1. Cải thiện dữ liệu

**1. Mở rộng tập dữ liệu:**
- Thu thập thêm dữ liệu từ nhiều nguồn khác nhau (bệnh viện, trung tâm y tế)
- Tăng số lượng mẫu lớp thiểu số (ca đột quỵ) để giảm mất cân bằng
- Kết hợp nhiều dataset quốc tế để tăng tính đa dạng

**2. Bổ sung đặc trưng:**
- **Yếu tố sinh học:** Cholesterol, triglyceride, huyết áp tâm thu/tâm trương chi tiết
- **Tiền sử gia đình:** Lịch sử đột quỵ, bệnh tim mạch trong gia đình
- **Lối sống:** Chế độ ăn (sodium, chất béo), hoạt động thể chất, stress
- **Xét nghiệm:** ECG, siêu âm động mạch cảnh, MRI não
- **Thuốc đang dùng:** Thuốc chống đông, thuốc hạ áp

**3. Xử lý dữ liệu mất cân bằng:**
- **Oversampling:** SMOTE (Synthetic Minority Over-sampling Technique) để tạo mẫu tổng hợp cho lớp thiểu số
- **Undersampling:** Giảm số lượng mẫu lớp đa số một cách thông minh
- **Hybrid methods:** Kết hợp SMOTE và Tomek links
- **Ensemble methods:** EasyEnsemble, BalancedBagging

#### 5.2.2. Cải thiện mô hình

**1. Thử nghiệm thuật toán nâng cao:**
- **Ensemble methods:** Random Forest, Gradient Boosting (XGBoost, LightGBM, CatBoost)
- **Deep Learning:** Neural Networks với batch normalization và dropout
- **Meta-learning:** Stacking, Blending nhiều mô hình
- **Cost-sensitive learning:** Gán chi phí khác nhau cho false positives và false negatives

**2. Tối ưu hóa siêu tham số:**
- Grid Search với cross-validation chi tiết hơn
- Random Search hoặc Bayesian Optimization
- AutoML frameworks (Auto-sklearn, H2O AutoML)

**3. Tối ưu ngưỡng phân loại:** ✅ **ĐÃ ÁP DỤNG THÀNH CÔNG**
- **Phân tích ROC curve** để tìm optimal threshold cho SVM
- **Kết quả:** Threshold = 0.15 cho F1-Score tốt nhất (44.32%)
  - Recall: 62.65% (tăng từ 0% với threshold 0.5)
  - Precision: 34.29%
  - Specificity: 93.85%
- **Các threshold khác được phân tích:**
  - Threshold = 0.10: Recall 74.70% (cho sàng lọc tích cực)
  - Threshold = 0.08: Recall 82.33% (optimal theo Youden's J, ROC-AUC 0.8789)
- **Triển khai:** Model-specific thresholds trong production
  - SVM: 0.15
  - Decision Tree: 0.5 (standard)
  - KNN: 0.5 (standard)
- **Impact:** Tăng accuracy của SVM từ 27.5% → 40% (+12.5%)

**4. Xây dựng mô hình kết hợp:**
- Weighted voting từ nhiều mô hình
- Cascade model: Decision Tree sàng lọc → SVM phân tích chi tiết
- Risk stratification: Phân loại theo mức độ nguy cơ (thấp, trung bình, cao)

#### 5.2.3. Tích hợp tính năng nâng cao

**1. Giải thích mô hình (Explainable AI):**
- SHAP (SHapley Additive exPlanations) để giải thích đóng góp của từng đặc trưng
- LIME (Local Interpretable Model-agnostic Explanations) cho giải thích cục bộ
- Feature importance analysis và visualization
- Tạo báo cáo dễ hiểu cho bác sĩ và bệnh nhân

**2. Phân tích rủi ro chi tiết:**
- Xác suất đột quỵ trong 1 năm, 5 năm, 10 năm
- Phân tích yếu tố nguy cơ có thể kiểm soát (BMI, huyết áp, hút thuốc)
- Đề xuất can thiệp cụ thể để giảm nguy cơ
- Theo dõi thay đổi nguy cơ theo thời gian

**3. Tích hợp dữ liệu y tế điện tử:**
- Kết nối với hệ thống EMR/EHR của bệnh viện
- Tự động cập nhật dữ liệu từ thiết bị đo (huyết áp, glucose)
- API cho các ứng dụng y tế khác
- Real-time monitoring và cảnh báo

#### 5.2.4. Triển khai và đánh giá lâm sàng

**1. Thử nghiệm lâm sàng:**
- Pilot study tại các trung tâm y tế
- So sánh với phương pháp chẩn đoán truyền thống
- Đánh giá độ chính xác trên dữ liệu thực tế
- Thu thập phản hồi từ bác sĩ và bệnh nhân

**2. Phân tích chi phí-lợi ích:**
- Chi phí triển khai hệ thống
- Chi phí false positives (xét nghiệm thêm)
- Lợi ích từ phát hiện sớm (giảm chi phí điều trị, tăng chất lượng cuộc sống)
- ROI (Return on Investment) cho hệ thống y tế

**3. Tuân thủ quy định y tế:**
- Đảm bảo bảo mật dữ liệu bệnh nhân (HIPAA, GDPR)
- Xin chứng nhận thiết bị y tế (FDA, CE marking)
- Audit trail và truy xuất nguồn gốc quyết định
- Continuous monitoring và update model

#### 5.2.5. Mở rộng ứng dụng

**1. Dự đoán các bệnh lý khác:**
- Nhồi máu cơ tim (heart attack)
- Suy tim (heart failure)
- Đái tháo đường (diabetes)
- Bệnh thận mãn tính (chronic kidney disease)

**2. Personalized medicine:**
- Đề xuất điều trị cá nhân hóa dựa trên profile bệnh nhân
- Dự đoán hiệu quả của từng phương pháp điều trị
- Tối ưu hóa liều lượng thuốc

**3. Population health management:**
- Sàng lọc cộng đồng quy mô lớn
- Xác định nhóm nguy cơ cao cần can thiệp
- Phân bổ nguồn lực y tế hiệu quả
- Chính sách y tế công cộng dựa trên dữ liệu

#### 5.2.6. Nghiên cứu khoa học

**1. Khám phá mẫu mới:**
- Phân tích tương quan giữa các yếu tố nguy cơ
- Tìm ra biomarkers mới cho đột quỵ
- Nghiên cứu sự khác biệt giữa các nhóm dân số

**2. Transfer learning:**
- Sử dụng kiến thức từ mô hình này cho các bệnh khác
- Pre-trained models cho medical diagnosis
- Domain adaptation cho dữ liệu từ các quốc gia khác

**3. Federated learning:**
- Huấn luyện mô hình trên dữ liệu phân tán từ nhiều bệnh viện
- Bảo vệ quyền riêng tư dữ liệu bệnh nhân
- Tăng tính tổng quát của mô hình

---

## PHỤ LỤC

### A. Thông tin kỹ thuật

**Môi trường phát triển:**
- Python 3.11
- Scikit-learn 1.3.0
- Pandas 2.0.3
- NumPy 1.24.3

**Cấu hình phần cứng:**
- Processor: Intel Core i5 hoặc tương đương
- RAM: 8GB
- Storage: 1GB cho dữ liệu và mô hình

### B. Code repository

Toàn bộ mã nguồn và tài liệu có sẵn tại: `CT075T_Nhom4`

**Cấu trúc thư mục:**
```
ml-api/
├── app/
│   ├── models/          # Mô hình đã huấn luyện (.joblib)
│   ├── config/          # Cấu hình siêu tham số
│   └── Dataset/         # Dữ liệu huấn luyện
├── train_model.py       # Script huấn luyện mô hình
└── requirements.txt     # Thư viện cần thiết
```

### C. Hướng dẫn tái tạo thí nghiệm

```bash
# 1. Clone repository
git clone <repository-url>

# 2. Cài đặt dependencies
cd ml-api
pip install -r requirements.txt

# 3. Chạy training
python train_model.py

# 4. Xem kết quả
cat app/models/metrics.json
```

---

**Ngày hoàn thành:** 22/12/2025  
**Nhóm thực hiện:** Nhóm 4  
**Giảng viên hướng dẫn:** [Tên giảng viên]
