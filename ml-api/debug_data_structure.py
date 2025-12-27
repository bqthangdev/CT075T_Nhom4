"""Quick debug script to compare training data structure vs prediction data structure."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pandas as pd
import joblib

# Load training data to see its structure
train_data = pd.read_csv('app/data/healthcare-dataset-stroke-data.csv')
print('=== TRAINING DATA COLUMNS ===')
print(train_data.columns.tolist())
print('\n=== TRAINING DATA DTYPES ===')
print(train_data.dtypes)
print('\n=== TRAINING DATA SAMPLE (first 2 rows) ===')
print(train_data.head(2))

# Load a model to see what it expects
model = joblib.load('app/models/decision_tree.joblib')
print('\n=== MODEL TYPE ===')
print(type(model))
print('\n=== MODEL STEPS (if Pipeline) ===')
if hasattr(model, 'named_steps'):
    for name in model.named_steps:
        print(f'  - {name}: {type(model.named_steps[name])}')
        
    # Check what columns the preprocessor expects
    if 'preprocessor' in model.named_steps:
        preprocessor = model.named_steps['preprocessor']
        if hasattr(preprocessor, 'transformers'):
            print('\n=== PREPROCESSOR TRANSFORMERS ===')
            for name, transformer, cols in preprocessor.transformers:
                print(f'  - {name}: {transformer} -> {cols}')

# Create test DataFrame the way prediction should work
print('\n=== CREATING TEST DATA ===')
test_case = {
    'age': 88.0,
    'hypertension': 1,  # int, not bool
    'heart_disease': 1,  # int, not bool
    'avg_glucose_level': 250.0,
    'bmi': 35.0,
    'gender': 'Male',
    'ever_married': 'Yes',
    'work_type': 'Private',
    'Residence_type': 'Urban',
    'smoking_status': 'smokes'
}

cols = ['age', 'avg_glucose_level', 'bmi', 'gender', 'hypertension',
        'heart_disease', 'ever_married', 'work_type', 'Residence_type', 'smoking_status']

df = pd.DataFrame([{c: test_case.get(c) for c in cols}])
print('\n=== PREDICTION DATAFRAME ===')
print(df)
print('\n=== PREDICTION DTYPES ===')
print(df.dtypes)

# Try prediction
print('\n=== TESTING PREDICTION ===')
try:
    proba = model.predict_proba(df)
    print(f'Prediction successful!')
    print(f'Probabilities: {proba}')
    print(f'Risk for stroke: {proba[0, 1] * 100:.2f}%')
except Exception as e:
    print(f'Prediction FAILED: {e}')
    import traceback
    traceback.print_exc()
