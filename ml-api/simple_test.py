"""Simple test for one case"""
import sys
import os
# Add ml-api directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app.services.prediction_service import PredictionService

# Test case 1: 88yo with all risk factors
test_data = {
    'age': 88,
    'hypertension': True,
    'heartDisease': True,
    'avgGlucoseLevel': 250.0,
    'bmi': 35.0,
    'gender': 'Male',
    'everMarried': 'Yes',
    'workType': 'Private',
    'residenceType': 'Urban',
    'smoking Status': 'smokes',
    'citizenId': 'TEST001'
}

ps = PredictionService()
result = ps.predict(test_data)

print("=" * 80)
print("TEST CASE: 88yo Male with ALL RISK FACTORS")
print("=" * 80)
print(f"Risk Score: {result['riskScore'] * 100:.2f}%")
print(f"Risk Level: {result['riskLevel']}")
print(f"Predicted Class: {result['predictedClass']}")
print(f"Classification: {result['classificationResult']}")

print(f"\n{'Model Name':<40} {'Risk Score':<15} {'Risk Level'}")
print("=" * 80)
for model in result.get('models', []):
    print(f"{model['name']:<40} {model['riskScore']*100:>6.2f}%         {model['riskLevel']}")
