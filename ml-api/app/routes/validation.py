import json
import os
import pandas as pd
import numpy as np
from flask import Blueprint, request, jsonify
from pathlib import Path
from sklearn.model_selection import cross_validate, KFold, train_test_split, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

validation_bp = Blueprint('validation', __name__)

CONFIG_FILE = Path('app/config/model_config.json')
DATASET_FILE = Path('app/data/healthcare-dataset-stroke-data.csv')

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
    # Make a copy to avoid modifying original
    df = df.copy()
    
    # Drop id column if exists
    if 'id' in df.columns:
        df = df.drop('id', axis=1)
    
    # Handle missing values in BMI
    if 'bmi' in df.columns:
        df['bmi'].fillna(df['bmi'].median(), inplace=True)
    
    # Fill any other missing numerical values
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    for col in numerical_cols:
        if df[col].isnull().any():
            df[col].fillna(df[col].median(), inplace=True)
    
    # Encode categorical variables
    label_encoders = {}
    categorical_cols = ['gender', 'ever_married', 'work_type', 'Residence_type', 'smoking_status']
    
    for col in categorical_cols:
        if col in df.columns:
            le = LabelEncoder()
            # Fill missing categorical values with 'Unknown' before encoding
            df[col] = df[col].fillna('Unknown').astype(str)
            df[col] = le.fit_transform(df[col])
            label_encoders[col] = le
    
    # Separate features and target
    if 'stroke' in df.columns:
        X = df.drop('stroke', axis=1)
        y = df['stroke']
    else:
        raise ValueError("Dataset must contain 'stroke' column")
    
    # Final check: ensure no NaN values remain
    if X.isnull().any().any():
        print("[Warning] NaN values found after preprocessing, filling with 0")
        X = X.fillna(0)
    
    return X, y

