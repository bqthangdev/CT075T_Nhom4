"""Test API response to check if models array is returned"""
import sys
sys.path.insert(0, '.')

from app.services.prediction_service import PredictionService

# Test data
test_data = {
    'patientName': 'Test Patient',
    'citizenId': '123456789012',
    'age': 88,
    'gender': 'Male',
    'hypertension': True,
    'heartDisease': True,
    'everMarried': 'Yes',
    'workType': 'Private',
    'residenceType': 'Urban',
    'smokingStatus': 'smokes',
    'avgGlucoseLevel': 250.0,
    'bmi': 35.0
}

ps = PredictionService()
result = ps.predict(test_data)

print("=" * 80)
print("API RESPONSE STRUCTURE")
print("=" * 80)
print(f"Keys: {list(result.keys())}")
print(f"\nModels array: {result.get('models')}")
print(f"\nNumber of models: {len(result.get('models', []))}")

if result.get('models'):
    print("\n" + "-" * 80)
    print("MODELS DETAILS:")
    print("-" * 80)
    for i, model in enumerate(result['models'], 1):
        print(f"\nModel {i}:")
        print(f"  - Name: {model.get('name')}")
        print(f"  - Risk Score: {model.get('riskScore', 0) * 100:.2f}%")
        print(f"  - Risk Level: {model.get('riskLevel')}")
else:
    print("\n❌ ERROR: Models array is EMPTY or MISSING!")
    print(f"model_scores would be: {ps._predict_with_models(ps._adapt_payload(test_data))}")
