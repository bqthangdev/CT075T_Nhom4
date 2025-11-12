def validate_input(data):
    errors = []

    age = data.get('age')
    if age is None or float(age) < 0 or float(age) > 130:
        errors.append('Tuổi không hợp lệ (0-130).')

    glucose = data.get('avgGlucoseLevel')
    if glucose is None or float(glucose) < 0:
        errors.append('Chỉ số glucose không hợp lệ.')

    bmi = data.get('bmi')
    if bmi is None or float(bmi) < 0 or float(bmi) > 100:
        errors.append('BMI không hợp lệ (0-100).')

    gender = data.get('gender')
    if gender not in ['Male', 'Female', 'Other']:
        errors.append('Giới tính không hợp lệ.')

    return errors
