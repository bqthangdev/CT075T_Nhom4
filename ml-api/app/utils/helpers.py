import re


def _is_all_same_digits(s: str) -> bool:
    return bool(re.fullmatch(r"(\d)\1{8,}", s))  # 9+ same digits


def validate_input(data):
    errors = []

    # patientName
    name = data.get('patientName')
    if not name or not isinstance(name, str):
        errors.append('Vui lòng nhập tên bệnh nhân.')
    else:
        v = ' '.join(name.split())
        if not (2 <= len(v) <= 50):
            errors.append('Tên bệnh nhân phải từ 2 đến 50 ký tự.')
        # Allow letters (incl. Vietnamese), digits, and spaces only (no special chars)
        if not re.fullmatch(r"[A-Za-zÀ-ỹà-ỹĐđ0-9\s]+", v):
            errors.append('Tên không được chứa ký tự đặc biệt.')

    # citizenId
    cid = data.get('citizenId')
    if cid is None:
        errors.append('Vui lòng nhập số CCCD.')
    else:
        s = str(cid)
        if not re.fullmatch(r"\d{12}", s):
            errors.append('CCCD phải là 12 chữ số.')
        elif _is_all_same_digits(s):
            errors.append('CCCD không hợp lệ (không được 12 số giống nhau).')

    # age
    age = data.get('age')
    try:
        age_val = int(age)
    except Exception:
        errors.append('Tuổi không hợp lệ.')
        age_val = None
    if age_val is not None and not (1 <= age_val <= 120):
        errors.append('Tuổi phải trong khoảng 1-120.')

    # gender
    gender = data.get('gender')
    if gender not in ['Male', 'Female', 'Other']:
        errors.append('Giới tính không hợp lệ.')

    # everMarried
    ever_married = data.get('everMarried')
    if ever_married not in ['Yes', 'No']:
        errors.append('Tình trạng hôn nhân không hợp lệ.')

    # workType
    work_type = data.get('workType')
    allowed_work = ['Private', 'Self-employed', 'Govt_job', 'children', 'Never_worked']
    if work_type not in allowed_work:
        errors.append('Loại công việc không hợp lệ.')

    # residenceType
    residence = data.get('residenceType')
    if residence not in ['Urban', 'Rural']:
        errors.append('Nơi cư trú không hợp lệ.')

    # smokingStatus
    smoking = data.get('smokingStatus')
    allowed_smoking = ['never smoked', 'formerly smoked', 'smokes', 'Unknown']
    if smoking not in allowed_smoking:
        errors.append('Tình trạng hút thuốc không hợp lệ.')

    # hypertension
    if 'hypertension' not in data:
        errors.append('Vui lòng chọn tình trạng tăng huyết áp.')
    else:
        htn = data.get('hypertension')
        if not isinstance(htn, bool):
            errors.append('Trường tăng huyết áp không hợp lệ.')

    # heart disease
    if 'heartDisease' not in data:
        errors.append('Vui lòng chọn tình trạng bệnh tim.')
    else:
        hd = data.get('heartDisease')
        if not isinstance(hd, bool):
            errors.append('Trường bệnh tim không hợp lệ.')

    # avgGlucoseLevel
    glucose = data.get('avgGlucoseLevel')
    try:
        glu = float(glucose)
        if not (40 <= glu <= 400):
            errors.append('Chỉ số glucose hợp lệ từ 40 đến 400 mg/dL.')
    except Exception:
        errors.append('Chỉ số glucose không hợp lệ.')

    # bmi
    bmi = data.get('bmi')
    try:
        bmi_val = float(bmi)
        if not (10 <= bmi_val <= 60):
            errors.append('BMI hợp lệ từ 10 đến 60.')
    except Exception:
        errors.append('BMI không hợp lệ.')

    return errors