@validation_bp.route('/kfold', methods=['POST'])
def kfold_validation():
    """Perform K-Fold Cross Validation"""
    try:
        data = request.get_json()
        k_folds = data.get('k_folds', 5)  # Default 5 folds
        
        if k_folds < 2 or k_folds > 20:
            return jsonify({'error': 'K-Folds must be between 2 and 20'}), 400
        
        # Check if dataset exists
        if not DATASET_FILE.exists():
            return jsonify({'error': f'Dataset not found at {DATASET_FILE}'}), 404
        
        # Load dataset
        df = pd.read_csv(DATASET_FILE)
        print(f"[Validation] Loaded dataset with {len(df)} rows")
        
        # Preprocess
        X, y = preprocess_data(df)
        
        # Load configuration
        config = load_config()
        algorithms = get_algorithms(config)
        
        # Define scoring metrics with handling for imbalanced data
        scoring = {
            'accuracy': 'accuracy',
            'precision': 'precision_macro',  # Use macro average for imbalanced data
            'recall': 'recall_macro',
            'f1': 'f1_macro',
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
                    n_jobs=-1,
                    error_score='raise'  # Raise errors to catch them
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
                print(f"[Validation] Error in {name}: {str(e)}")
                import traceback
                traceback.print_exc()
                
                # If K-Fold fails, try with Stratified K-Fold or return error
                results[name] = {
                    'error': str(e),
                    'accuracy': {'mean': 0.0, 'std': 0.0, 'folds': []},
                    'precision': {'mean': 0.0, 'std': 0.0, 'folds': []},
                    'recall': {'mean': 0.0, 'std': 0.0, 'folds': []},
                    'f1': {'mean': 0.0, 'std': 0.0, 'folds': []},
                    'roc_auc': {'mean': 0.0, 'std': 0.0, 'folds': []},
                    'train_accuracy': {'mean': 0.0, 'std': 0.0}
                }
        
        print(f"[Validation] K-Fold Cross Validation completed")
        
        return jsonify({
            'k_folds': k_folds,
            'dataset_size': len(df),
            'results': results,
            'method': 'k_fold'
        }), 200
        
    except Exception as e:
        print(f"[Validation] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@validation_bp.route('/holdout', methods=['POST'])
def holdout_validation():
    """
    Holdout Validation (Train-Test Split)
    Chia dữ liệu thành tập train và test với tỷ lệ tùy chỉnh
    Phương pháp này phù hợp cho tất cả các thuật toán
    """
    try:
        data = request.get_json()
        test_size = data.get('test_size', 0.2)  # Mặc định 80% train, 20% test
        random_state = data.get('random_state', 42)
        
        print(f"[Validation] Starting Holdout Validation with test_size={test_size}")
        
        if not DATASET_FILE.exists():
            return jsonify({'error': 'Dataset not found'}), 404
        
        df = pd.read_csv(DATASET_FILE)
        print(f"[Validation] Loaded dataset with {len(df)} rows")
        
        # Preprocess data using the same function as K-Fold
        X, y = preprocess_data(df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=test_size, 
            random_state=random_state,
            stratify=y  # Đảm bảo tỷ lệ class giống nhau ở train và test
        )
        
        print(f"[Validation] Train samples: {len(X_train)} (Stroke: {y_train.sum()}, No stroke: {(1-y_train).sum()})")
        print(f"[Validation] Test samples: {len(X_test)} (Stroke: {y_test.sum()}, No stroke: {(1-y_test).sum()})")
        
        # Get configured algorithms
        config = load_config()
        algorithms = get_algorithms(config)
        
        # Evaluate each algorithm
        results = {}
        for name, pipeline in algorithms.items():
            print(f"[Validation] Running Holdout for {name}...")
            
            try:
                # Train
                pipeline.fit(X_train, y_train)
                
                # Predict
                y_train_pred = pipeline.predict(X_train)
                y_test_pred = pipeline.predict(X_test)
                y_test_proba = pipeline.predict_proba(X_test)[:, 1] if hasattr(pipeline, 'predict_proba') else None
                
                # Calculate metrics
                train_metrics = {
                    'accuracy': float(accuracy_score(y_train, y_train_pred)),
                    'precision': float(precision_score(y_train, y_train_pred, average='macro', zero_division=0)),
                    'recall': float(recall_score(y_train, y_train_pred, average='macro', zero_division=0)),
                    'f1': float(f1_score(y_train, y_train_pred, average='macro', zero_division=0))
                }
                
                test_metrics = {
                    'accuracy': float(accuracy_score(y_test, y_test_pred)),
                    'precision': float(precision_score(y_test, y_test_pred, average='macro', zero_division=0)),
                    'recall': float(recall_score(y_test, y_test_pred, average='macro', zero_division=0)),
                    'f1': float(f1_score(y_test, y_test_pred, average='macro', zero_division=0))
                }
                
                if y_test_proba is not None:
                    test_metrics['roc_auc'] = float(roc_auc_score(y_test, y_test_proba))
                else:
                    test_metrics['roc_auc'] = 0.0
                
                # Confusion matrix
                cm = confusion_matrix(y_test, y_test_pred)
                
                results[name] = {
                    'train_metrics': train_metrics,
                    'test_metrics': test_metrics,
                    'confusion_matrix': {
                        'tn': int(cm[0][0]),
                        'fp': int(cm[0][1]),
                        'fn': int(cm[1][0]),
                        'tp': int(cm[1][1])
                    }
                }
                
                print(f"[Validation] {name} - Test Accuracy: {test_metrics['accuracy']:.4f}, ROC-AUC: {test_metrics['roc_auc']:.4f}")
                
            except Exception as e:
                print(f"[Validation] Error in {name}: {str(e)}")
                import traceback
                traceback.print_exc()
                results[name] = {'error': str(e)}
        
        print(f"[Validation] Holdout Validation completed")
        
        return jsonify({
            'success': True,
            'results': results,
            'method': 'holdout',
            'test_size': test_size,
            'train_samples': len(X_train),
            'test_samples': len(X_test),
            'dataset_size': len(y)
        }), 200
        
    except Exception as e:
        print(f"[Validation] Error: {e}")
        import traceback
        traceback.print_exc()
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
