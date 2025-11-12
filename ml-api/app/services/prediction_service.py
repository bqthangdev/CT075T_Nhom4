import os
import json
import glob
import joblib
from datetime import datetime
from typing import Dict, Any, List
from pathlib import Path
from ..utils.helpers import validate_input


FEATURE_MAPPING = {
    # Frontend → Dataset feature names
    'avgGlucoseLevel': 'avg_glucose_level',
    'heartDisease': 'heart_disease',
    'residenceType': 'Residence_type',
}


class PredictionService:
    def __init__(self):
        self._models: Dict[str, Any] = {}
        self._model_path = os.getenv('MODEL_PATH', '')  # optional single model path
        self._models_dir = os.getenv('MODELS_DIR', 'app/models')
        self._history_file = os.getenv('HISTORY_FILE', 'app/data/history.json')
        self._metrics_file = 'app/models/metrics.json'
        self._load_models()
        self._load_history()
        self._load_metrics()

    def _load_models(self):
        # Try explicit single model path
        if self._model_path and os.path.exists(self._model_path):
            try:
                self._models['default'] = joblib.load(self._model_path)
                print(f"[ML] Loaded model (default) from {self._model_path}")
            except Exception as e:
                print(f"[ML] Failed to load default model: {e}")

        # Load all .joblib models under models dir
        try:
            pattern = os.path.join(self._models_dir, '*.joblib')
            for file in glob.glob(pattern):
                name = os.path.splitext(os.path.basename(file))[0]
                if name in self._models:
                    continue
                try:
                    self._models[name] = joblib.load(file)
                    print(f"[ML] Loaded model '{name}' from {file}")
                except Exception as e:
                    print(f"[ML] Failed to load model '{name}': {e}")
        except Exception as e:
            print(f"[ML] Model directory scan failed: {e}")

    def _load_history(self):
        """Load history from JSON file."""
        self._history: List[Dict[str, Any]] = []
        try:
            if os.path.exists(self._history_file):
                with open(self._history_file, 'r', encoding='utf-8') as f:
                    self._history = json.load(f)
                print(f"[History] Loaded {len(self._history)} records from {self._history_file}")
            else:
                print(f"[History] No history file found at {self._history_file}")
        except Exception as e:
            print(f"[History] Failed to load history: {e}")
            self._history = []

    def _load_metrics(self):
        """Load training metrics from JSON file."""
        self._metrics: Dict[str, Dict[str, Any]] = {}
        try:
            if os.path.exists(self._metrics_file):
                with open(self._metrics_file, 'r', encoding='utf-8') as f:
                    self._metrics = json.load(f)
                print(f"[Metrics] Loaded metrics for {len(self._metrics)} models from {self._metrics_file}")
            else:
                print(f"[Metrics] No metrics file found at {self._metrics_file}")
        except Exception as e:
            print(f"[Metrics] Failed to load metrics: {e}")
            self._metrics = {}

    def _save_history(self):
        """Save history to JSON file."""
        try:
            Path(self._history_file).parent.mkdir(parents=True, exist_ok=True)
            with open(self._history_file, 'w', encoding='utf-8') as f:
                json.dump(self._history, f, indent=2, ensure_ascii=False)
            print(f"[History] Saved {len(self._history)} records to {self._history_file}")
        except Exception as e:
            print(f"[History] Failed to save history: {e}")

    def _adapt_payload(self, data: Dict[str, Any]) -> Dict[str, Any]:
        adapted = {}
        for k, v in data.items():
            k2 = FEATURE_MAPPING.get(k, k)
            adapted[k2] = v
        return adapted

    def _predict_with_models(self, data: Dict[str, Any]) -> Dict[str, float]:
        results: Dict[str, float] = {}
        if not self._models:
            return results
        input_df = self._to_dataframe(data)
        for name, model in self._models.items():
            try:
                if hasattr(model, 'predict_proba'):
                    proba = model.predict_proba(input_df)[0, 1]
                    results[name] = float(proba)
                else:
                    # fall back: decision_function or predicted class
                    pred = model.predict(input_df)[0]
                    results[name] = float(pred)
            except Exception as e:
                print(f"[ML] Prediction failed for '{name}': {e}")
        return results

    @staticmethod
    def _to_dataframe(data: Dict[str, Any]):
        import pandas as pd
        # The training uses these columns
        cols = ['age', 'avg_glucose_level', 'bmi', 'gender', 'hypertension',
                'heart_disease', 'ever_married', 'work_type', 'Residence_type', 'smoking_status']
        # Ensure presence of keys
        row = {c: data.get(c) for c in cols}
        return pd.DataFrame([row])

    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Validate
        errors = validate_input(data)
        if errors:
            raise ValueError('; '.join(errors))

        adapted = self._adapt_payload(data)

        # Try models first
        model_scores = self._predict_with_models(adapted)

        # Aggregate average probability when available
        score = None
        if model_scores:
            score = sum(model_scores.values()) / len(model_scores)

        # Fallback heuristic if no model available
        if score is None:
            age = float(data.get('age', 0))
            glucose = float(data.get('avgGlucoseLevel', 0))
            bmi = float(data.get('bmi', 0))

            score = 0.0
            score += min(age / 120.0, 1.0) * 0.35
            score += min(glucose / 300.0, 1.0) * 0.35
            score += min(bmi / 50.0, 1.0) * 0.20
            if str(data.get('hypertension')).lower() in ['true', '1', 'yes']:
                score += 0.07
            if str(data.get('heartDisease')).lower() in ['true', '1', 'yes']:
                score += 0.08
            score = max(0.0, min(score, 1.0))

        risk_level = self._risk_level(score)
        recommendations = self._recommendations(data, score)

        record = {
            **data,
            'strokeRisk': score,
            'prediction': risk_level,
            'createdAt': datetime.utcnow().isoformat() + 'Z'
        }
        # Save to history file
        self._history.insert(0, record)
        self._history = self._history[:100]  # keep last 100
        self._save_history()

        models_arr = [
            {
                'name': name,
                'riskScore': s,
                'riskLevel': self._risk_level(s),
                'metrics': self._metrics.get(name, {})
            }
            for name, s in model_scores.items()
        ] if model_scores else []

        return {
            'riskScore': score,
            'riskLevel': risk_level,
            'models': models_arr,
            'recommendations': recommendations
        }

    def get_history(self) -> List[Dict[str, Any]]:
        return self._history

    def delete_record(self, index: int) -> bool:
        """Delete a history record by index."""
        try:
            if 0 <= index < len(self._history):
                del self._history[index]
                self._save_history()
                print(f"[History] Deleted record at index {index}")
                return True
            else:
                print(f"[History] Invalid index {index}, history length: {len(self._history)}")
                return False
        except Exception as e:
            print(f"[History] Failed to delete record: {e}")
            return False

    @staticmethod
    def _risk_level(score: float) -> str:
        if score < 0.33:
            return 'Low Risk'
        if score < 0.66:
            return 'Medium Risk'
        return 'High Risk'

    @staticmethod
    def _recommendations(data: Dict[str, Any], score: float) -> List[str]:
        recs: List[str] = []
        glucose = float(data.get('avgGlucoseLevel', 0))
        bmi = float(data.get('bmi', 0))
        smoking = str(data.get('smokingStatus', 'Unknown'))

        if glucose > 140:
            recs.append('Kiểm tra đường huyết và tư vấn chế độ dinh dưỡng.')
        if bmi >= 25:
            recs.append('Tăng cường vận động và theo dõi chỉ số BMI.')
        if smoking in ['smokes', 'formerly smoked']:
            recs.append('Cai thuốc lá để giảm nguy cơ tim mạch và đột quỵ.')
        if str(data.get('hypertension')).lower() in ['true', '1', 'yes']:
            recs.append('Theo dõi huyết áp định kỳ và tuân thủ điều trị.')
        if score >= 0.66:
            recs.append('Tham khảo bác sĩ chuyên khoa để được tư vấn chi tiết.')

        if not recs:
            recs.append('Duy trì lối sống lành mạnh và kiểm tra sức khỏe định kỳ.')
        return recs
