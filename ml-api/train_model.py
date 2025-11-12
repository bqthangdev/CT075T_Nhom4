import os
import json
import joblib
import pandas as pd
from datetime import datetime
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    mean_absolute_error,
    mean_squared_error,
    confusion_matrix,
)
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neighbors import KNeighborsClassifier

DATA_PATH = Path('app/Dataset/healthcare-dataset-stroke-data.csv')
MODEL_DIR = Path('app/models')
CONFIG_FILE = Path('app/config/model_config.json')
MANIFEST_FILE = MODEL_DIR / 'models.json'
METRICS_FILE = MODEL_DIR / 'metrics.json'

TARGET_COL = 'stroke'

NUM_COLS = ['age', 'avg_glucose_level', 'bmi']
CAT_COLS = ['gender', 'hypertension', 'heart_disease', 'ever_married', 'work_type', 'Residence_type', 'smoking_status']


def load_data():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f'Dataset not found at {DATA_PATH}')
    df = pd.read_csv(DATA_PATH)
    # Basic cleaning
    df = df.dropna(subset=['age', 'avg_glucose_level'])
    return df


def build_preprocessor():
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
    ])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore')),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, NUM_COLS),
            ('cat', categorical_transformer, CAT_COLS),
        ]
    )
    return preprocessor


def get_algorithms():
    # Load config if exists
    config = {}
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
            print(f'Loaded config from {CONFIG_FILE}')
        except Exception as e:
            print(f'Failed to load config: {e}')
    
    # Get params or use defaults
    lr_params = config.get('logistic_regression', {
        'max_iter': 1000, 'solver': 'liblinear', 'class_weight': 'balanced', 'C': 1.0, 'penalty': 'l2', 'random_state': 42
    })
    rf_params = config.get('random_forest', {
        'n_estimators': 300, 'random_state': 42, 'class_weight': 'balanced'
    })
    gb_params = config.get('gradient_boosting', {
        'n_estimators': 100, 'learning_rate': 0.1, 'max_depth': 3, 'random_state': 42
    })
    knn_params = config.get('knn', {
        'n_neighbors': 15, 'weights': 'uniform', 'algorithm': 'auto'
    })
    
    # Remove None values for params
    lr_params = {k: v for k, v in lr_params.items() if v is not None}
    rf_params = {k: v for k, v in rf_params.items() if v is not None}
    gb_params = {k: v for k, v in gb_params.items() if v is not None}
    knn_params = {k: v for k, v in knn_params.items() if v is not None}
    
    return {
        'logistic_regression': LogisticRegression(**lr_params),
        'random_forest': RandomForestClassifier(**rf_params),
        'gradient_boosting': GradientBoostingClassifier(**gb_params),
        'knn': KNeighborsClassifier(**knn_params),
    }


def train():
    print('Loading data...')
    df = load_data()
    print(f'Dataset shape: {df.shape}')

    # Prepare features/target
    X = df[NUM_COLS + CAT_COLS]
    y = df[TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    preprocessor = build_preprocessor()
    algos = get_algorithms()

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    manifest = []
    all_metrics = {}

    for name, clf in algos.items():
        print(f'\n=== Training: {name} ===')
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('model', clf)
        ])
        pipeline.fit(X_train, y_train)

        # Evaluation
        y_pred = pipeline.predict(X_test)
        try:
            y_proba = pipeline.predict_proba(X_test)[:, 1]
            auc = roc_auc_score(y_test, y_proba)
            mae_proba = mean_absolute_error(y_test, y_proba)
            mse_proba = mean_squared_error(y_test, y_proba)
        except Exception:
            auc = None
            mae_proba = None
            mse_proba = None
        
        # Calculate confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
        
        acc = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        
        # MAE and MSE for predictions (0/1)
        mae = mean_absolute_error(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)

        metrics = {
            'roc_auc': float(auc) if auc is not None else None,
            'accuracy': float(acc),
            'f1_score': float(f1),
            'precision': float(prec),
            'recall': float(rec),
            'mae': float(mae),
            'mse': float(mse),
            'mae_proba': float(mae_proba) if mae_proba is not None else None,
            'mse_proba': float(mse_proba) if mse_proba is not None else None,
            'confusion_matrix': {
                'true_negative': int(tn),
                'false_positive': int(fp),
                'false_negative': int(fn),
                'true_positive': int(tp)
            },
            'specificity': float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0,
            'sensitivity': float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0,
        }
        print(json.dumps(metrics, indent=2))
        print(classification_report(y_test, y_pred, zero_division=0))

        # Save pipeline
        model_path = MODEL_DIR / f'{name}.joblib'
        joblib.dump(pipeline, model_path)
        print(f'Model saved to {model_path}')

        manifest.append({
            'name': name,
            'file': str(model_path),
            'trained_at': datetime.utcnow().isoformat() + 'Z'
        })
        all_metrics[name] = metrics

    # Save manifest and metrics
    with open(MANIFEST_FILE, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
    with open(METRICS_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_metrics, f, indent=2)
    print(f'Written manifest to {MANIFEST_FILE} and metrics to {METRICS_FILE}')


if __name__ == '__main__':
    train()
