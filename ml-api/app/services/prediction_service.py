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
    'everMarried': 'ever_married',
    'workType': 'work_type',
    'smokingStatus': 'smoking_status',
}

MODEL_DISPLAY_NAMES = {
    'knn': 'K-Nearest Neighbors (KNN)',
    'svm': 'Support Vector Machine (SVM)',
    'decision_tree': 'Decision Tree',
}

# Optimal thresholds for each model based on ROC analysis
# SVM (IMPROVED): threshold=0.10 provides F1=31%, Recall=75.9%, ROC-AUC=0.8626
# New SVM uses dual calibration (Platt + Isotonic) with C=0.1 for better probability estimates
# This significantly improves probability calibration compared to old model
MODEL_THRESHOLDS = {
    'knn': 0.5,           # Standard threshold
    'svm': 0.10,          # Optimized threshold for IMPROVED SVM with dual calibration
    'decision_tree': 0.5, # Standard threshold
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
    
    def _get_best_model(self) -> str:
        """
        Determine the best model based on training metrics.
        Priority: accuracy > f1_score > roc_auc
        Returns model key (e.g., 'decision_tree', 'svm', 'knn')
        """
        if not self._metrics:
            # Default fallback priority if no metrics
            for model_key in ['decision_tree', 'svm', 'knn']:
                if model_key in self._models:
                    return model_key
            return list(self._models.keys())[0] if self._models else None
        
        best_model = None
        best_score = -1
        
        for model_key, metrics in self._metrics.items():
            # Calculate composite score: weighted average of key metrics
            # Priority: accuracy (50%) + f1_score (30%) + roc_auc (20%)
            accuracy = metrics.get('accuracy', 0)
            f1 = metrics.get('f1_score', 0)
            roc_auc = metrics.get('roc_auc', 0)
            
            composite_score = accuracy * 0.5 + f1 * 0.3 + roc_auc * 0.2
            
            if composite_score > best_score:
                best_score = composite_score
                best_model = model_key
        
        print(f"[ML] Best model determined: {best_model} (score: {best_score:.4f})")
        return best_model if best_model else list(self._models.keys())[0] if self._models else None

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
        
        # Prepare row with proper type conversion BEFORE creating DataFrame
        row = {}
        for c in cols:
            val = data.get(c)
            # Convert boolean to int immediately
            if c in ['hypertension', 'heart_disease']:
                row[c] = int(val) if isinstance(val, bool) else val
            # Convert numeric to float
            elif c in ['age', 'avg_glucose_level', 'bmi']:
                row[c] = float(val) if val is not None else None
            else:
                row[c] = val
        
        df = pd.DataFrame([row])
        return df

    @staticmethod
    def _apply_svm_calibration(raw_score: float) -> tuple[float, str]:
        """
        Apply percentile-based re-calibration for SVM probability.
        SVM raw probabilities are typically very low (median ~0.05).
        Map to [0, 1] scale based on percentile distribution.
        
        Returns: (adjusted_score, calibration_method)
        """
        # SVM probabilities in training data:
        # - P50 (median) ≈ 0.05
        # - P75 ≈ 0.08
        # - P90 ≈ 0.15
        # - P95 ≈ 0.25
        
        if raw_score < 0.05:  # Below median (P0-P50) → Scale to [0, 0.4]
            adjusted = raw_score / 0.05 * 0.4
            method = "Percentile P0-P50"
        elif raw_score < 0.08:  # P50-P75 → Scale to [0.4, 0.6]
            adjusted = 0.4 + (raw_score - 0.05) / (0.08 - 0.05) * 0.2
            method = "Percentile P50-P75"
        elif raw_score < 0.15:  # P75-P90 → Scale to [0.6, 0.8]
            adjusted = 0.6 + (raw_score - 0.08) / (0.15 - 0.08) * 0.2
            method = "Percentile P75-P90"
        else:  # Above P90 → Scale to [0.8, 1.0]
            adjusted = 0.8 + min((raw_score - 0.15) / (0.5 - 0.15), 1.0) * 0.2
            method = "Percentile P90+"
        
        return max(0.0, min(adjusted, 1.0)), method

    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Validate
        errors = validate_input(data)
        if errors:
            raise ValueError('; '.join(errors))

        adapted = self._adapt_payload(data)

        # Try models first
        model_scores = self._predict_with_models(adapted)

        # UPDATED: Use best performing model based on training metrics
        # Automatically determined from accuracy, F1-score, and ROC-AUC
        raw_score = None
        adjusted_score = None
        best_model_key = None
        calibration_method = None
        
        if model_scores:
            # Get the best model based on training metrics
            best_model_key = self._get_best_model()
            
            # Priority: Best Model > Ensemble Average > Fallback to any available
            if best_model_key and best_model_key in model_scores:
                raw_score = model_scores[best_model_key]
                
                # Apply calibration for SVM to get adjusted score
                if best_model_key == 'svm':
                    adjusted_score, calibration_method = self._apply_svm_calibration(raw_score)
                    print(f"[Prediction] Using best model: {best_model_key} (raw: {raw_score:.4f}, adjusted: {adjusted_score:.4f})")
                else:
                    adjusted_score = raw_score
                    print(f"[Prediction] Using best model: {best_model_key} (score: {raw_score:.4f})")
                    
            elif len(model_scores) >= 2:
                # Use ensemble average if best model not available
                raw_score = sum(model_scores.values()) / len(model_scores)
                adjusted_score = raw_score
                print(f"[Prediction] Using ensemble average (score: {raw_score:.4f})")
            else:
                # Fallback to first available model
                raw_score = list(model_scores.values())[0]
                best_model_key = list(model_scores.keys())[0]
                
                # Apply calibration for SVM
                if best_model_key == 'svm':
                    adjusted_score, calibration_method = self._apply_svm_calibration(raw_score)
                    print(f"[Prediction] Using fallback model: {best_model_key} (raw: {raw_score:.4f}, adjusted: {adjusted_score:.4f})")
                else:
                    adjusted_score = raw_score
                    print(f"[Prediction] Using fallback model: {best_model_key} (score: {raw_score:.4f})")

        # Fallback heuristic if no model available
        # Weights based on Feature Importance analysis (Top 5 features)
        if raw_score is None:
            age = float(data.get('age', 0))
            glucose = float(data.get('avgGlucoseLevel', 0))
            bmi = float(data.get('bmi', 0))
            ever_married = str(data.get('ever_married', data.get('everMarried', ''))).lower()
            hypertension = str(data.get('hypertension', '')).lower()

            raw_score = 0.0
            # Top 5 features by importance (total = 82.6%)
            raw_score += min(age / 120.0, 1.0) * 0.376        # 37.6% - Most important
            raw_score += min(glucose / 300.0, 1.0) * 0.20     # 20.0% - Second
            raw_score += min(bmi / 50.0, 1.0) * 0.177         # 17.7% - Third
            
            # Ever Married: Yes increases risk slightly (3.9%)
            if ever_married in ['yes', 'true', '1']:
                raw_score += 0.039  # 3.9%
            
            # Hypertension (3.4%)
            if hypertension in ['true', '1', 'yes']:
                raw_score += 0.034  # 3.4%
            
            # Heart Disease - not in top 5 but still relevant (~2.5%)
            if str(data.get('heart_disease', data.get('heartDisease', ''))).lower() in ['true', '1', 'yes']:
                raw_score += 0.025  # ~2.5%
            
            raw_score = max(0.0, min(raw_score, 1.0))
            adjusted_score = raw_score

        # Use adjusted score for risk level calculation (consistent display)
        score = adjusted_score if adjusted_score is not None else raw_score
        risk_level = self._risk_level(score)
        recommendations = self._recommendations(data, score)
        
        # Use model-specific threshold for classification
        threshold = MODEL_THRESHOLDS.get(best_model_key, 0.5) if best_model_key else 0.5
        predicted_class = 1 if raw_score >= threshold else 0
        classification_result = 'Có nguy cơ' if predicted_class == 1 else 'Không có nguy cơ'

        # Build models array with display names and use optimal thresholds
        models_arr = []
        if model_scores:
            for name, s in model_scores.items():
                threshold = MODEL_THRESHOLDS.get(name, 0.5)
                model_predicted_class = 1 if s >= threshold else 0
                
                # Apply calibration for SVM
                model_adjusted_score = s
                model_calibration_method = None
                
                if name == 'svm':
                    model_adjusted_score, model_calibration_method = self._apply_svm_calibration(s)
                
                models_arr.append({
                    'name': MODEL_DISPLAY_NAMES.get(name, name),
                    'riskScore': s,  # Original probability
                    'adjustedRiskScore': model_adjusted_score,  # Re-calibrated for SVM
                    'riskLevel': self._risk_level(model_adjusted_score),  # Use adjusted for level
                    'predictedClass': model_predicted_class,
                    'threshold': threshold,
                    'calibrationMethod': model_calibration_method,  # Show strategy used
                    'isBestModel': (name == best_model_key)  # Mark best model
                })

        record = {
            **data,
            'strokeRisk': raw_score,  # Raw probability from model
            'adjustedStrokeRisk': adjusted_score,  # Adjusted probability (calibrated for SVM)
            'prediction': risk_level,  # Based on adjusted score
            'predictedClass': predicted_class,  # 0 or 1 based on model-specific threshold
            'classificationResult': classification_result,  # Based on model-specific threshold
            'threshold': threshold,  # Threshold used for classification
            'calibrationMethod': calibration_method,  # Calibration method for best model (if SVM)
            'bestModel': MODEL_DISPLAY_NAMES.get(best_model_key, best_model_key) if best_model_key else None,
            'models': models_arr,  # Save detailed algorithm comparison
            'recommendations': recommendations,  # Save health recommendations
            'createdAt': datetime.utcnow().isoformat() + 'Z'
        }
        
        # Always add new record (keep history of all diagnoses)
        self._history.insert(0, record)
        citizen_id = data.get('citizenId')
        if citizen_id:
            print(f"[History] Added new record for citizenId: {citizen_id}")
        else:
            print(f"[History] Added new record without citizenId")
        
        self._history = self._history[:100]  # keep last 100
        self._save_history()

        return {
            'riskScore': raw_score,  # Raw probability
            'adjustedRiskScore': adjusted_score,  # Adjusted probability (calibrated)
            'riskLevel': risk_level,  # Based on adjusted score
            'predictedClass': predicted_class,  # Based on model-specific threshold
            'classificationResult': classification_result,  # Based on model-specific threshold
            'threshold': threshold,  # Threshold used
            'calibrationMethod': calibration_method,  # If SVM was used
            'bestModel': MODEL_DISPLAY_NAMES.get(best_model_key, best_model_key) if best_model_key else None,
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

    def delete_multiple_records(self, indices: List[int]) -> bool:
        """Delete multiple history records by indices."""
        try:
            # Sort indices in descending order to avoid index shifting during deletion
            sorted_indices = sorted(set(indices), reverse=True)
            
            # Validate all indices first
            for idx in sorted_indices:
                if idx < 0 or idx >= len(self._history):
                    print(f"[History] Invalid index {idx}")
                    return False
            
            # Delete records
            deleted_count = 0
            for idx in sorted_indices:
                del self._history[idx]
                deleted_count += 1
            
            self._save_history()
            print(f"[History] Deleted {deleted_count} records")
            return True
        except Exception as e:
            print(f"[History] Failed to delete multiple records: {e}")
            return False

    def clear_all_history(self) -> bool:
        """Clear all history records."""
        try:
            self._history = []
            self._save_history()
            print(f"[History] Cleared all history records")
            return True
        except Exception as e:
            print(f"[History] Failed to clear history: {e}")
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
