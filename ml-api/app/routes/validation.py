import json
import os
import pandas as pd
import numpy as np
from flask import Blueprint, request, jsonify
from pathlib import Path
from sklearn.model_selection import cross_validate, KFold
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neighbors import KNeighborsClassifier

validation_bp = Blueprint('validation', __name__)

CONFIG_FILE = Path('app/config/model_config.json')
DATASET_FILE = Path('app/data/stroke_data.csv')

def load_config():
    """Load model configuration"""
    try:
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    except Exception as e:
        print(f"[Config] Error loading config: {e}")
        return None

def get_algorithms(config=None):
    """Get configured algorithms"""
    if config is None:
        config = load_config()
    
    if not config:
        # Default config
        config = {
            "logistic_regression": {"max_iter": 1000, "solver": "liblinear", "C": 1.0, "random_state": 42},
            "random_forest": {"n_estimators": 100, "max_depth": None, "random_state": 42},
            "gradient_boosting": {"n_estimators": 100, "learning_rate": 0.1, "random_state": 42},
            "knn": {"n_neighbors": 5, "weights": "uniform"}
        }
    
    algorithms = {}
    
    # Logistic Regression
    lr_params = config.get('logistic_regression', {})
    algorithms['Logistic Regression'] = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', LogisticRegression(**lr_params))
    ])
    
    # Random Forest
    rf_params = config.get('random_forest', {})
    if rf_params.get('max_depth') is None or rf_params.get('max_depth') == 'null':
        rf_params['max_depth'] = None
    algorithms['Random Forest'] = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(**rf_params))
    ])
    
    # Gradient Boosting
    gb_params = config.get('gradient_boosting', {})
    algorithms['Gradient Boosting'] = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', GradientBoostingClassifier(**gb_params))
    ])
    
    # KNN
    knn_params = config.get('knn', {})
    algorithms['KNN'] = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', KNeighborsClassifier(**knn_params))
    ])
    
    return algorithms

def preprocess_data(df):
    """Preprocess the dataset"""
    # Drop id column if exists
    if 'id' in df.columns:
        df = df.drop('id', axis=1)
    
    # Encode categorical variables
    label_encoders = {}
    categorical_cols = ['gender', 'ever_married', 'work_type', 'Residence_type', 'smoking_status']
    
    for col in categorical_cols:
        if col in df.columns:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            label_encoders[col] = le
    
    # Separate features and target
    if 'stroke' in df.columns:
        X = df.drop('stroke', axis=1)
        y = df['stroke']
    else:
        raise ValueError("Dataset must contain 'stroke' column")
    
    return X, y

@validation_bp.route('/kfold', methods=['POST'])
def kfold_validation():
    """Perform K-Fold Cross Validation"""
    try:
        data = request.get_json()
        k_folds = data.get('k_folds', 5)  # Default 5 folds
        data_percent = data.get('data_percent', 100)  # Default 100% of data
        
        if k_folds < 2 or k_folds > 20:
            return jsonify({'error': 'K-Folds must be between 2 and 20'}), 400
        
        if data_percent < 10 or data_percent > 100:
            return jsonify({'error': 'Data percent must be between 10 and 100'}), 400
        
        # Check if dataset exists
        if not DATASET_FILE.exists():
            return jsonify({'error': f'Dataset not found at {DATASET_FILE}'}), 404
        
        # Load dataset
        df = pd.read_csv(DATASET_FILE)
        print(f"[Validation] Loaded dataset with {len(df)} rows")
        
        # Sample data if data_percent < 100
        if data_percent < 100:
            sample_size = int(len(df) * data_percent / 100)
            df = df.sample(n=sample_size, random_state=42)
            print(f"[Validation] Using {data_percent}% of data: {len(df)} rows")
        
        # Preprocess
        X, y = preprocess_data(df)
        
        # Load configuration
        config = load_config()
        algorithms = get_algorithms(config)
        
        # Define scoring metrics
        scoring = {
            'accuracy': 'accuracy',
            'precision': 'precision',
            'recall': 'recall',
            'f1': 'f1',
            'roc_auc': 'roc_auc'
        }
        
        # Perform K-Fold Cross Validation for each algorithm
        results = {}
        kfold = KFold(n_splits=k_folds, shuffle=True, random_state=42)
        
        for name, pipeline in algorithms.items():
            print(f"[Validation] Running K-Fold for {name}...")
            
            try:
                cv_results = cross_validate(
                    pipeline, X, y,
                    cv=kfold,
                    scoring=scoring,
                    return_train_score=True,
                    n_jobs=-1
                )
                
                # Calculate statistics for each metric
                results[name] = {
                    'accuracy': {
                        'mean': float(np.mean(cv_results['test_accuracy'])),
                        'std': float(np.std(cv_results['test_accuracy'])),
                        'folds': [float(x) for x in cv_results['test_accuracy']]
                    },
                    'precision': {
                        'mean': float(np.mean(cv_results['test_precision'])),
                        'std': float(np.std(cv_results['test_precision'])),
                        'folds': [float(x) for x in cv_results['test_precision']]
                    },
                    'recall': {
                        'mean': float(np.mean(cv_results['test_recall'])),
                        'std': float(np.std(cv_results['test_recall'])),
                        'folds': [float(x) for x in cv_results['test_recall']]
                    },
                    'f1': {
                        'mean': float(np.mean(cv_results['test_f1'])),
                        'std': float(np.std(cv_results['test_f1'])),
                        'folds': [float(x) for x in cv_results['test_f1']]
                    },
                    'roc_auc': {
                        'mean': float(np.mean(cv_results['test_roc_auc'])),
                        'std': float(np.std(cv_results['test_roc_auc'])),
                        'folds': [float(x) for x in cv_results['test_roc_auc']]
                    },
                    'train_accuracy': {
                        'mean': float(np.mean(cv_results['train_accuracy'])),
                        'std': float(np.std(cv_results['train_accuracy']))
                    }
                }
                
                print(f"[Validation] {name} - Accuracy: {results[name]['accuracy']['mean']:.4f} (+/- {results[name]['accuracy']['std']:.4f})")
                
            except Exception as e:
                print(f"[Validation] Error in {name}: {e}")
                results[name] = {'error': str(e)}
        
        return jsonify({
            'k_folds': k_folds,
            'dataset_size': len(df),
            'results': results
        }), 200
        
    except Exception as e:
        print(f"[Validation] Error: {e}")
        return jsonify({'error': str(e)}), 500

@validation_bp.route('/dataset/info', methods=['GET'])
def get_dataset_info():
    """Get dataset information"""
    try:
        if not DATASET_FILE.exists():
            return jsonify({'error': 'Dataset not found'}), 404
        
        df = pd.read_csv(DATASET_FILE)
        
        info = {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'columns': list(df.columns),
            'stroke_distribution': {
                'no_stroke': int(df[df['stroke'] == 0].shape[0]),
                'stroke': int(df[df['stroke'] == 1].shape[0])
            },
            'missing_values': df.isnull().sum().to_dict()
        }
        
        return jsonify(info), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
