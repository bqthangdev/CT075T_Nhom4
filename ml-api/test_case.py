# -*- coding: utf-8 -*-
import sys
import io
import pandas as pd
from app.services.prediction_service import PredictionService

# Fix Windows console encoding for Vietnamese characters
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Model-specific thresholds (same as in prediction_service.py)
MODEL_THRESHOLDS = {
    'K-Nearest Neighbors (KNN)': 0.5,
    'Support Vector Machine (SVM)': 0.10,  # IMPROVED: Optimized threshold for new SVM with dual calibration
    'Decision Tree': 0.5,
}

# Danh sách 100 test cases - Phân bố cân bằng
# - 40 cases gốc (mixed distribution)
# - 20 cases HIGH risk (tuổi cao + nhiều yếu tố nguy cơ)
# - 20 cases MEDIUM risk (trung niên + 1-2 yếu tố)
# - 20 cases LOW risk (trẻ + ít yếu tố nguy cơ)
test_cases = [
    {
        'name': 'Case 1: Người cao tuổi - Nguy cơ RẤT CAO',
        'data': {
            'patientName': 'An', 'citizenId': '438590348905', 'age': 88,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 150.0, 'bmi': 29.0
        },
        'expected': 'HIGH'  # Nên có nguy cơ cao
    },
    {
        'name': 'Case 2: Người trẻ khỏe mạnh - Nguy cơ THẤP',
        'data': {
            'patientName': 'Binh', 'citizenId': '123456789012', 'age': 25,
            'gender': 'Male', 'everMarried': 'No', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 90.0, 'bmi': 22.5
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 3: Người 75 tuổi + Tiểu đường + Bệnh tim',
        'data': {
            'patientName': 'Cuong', 'citizenId': '234567890123', 'age': 75,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Rural', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 200.0, 'bmi': 28.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 4: Phụ nữ 65 tuổi + Tăng huyết áp',
        'data': {
            'patientName': 'Dao', 'citizenId': '345678901234', 'age': 65,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 120.0, 'bmi': 26.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 5: Tuổi 80 + Hút thuốc + Béo phì',
        'data': {
            'patientName': 'Em', 'citizenId': '456789012345', 'age': 80,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 160.0, 'bmi': 32.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 6: Tuổi 30 - Không yếu tố nguy cơ',
        'data': {
            'patientName': 'Giang', 'citizenId': '567890123456', 'age': 30,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 85.0, 'bmi': 21.0
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 7: Tuổi 70 + Tiểu đường nặng',
        'data': {
            'patientName': 'Hai', 'citizenId': '678901234567', 'age': 70,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Rural', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 250.0, 'bmi': 30.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 8: Tuổi 45 - Có tăng huyết áp',
        'data': {
            'patientName': 'Khanh', 'citizenId': '789012345678', 'age': 45,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 110.0, 'bmi': 25.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 9: Tuổi 55 + Bệnh tim',
        'data': {
            'patientName': 'Linh', 'citizenId': '890123456789', 'age': 55,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': True,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 130.0, 'bmi': 27.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 10: Tuổi 90 - Rất cao tuổi',
        'data': {
            'patientName': 'Minh', 'citizenId': '901234567890', 'age': 90,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Never_worked',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 140.0, 'bmi': 24.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 11: Tuổi 20 - Rất trẻ',
        'data': {
            'patientName': 'Nam', 'citizenId': '012345678901', 'age': 20,
            'gender': 'Male', 'everMarried': 'No', 'workType': 'children',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 80.0, 'bmi': 20.0
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 12: Tuổi 60 + Glucose cao',
        'data': {
            'patientName': 'Oanh', 'citizenId': '112233445566', 'age': 60,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 180.0, 'bmi': 23.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 13: Tuổi 50 + BMI cao (béo phì)',
        'data': {
            'patientName': 'Phong', 'citizenId': '223344556677', 'age': 50,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 100.0, 'bmi': 35.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 14: Tuổi 40 + Hút thuốc',
        'data': {
            'patientName': 'Quang', 'citizenId': '334455667788', 'age': 40,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 95.0, 'bmi': 24.0
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 15: Tuổi 68 + Tất cả yếu tố nguy cơ',
        'data': {
            'patientName': 'Sang', 'citizenId': '445566778899', 'age': 68,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 220.0, 'bmi': 33.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 16: Tuổi 35 + Chỉ tăng huyết áp',
        'data': {
            'patientName': 'Tam', 'citizenId': '556677889900', 'age': 35,
            'gender': 'Female', 'everMarried': 'No', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 90.0, 'bmi': 22.0
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 17: Tuổi 72 + Không yếu tố khác',
        'data': {
            'patientName': 'Uyen', 'citizenId': '667788990011', 'age': 72,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Never_worked',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 95.0, 'bmi': 23.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 18: Tuổi 58 + Glucose và BMI cao',
        'data': {
            'patientName': 'Van', 'citizenId': '778899001122', 'age': 58,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 170.0, 'bmi': 31.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 19: Tuổi 82 + Bệnh tim + Hút thuốc',
        'data': {
            'patientName': 'Xuan', 'citizenId': '889900112233', 'age': 82,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 135.0, 'bmi': 26.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 20: Tuổi 48 - Cân đối',
        'data': {
            'patientName': 'Yen', 'citizenId': '990011223344', 'age': 48,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 100.0, 'bmi': 23.5
        },
        'expected': 'LOW'    },
    # === THÊM 20 CASES MỚI ===
    {
        'name': 'Case 21: Tuổi 76 + Tất cả yếu tố HIGH',
        'data': {
            'patientName': 'Anh', 'citizenId': '100200300400', 'age': 76,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 240.0, 'bmi': 34.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 22: Tuổi 28 - Trẻ và khỏe',
        'data': {
            'patientName': 'Bao', 'citizenId': '200300400500', 'age': 28,
            'gender': 'Female', 'everMarried': 'No', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 88.0, 'bmi': 21.5
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 23: Tuổi 62 + Hypertension + Heart Disease',
        'data': {
            'patientName': 'Chi', 'citizenId': '300400500600', 'age': 62,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Rural', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 165.0, 'bmi': 29.5
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 24: Tuổi 52 + Glucose cực cao',
        'data': {
            'patientName': 'Dung', 'citizenId': '400500600700', 'age': 52,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 280.0, 'bmi': 26.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 25: Tuổi 85 - Rất cao tuổi + Hypertension',
        'data': {
            'patientName': 'Hoa', 'citizenId': '500600700800', 'age': 85,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Never_worked',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 125.0, 'bmi': 25.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 26: Tuổi 38 + Béo phì cực độ',
        'data': {
            'patientName': 'Kien', 'citizenId': '600700800900', 'age': 38,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 105.0, 'bmi': 40.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 27: Tuổi 22 - Sinh viên khỏe mạnh',
        'data': {
            'patientName': 'Lan', 'citizenId': '700800901000', 'age': 22,
            'gender': 'Female', 'everMarried': 'No', 'workType': 'children',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 82.0, 'bmi': 19.5
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 28: Tuổi 67 + Heart Disease + Smoking',
        'data': {
            'patientName': 'Manh', 'citizenId': '800901002000', 'age': 67,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 145.0, 'bmi': 28.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 29: Tuổi 44 + Hypertension only',
        'data': {
            'patientName': 'Nhi', 'citizenId': '901002003000', 'age': 44,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Rural', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 108.0, 'bmi': 24.5
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 30: Tuổi 79 + All risk factors',
        'data': {
            'patientName': 'Phat', 'citizenId': '102003004000', 'age': 79,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 215.0, 'bmi': 32.5
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 31: Tuổi 56 + Moderate glucose',
        'data': {
            'patientName': 'Quynh', 'citizenId': '203004005000', 'age': 56,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 155.0, 'bmi': 27.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 32: Tuổi 33 - Hoàn toàn khỏe mạnh',
        'data': {
            'patientName': 'Son', 'citizenId': '304005006000', 'age': 33,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 92.0, 'bmi': 23.0
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 33: Tuổi 71 + Hypertension + High glucose',
        'data': {
            'patientName': 'Thao', 'citizenId': '405006007000', 'age': 71,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Never_worked',
            'residenceType': 'Rural', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 195.0, 'bmi': 26.5
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 34: Tuổi 49 + Smoking + BMI cao',
        'data': {
            'patientName': 'Tuan', 'citizenId': '506007008000', 'age': 49,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 115.0, 'bmi': 33.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 35: Tuổi 26 - Trẻ nhưng hút thuốc',
        'data': {
            'patientName': 'Vy', 'citizenId': '607008009000', 'age': 26,
            'gender': 'Female', 'everMarried': 'No', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 87.0, 'bmi': 22.0
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 36: Tuổi 83 + Moderate conditions',
        'data': {
            'patientName': 'Huy', 'citizenId': '708009010000', 'age': 83,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 135.0, 'bmi': 27.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 37: Tuổi 54 + Heart Disease only',
        'data': {
            'patientName': 'Linh2', 'citizenId': '809010011000', 'age': 54,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': True,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 118.0, 'bmi': 25.5
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 38: Tuổi 41 + Multiple medium factors',
        'data': {
            'patientName': 'Minh2', 'citizenId': '910011012000', 'age': 41,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 145.0, 'bmi': 29.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 39: Tuổi 89 - Cực cao tuổi',
        'data': {
            'patientName': 'Nga', 'citizenId': '011012013000', 'age': 89,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Never_worked',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 148.0, 'bmi': 24.5
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 40: Tuổi 36 - Hoàn hảo',
        'data': {
            'patientName': 'Phuc', 'citizenId': '112013014000', 'age': 36,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 94.0, 'bmi': 23.5
        },
        'expected': 'LOW'
    },
    
    # === BỔ SUNG 60 TEST CASES MỚI - PHÂN BỐ CÂN BẰNG ===
    # === 20 CASES HIGH RISK ===
    {
        'name': 'Case 41: Tuổi 81 + Hypertension + Heart + Smoking + Glucose cao',
        'data': {
            'patientName': 'Quyen', 'citizenId': '213014015000', 'age': 81,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 230.0, 'bmi': 31.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 42: Tuổi 77 + Tất cả yếu tố nguy cơ + Béo phì',
        'data': {
            'patientName': 'Rong', 'citizenId': '314015016000', 'age': 77,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Rural', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 265.0, 'bmi': 36.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 43: Tuổi 86 + Hypertension + High glucose',
        'data': {
            'patientName': 'Suong', 'citizenId': '415016017000', 'age': 86,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Never_worked',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 205.0, 'bmi': 28.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 44: Tuổi 74 + Heart Disease + Smoking + BMI cao',
        'data': {
            'patientName': 'Thai', 'citizenId': '516017018000', 'age': 74,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 185.0, 'bmi': 33.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 45: Tuổi 92 - Cực cao tuổi + Hypertension',
        'data': {
            'patientName': 'Ut', 'citizenId': '617018019000', 'age': 92,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Never_worked',
            'residenceType': 'Rural', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 152.0, 'bmi': 26.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 46: Tuổi 69 + All critical factors',
        'data': {
            'patientName': 'Vinh', 'citizenId': '718019020000', 'age': 69,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 245.0, 'bmi': 35.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 47: Tuổi 84 + Glucose cực cao + Hypertension',
        'data': {
            'patientName': 'Xiem', 'citizenId': '819020021000', 'age': 84,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Never_worked',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 290.0, 'bmi': 29.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 48: Tuổi 73 + Heart + Smoking + High BMI',
        'data': {
            'patientName': 'Yen2', 'citizenId': '920021022000', 'age': 73,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 175.0, 'bmi': 34.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 49: Tuổi 78 + Multiple high risks',
        'data': {
            'patientName': 'Anh3', 'citizenId': '021022023000', 'age': 78,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 220.0, 'bmi': 32.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 50: Tuổi 87 + Hypertension + Heart Disease',
        'data': {
            'patientName': 'Binh3', 'citizenId': '122023024000', 'age': 87,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Never_worked',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 165.0, 'bmi': 27.5
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 51: Tuổi 66 + Glucose rất cao + Smoking',
        'data': {
            'patientName': 'Chau', 'citizenId': '223024025000', 'age': 66,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 270.0, 'bmi': 30.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 52: Tuổi 91 - Rất cao tuổi + Heart',
        'data': {
            'patientName': 'Diem', 'citizenId': '324025026000', 'age': 91,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Never_worked',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': True,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 158.0, 'bmi': 25.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 53: Tuổi 70 + All major factors',
        'data': {
            'patientName': 'En', 'citizenId': '425026027000', 'age': 70,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 235.0, 'bmi': 33.5
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 54: Tuổi 75 + Hypertension + High glucose + Obesity',
        'data': {
            'patientName': 'Giau', 'citizenId': '526027028000', 'age': 75,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Rural', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 210.0, 'bmi': 37.0
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 55: Tuổi 82 + Heart + Smoking + High glucose',
        'data': {
            'patientName': 'Hanh', 'citizenId': '627028029000', 'age': 82,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Never_worked',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 195.0, 'bmi': 29.5
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 56: Tuổi 68 + Multiple critical risks',
        'data': {
            'patientName': 'Ky', 'citizenId': '728029030000', 'age': 68,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 255.0, 'bmi': 34.5
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 57: Tuổi 89 + Hypertension + Glucose cao',
        'data': {
            'patientName': 'Loc', 'citizenId': '829030031000', 'age': 89,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Never_worked',
            'residenceType': 'Rural', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 188.0, 'bmi': 26.5
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 58: Tuổi 72 + All factors combined',
        'data': {
            'patientName': 'Mai3', 'citizenId': '930031032000', 'age': 72,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': True,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 248.0, 'bmi': 35.5
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 59: Tuổi 85 + Heart Disease + High BMI',
        'data': {
            'patientName': 'Ngan', 'citizenId': '031032033000', 'age': 85,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Never_worked',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': True,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 172.0, 'bmi': 31.5
        },
        'expected': 'HIGH'
    },
    {
        'name': 'Case 60: Tuổi 67 + Severe diabetes + Hypertension',
        'data': {
            'patientName': 'Phuong3', 'citizenId': '132033034000', 'age': 67,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Rural', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 285.0, 'bmi': 32.0
        },
        'expected': 'HIGH'
    },
    
    # === 20 CASES MEDIUM RISK ===
    {
        'name': 'Case 61: Tuổi 53 + Hypertension only',
        'data': {
            'patientName': 'Quan2', 'citizenId': '233034035000', 'age': 53,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 112.0, 'bmi': 25.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 62: Tuổi 47 + Moderate glucose',
        'data': {
            'patientName': 'Sa', 'citizenId': '334035036000', 'age': 47,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 165.0, 'bmi': 26.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 63: Tuổi 59 + High BMI only',
        'data': {
            'patientName': 'Tam3', 'citizenId': '435036037000', 'age': 59,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 98.0, 'bmi': 34.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 64: Tuổi 51 + Smoking + Moderate glucose',
        'data': {
            'patientName': 'Tinh', 'citizenId': '536037038000', 'age': 51,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 148.0, 'bmi': 27.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 65: Tuổi 46 + Heart Disease only',
        'data': {
            'patientName': 'Uoc', 'citizenId': '637038039000', 'age': 46,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': True,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 105.0, 'bmi': 24.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 66: Tuổi 63 + Mild conditions',
        'data': {
            'patientName': 'Vu', 'citizenId': '738039040000', 'age': 63,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 138.0, 'bmi': 28.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 67: Tuổi 55 + Hypertension + Mild glucose',
        'data': {
            'patientName': 'Xuan2', 'citizenId': '839040041000', 'age': 55,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 128.0, 'bmi': 26.5
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 68: Tuổi 42 + Obesity + Smoking',
        'data': {
            'patientName': 'Yen4', 'citizenId': '940041042000', 'age': 42,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 102.0, 'bmi': 36.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 69: Tuổi 61 + Moderate multiple factors',
        'data': {
            'patientName': 'An4', 'citizenId': '041042043000', 'age': 61,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 155.0, 'bmi': 29.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 70: Tuổi 48 + High glucose only',
        'data': {
            'patientName': 'Bao4', 'citizenId': '142043044000', 'age': 48,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 178.0, 'bmi': 24.5
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 71: Tuổi 57 + Hypertension + Smoking',
        'data': {
            'patientName': 'Cao', 'citizenId': '243044045000', 'age': 57,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Rural', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 115.0, 'bmi': 26.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 72: Tuổi 50 + Heart Disease + Mild glucose',
        'data': {
            'patientName': 'Dat', 'citizenId': '344045046000', 'age': 50,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': True,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 132.0, 'bmi': 25.5
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 73: Tuổi 64 + Moderate age + BMI',
        'data': {
            'patientName': 'Hai4', 'citizenId': '445046047000', 'age': 64,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 118.0, 'bmi': 30.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 74: Tuổi 45 + Multiple mild factors',
        'data': {
            'patientName': 'Khai', 'citizenId': '546047048000', 'age': 45,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Rural', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 125.0, 'bmi': 28.5
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 75: Tuổi 58 + Glucose elevated',
        'data': {
            'patientName': 'Lan4', 'citizenId': '647048049000', 'age': 58,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 162.0, 'bmi': 25.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 76: Tuổi 52 + Obesity moderate',
        'data': {
            'patientName': 'My', 'citizenId': '748049050000', 'age': 52,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 108.0, 'bmi': 33.5
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 77: Tuổi 43 + Heart + Light smoking',
        'data': {
            'patientName': 'Nhat', 'citizenId': '849050051000', 'age': 43,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': True,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 112.0, 'bmi': 26.0
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 78: Tuổi 60 + Hypertension + BMI mild',
        'data': {
            'patientName': 'Phat2', 'citizenId': '950051052000', 'age': 60,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': True, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 118.0, 'bmi': 29.5
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 79: Tuổi 54 + Smoking + Glucose mild',
        'data': {
            'patientName': 'Quoc', 'citizenId': '051052053000', 'age': 54,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'smokes', 'avgGlucoseLevel': 142.0, 'bmi': 27.5
        },
        'expected': 'MEDIUM'
    },
    {
        'name': 'Case 80: Tuổi 49 + Moderate combined risks',
        'data': {
            'patientName': 'Sang2', 'citizenId': '152053054000', 'age': 49,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'formerly smoked', 'avgGlucoseLevel': 152.0, 'bmi': 30.5
        },
        'expected': 'MEDIUM'
    },
    
    # === 20 CASES LOW RISK ===
    {
        'name': 'Case 81: Tuổi 24 - Trẻ và khỏe mạnh',
        'data': {
            'patientName': 'Tai', 'citizenId': '253054055000', 'age': 24,
            'gender': 'Female', 'everMarried': 'No', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 86.0, 'bmi': 21.0
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 82: Tuổi 31 - Không yếu tố nguy cơ',
        'data': {
            'patientName': 'Trang', 'citizenId': '354055056000', 'age': 31,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 91.0, 'bmi': 22.5
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 83: Tuổi 27 - Rất khỏe',
        'data': {
            'patientName': 'Vi', 'citizenId': '455056057000', 'age': 27,
            'gender': 'Female', 'everMarried': 'No', 'workType': 'Private',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 84.0, 'bmi': 20.5
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 84: Tuổi 35 - Hoàn hảo',
        'data': {
            'patientName': 'Xiem2', 'citizenId': '556057058000', 'age': 35,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 93.0, 'bmi': 23.0
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 85: Tuổi 29 - Trẻ trung',
        'data': {
            'patientName': 'Yen5', 'citizenId': '657058059000', 'age': 29,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 89.0, 'bmi': 21.8
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 86: Tuổi 23 - Sinh viên',
        'data': {
            'patientName': 'An5', 'citizenId': '758059060000', 'age': 23,
            'gender': 'Male', 'everMarried': 'No', 'workType': 'children',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 81.0, 'bmi': 20.0
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 87: Tuổi 37 - Cân đối tốt',
        'data': {
            'patientName': 'Bich', 'citizenId': '859060061000', 'age': 37,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 95.0, 'bmi': 23.5
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 88: Tuổi 32 - Khỏe mạnh',
        'data': {
            'patientName': 'Cuong2', 'citizenId': '960061062000', 'age': 32,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Self-employed',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 90.0, 'bmi': 22.0
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 89: Tuổi 26 - Rất tốt',
        'data': {
            'patientName': 'Dung2', 'citizenId': '061062063000', 'age': 26,
            'gender': 'Female', 'everMarried': 'No', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 85.0, 'bmi': 21.2
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 90: Tuổi 39 - Hoàn toàn khỏe',
        'data': {
            'patientName': 'Ha', 'citizenId': '162063064000', 'age': 39,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 96.0, 'bmi': 24.0
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 91: Tuổi 34 - Không bệnh lý',
        'data': {
            'patientName': 'Khoa', 'citizenId': '263064065000', 'age': 34,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 92.0, 'bmi': 22.8
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 92: Tuổi 28 - Trẻ khỏe',
        'data': {
            'patientName': 'Linh5', 'citizenId': '364065066000', 'age': 28,
            'gender': 'Male', 'everMarried': 'No', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 88.0, 'bmi': 21.5
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 93: Tuổi 38 - Tốt',
        'data': {
            'patientName': 'Mai5', 'citizenId': '465066067000', 'age': 38,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 94.0, 'bmi': 23.2
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 94: Tuổi 25 - Sinh viên khỏe',
        'data': {
            'patientName': 'Nam5', 'citizenId': '566067068000', 'age': 25,
            'gender': 'Male', 'everMarried': 'No', 'workType': 'children',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 83.0, 'bmi': 20.8
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 95: Tuổi 33 - Chuẩn',
        'data': {
            'patientName': 'Oanh5', 'citizenId': '667068069000', 'age': 33,
            'gender': 'Female', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 91.0, 'bmi': 22.3
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 96: Tuổi 30 - Rất khỏe mạnh',
        'data': {
            'patientName': 'Phong5', 'citizenId': '768069070000', 'age': 30,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 90.0, 'bmi': 22.0
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 97: Tuổi 21 - Rất trẻ',
        'data': {
            'patientName': 'Quynh5', 'citizenId': '869070071000', 'age': 21,
            'gender': 'Female', 'everMarried': 'No', 'workType': 'children',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 80.0, 'bmi': 19.8
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 98: Tuổi 36 - Hoàn hảo',
        'data': {
            'patientName': 'Son5', 'citizenId': '970071072000', 'age': 36,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Govt_job',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 93.0, 'bmi': 23.5
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 99: Tuổi 27 - Trẻ và cân đối',
        'data': {
            'patientName': 'Thuy', 'citizenId': '071072073000', 'age': 27,
            'gender': 'Female', 'everMarried': 'No', 'workType': 'Private',
            'residenceType': 'Rural', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 87.0, 'bmi': 21.0
        },
        'expected': 'LOW'
    },
    {
        'name': 'Case 100: Tuổi 40 - Khỏe mạnh hoàn toàn',
        'data': {
            'patientName': 'Vu5', 'citizenId': '172073074000', 'age': 40,
            'gender': 'Male', 'everMarried': 'Yes', 'workType': 'Private',
            'residenceType': 'Urban', 'hypertension': False, 'heartDisease': False,
            'smokingStatus': 'never smoked', 'avgGlucoseLevel': 97.0, 'bmi': 24.0
        },
        'expected': 'LOW'
    },
]

def run_test_cases():
    ps = PredictionService()
    
    print('=' * 100)
    print('TEST 100 CASES - KIỂM TRA ĐỘ CHÍNH XÁC CỦA TẤT CẢ 3 MODELS')
    print('Phân bố: 40 cases mixed + 20 HIGH risk + 20 MEDIUM risk + 20 LOW risk')
    print('=' * 100)
    
    # Initialize result tracking for each model
    model_results = {
        'Decision Tree': {'correct': 0, 'wrong': 0, 'details': []},
        'K-Nearest Neighbors (KNN)': {'correct': 0, 'wrong': 0, 'details': []},
        'Support Vector Machine (SVM)': {'correct': 0, 'wrong': 0, 'details': []}
    }
    
    for i, test_case in enumerate(test_cases, 1):
        data = test_case['data']
        expected = test_case['expected']
        
        try:
            result = ps.predict(data)
            
            # Get results from all models
            models_predictions = result.get('models', [])
            
            # DEBUG
            if i == 1:  # Print debug info for first case only
                print(f"\n[DEBUG] Result keys: {list(result.keys())}")
                print(f"[DEBUG] Models array length: {len(models_predictions)}")
                if models_predictions:
                    print(f"[DEBUG] First model keys: {list(models_predictions[0].keys())}")
                    print(f"[DEBUG] First model: {models_predictions[0]}")
            
            print(f"\n{'='*100}")
            print(f"Case {i}: {test_case['name']}")
            print(f"Age: {data['age']} | Hypertension: {data['hypertension']} | Heart Disease: {data['heartDisease']}")
            print(f"Glucose: {data['avgGlucoseLevel']} | BMI: {data['bmi']} | Smoking: {data['smokingStatus']}")
            print(f"Expected Risk Level: {expected}")
            print('-' * 100)
            
            # Analyze each model
            for model_pred in models_predictions:
                model_name = model_pred.get('name', 'Unknown')
                risk_score = model_pred.get('riskScore', 0)
                risk_level_from_model = model_pred.get('riskLevel', 'LOW')
                
                # Use model-specific threshold
                threshold = MODEL_THRESHOLDS.get(model_name, 0.5)
                predicted_class = 1 if risk_score >= threshold else 0
                
                # Determine predicted risk level (use model's riskLevel or calculate)
                predicted_level = risk_level_from_model
                
                # Check if correct
                is_correct = predicted_level == expected or \
                            (expected == 'HIGH' and predicted_class == 1) or \
                            (expected == 'LOW' and predicted_class == 0)
                
                # Update statistics
                if model_name in model_results:
                    if is_correct:
                        model_results[model_name]['correct'] += 1
                        status = '✅ CORRECT'
                    else:
                        model_results[model_name]['wrong'] += 1
                        status = '❌ WRONG'
                    
                    model_results[model_name]['details'].append({
                        'case': test_case['name'],
                        'age': data['age'],
                        'risk_score': risk_score,
                        'predicted': predicted_level,
                        'expected': expected,
                        'class': predicted_class,
                        'correct': is_correct
                    })
                    
                    print(f"  {status} | {model_name:35s} | Risk: {risk_score*100:6.2f}% | Class: {predicted_class} | Level: {predicted_level:7s} | Threshold: {threshold}")
            
        except Exception as e:
            print(f"\n[ERROR] Case {i} FAILED: {e}")
            for model_name in model_results:
                model_results[model_name]['details'].append({
                    'case': test_case['name'],
                    'error': str(e)
                })
    
    # Print summary
    print('\n' + '=' * 100)
    print('TONG KET KET QUA THEO TUNG MODEL')
    print('=' * 100)
    
    total_cases = len(test_cases)
    
    for model_name, stats in model_results.items():
        correct = stats['correct']
        wrong = stats['wrong']
        accuracy = (correct / total_cases * 100) if total_cases > 0 else 0
        
        print(f"\n{model_name}:")
        print(f"  - Tong so test: {total_cases}")
        print(f"  - Dung:         {correct} cases")
        print(f"  - Sai:          {wrong} cases")
        print(f"  - Do chinh xac: {accuracy:.2f}%")
    
    # Find best model
    best_model = max(model_results.items(), key=lambda x: x[1]['correct'])
    print(f"\n{'='*100}")
    print(f"MODEL TOT NHAT: {best_model[0]} voi {best_model[1]['correct']}/{total_cases} cases dung ({best_model[1]['correct']/total_cases*100:.2f}%)")
    print('=' * 100)
    
    # Write detailed results to file
    with open('test_results_all_models.txt', 'w', encoding='utf-8') as f:
        f.write('=' * 100 + '\n')
        f.write('CHI TIET KET QUA THEO TUNG MODEL\n')
        f.write('=' * 100 + '\n\n')
        
        for model_name, stats in model_results.items():
            f.write(f"\n{'='*100}\n")
            f.write(f"{model_name} - Do chinh xac: {stats['correct']}/{total_cases} = {stats['correct']/total_cases*100:.2f}%\n")
            f.write('='*100 + '\n\n')
            
            # Wrong cases
            f.write(f"CASES SAI ({stats['wrong']} cases):\n")
            f.write('-'*100 + '\n')
            for detail in stats['details']:
                if 'error' not in detail and not detail['correct']:
                    f.write(f"\n❌ {detail['case']}\n")
                    f.write(f"   Age: {detail['age']} | Risk Score: {detail['risk_score']*100:.2f}% | Class: {detail['class']}\n")
                    f.write(f"   Predicted: {detail['predicted']} | Expected: {detail['expected']}\n")
            
            # Correct cases
            f.write(f"\n\nCASES DUNG ({stats['correct']} cases):\n")
            f.write('-'*100 + '\n')
            for detail in stats['details']:
                if 'error' not in detail and detail['correct']:
                    f.write(f"\n✅ {detail['case']}\n")
                    f.write(f"   Age: {detail['age']} | Risk Score: {detail['risk_score']*100:.2f}% | Class: {detail['class']}\n")
                    f.write(f"   Predicted: {detail['predicted']} | Expected: {detail['expected']}\n")
            
            f.write('\n\n')
        
        # Summary table
        f.write('\n' + '='*100 + '\n')
        f.write('BANG TONG HOP\n')
        f.write('='*100 + '\n')
        f.write(f"{'Model':<40s} | {'Dung':>10s} | {'Sai':>10s} | {'Accuracy':>10s}\n")
        f.write('-'*100 + '\n')
        for model_name, stats in model_results.items():
            accuracy = stats['correct']/total_cases*100 if total_cases > 0 else 0
            f.write(f"{model_name:<40s} | {stats['correct']:>10d} | {stats['wrong']:>10d} | {accuracy:>9.2f}%\n")
        
        f.write('\n' + '='*100 + '\n')
        f.write(f"MODEL TOT NHAT: {best_model[0]} ({best_model[1]['correct']}/{total_cases} = {best_model[1]['correct']/total_cases*100:.2f}%)\n")
        f.write('='*100 + '\n')
    
    print('\nCHI TIET ket qua da duoc luu vao file: test_results_all_models.txt')
    print('=' * 100)

if __name__ == '__main__':
    run_test_cases()
