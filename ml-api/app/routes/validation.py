import json
import os
import pandas as pd
import numpy as np
from flask import Blueprint, request, jsonify
from pathlib import Path
from sklearn.model_selection import cross_validate, KFold, train_test_split, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
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

def build_preprocessor(scale_features=False):
    """
    Build preprocessing pipeline (SAME as train_model.py)
    This will be used inside sklearn Pipeline to prevent data leakage
    
    Args:
        scale_features: If True, add StandardScaler for SVM (required for RBF kernel)
    """
    from sklearn.compose import ColumnTransformer
    from sklearn.impute import SimpleImputer
    from sklearn.preprocessing import OneHotEncoder, StandardScaler
    
    NUM_COLS = ['age', 'avg_glucose_level', 'bmi']
    CAT_COLS = ['gender', 'hypertension', 'heart_disease', 'ever_married',
                'work_type', 'Residence_type', 'smoking_status']
    
    # Build numeric transformer steps
    steps = [('imputer', SimpleImputer(strategy='constant', fill_value=22.0))]
    
    # Add StandardScaler for SVM (SVM requires scaled features for RBF kernel)
    if scale_features:
        steps.append(('scaler', StandardScaler()))
    
    numeric_transformer = Pipeline(steps=steps)
    
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

def get_algorithms(config=None):
    """
    Get configured algorithms wrapped in Pipelines with preprocessing
    This prevents data leakage in cross-validation
    """
    if config is None:
        config = load_config()
    
    if not config:
        # Default config (KNN, SVM, Decision Tree active)
        # IMPORTANT: These must match model_config.json and train_model.py
        config = {
            "knn": {"n_neighbors": 15, "weights": "uniform"},
            "svm": {
                "C": 0.1,  # OPTIMIZED: Softer margin (was 1.0)
                "kernel": "rbf", 
                "gamma": "0.1", 
                "class_weight": "balanced", 
                "random_state": 42, 
                "probability": True
            },
            "decision_tree": {
                "max_depth": 8, 
                "min_samples_split": 15, 
                "min_samples_leaf": 7, 
                "criterion": "gini", 
                "class_weight": "balanced", 
                "random_state": 42
            }
        }
    
    algorithms = {}
    
    # KNN
    knn_params = config.get('knn', {})
    knn_params = {k: v for k, v in knn_params.items() if v is not None}
    algorithms['KNN'] = Pipeline([
        ('preprocessor', build_preprocessor(scale_features=False)),
        ('classifier', KNeighborsClassifier(**knn_params))
    ])
    
    # SVM - IMPORTANT: Use scaled features for RBF kernel
    svm_params = config.get('svm', {})
    svm_params = {k: v for k, v in svm_params.items() if v is not None}
    if 'probability' not in svm_params:
        svm_params['probability'] = True
    algorithms['SVM'] = Pipeline([
        ('preprocessor', build_preprocessor(scale_features=True)),  # Scale for SVM
        ('classifier', SVC(**svm_params))
    ])
    
    # Decision Tree
    dt_params = config.get('decision_tree', {})
    if dt_params.get('max_features') in [None, 'null', 'None']:
        dt_params.pop('max_features', None)
    dt_params = {k: v for k, v in dt_params.items() if v is not None}
    algorithms['Decision Tree'] = Pipeline([
        ('preprocessor', build_preprocessor(scale_features=False)),
        ('classifier', DecisionTreeClassifier(**dt_params))
    ])
    
    return algorithms

def prepare_data(df):
    """
    Basic data preparation (no fitting/transformation)
    Only drop columns and select features
    """
    # Make a copy to avoid modifying original
    df = df.copy()
    
    # Drop id column if exists
    if 'id' in df.columns:
        df = df.drop('id', axis=1)
    
    # Drop rows with missing age or glucose (critical features)
    df = df.dropna(subset=['age', 'avg_glucose_level'])
    
    # Separate features and target
    if 'stroke' not in df.columns:
        raise ValueError("Dataset must contain 'stroke' column")
    
    TARGET_COL = 'stroke'
    NUM_COLS = ['age', 'avg_glucose_level', 'bmi']
    CAT_COLS = ['gender', 'hypertension', 'heart_disease', 'ever_married',
                'work_type', 'Residence_type', 'smoking_status']
    
    X = df[NUM_COLS + CAT_COLS]
    y = df[TARGET_COL]
    
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
        
        # Prepare data (basic cleaning only, no fitting)
        X, y = prepare_data(df)
        
        # Load configuration
        config = load_config()
        algorithms = get_algorithms(config)  # Returns Pipelines with preprocessing
        
        # Define scoring metrics for binary classification
        # For imbalanced data, we use binary (positive class only) not macro average
        scoring = {
            'accuracy': 'accuracy',
            'precision': 'precision',  # Binary: only positive class (stroke)
            'recall': 'recall',        # Binary: only positive class (stroke)
            'f1': 'f1',                # Binary: only positive class (stroke)
            'roc_auc': 'roc_auc',
            'neg_mean_absolute_error': 'neg_mean_absolute_error',  # MAE (negated)
            'neg_root_mean_squared_error': 'neg_root_mean_squared_error'  # RMSE (negated)
        }
        
        # Perform K-Fold Cross Validation for each algorithm
        results = {}
        kfold = StratifiedKFold(n_splits=k_folds, shuffle=True, random_state=42)
        
        for name, pipeline in algorithms.items():  # Use pipeline
            print(f"[Validation] Running K-Fold for {name}...")
            
            try:
                cv_results = cross_validate(
                    pipeline, X, y,  # Pipeline will handle preprocessing per fold
                    cv=kfold,
                    scoring=scoring,
                    return_train_score=True,
                    n_jobs=-1,
                    error_score='raise'  # Raise errors to catch them
                )
                
                # Calculate confusion matrix across all folds
                y_true_all = []
                y_pred_all = []
                for train_idx, test_idx in kfold.split(X, y):
                    X_train_fold = X.iloc[train_idx] if hasattr(X, 'iloc') else X[train_idx]
                    X_test_fold = X.iloc[test_idx] if hasattr(X, 'iloc') else X[test_idx]
                    y_train_fold = y.iloc[train_idx] if hasattr(y, 'iloc') else y[train_idx]
                    y_test_fold = y.iloc[test_idx] if hasattr(y, 'iloc') else y[test_idx]
                    
                    # Clone and fit pipeline for this fold
                    from sklearn.base import clone
                    fold_pipeline = clone(pipeline)
                    fold_pipeline.fit(X_train_fold, y_train_fold)
                    y_pred_fold = fold_pipeline.predict(X_test_fold)
                    
                    y_true_all.extend(y_test_fold)
                    y_pred_all.extend(y_pred_fold)
                
                # Calculate overall confusion matrix
                cm = confusion_matrix(y_true_all, y_pred_all)
                
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
                    'mae': {
                        'mean': float(-np.mean(cv_results['test_neg_mean_absolute_error'])),  # Convert back to positive
                        'std': float(np.std(cv_results['test_neg_mean_absolute_error'])),
                        'folds': [float(-x) for x in cv_results['test_neg_mean_absolute_error']]
                    },
                    'rmse': {
                        'mean': float(-np.mean(cv_results['test_neg_root_mean_squared_error'])),  # Convert back to positive
                        'std': float(np.std(cv_results['test_neg_root_mean_squared_error'])),
                        'folds': [float(-x) for x in cv_results['test_neg_root_mean_squared_error']]
                    },
                    'train_accuracy': {
                        'mean': float(np.mean(cv_results['train_accuracy'])),
                        'std': float(np.std(cv_results['train_accuracy']))
                    },
                    'confusion_matrix': {
                        'tn': int(cm[0][0]),
                        'fp': int(cm[0][1]),
                        'fn': int(cm[1][0]),
                        'tp': int(cm[1][1])
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
        
        # Prepare data (basic cleaning only)
        X, y = prepare_data(df)
        
        # Split data (70% train, 30% test)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=test_size if test_size else 0.30,  # Mặc định 30% test
            random_state=random_state,
            stratify=y  # Đảm bảo tỷ lệ class giống nhau ở train và test
        )
        
        print(f"[Validation] Train samples: {len(X_train)} (Stroke: {y_train.sum()}, No stroke: {(1-y_train).sum()})")
        print(f"[Validation] Test samples: {len(X_test)} (Stroke: {y_test.sum()}, No stroke: {(1-y_test).sum()})")
        
        # Get configured algorithms (Pipelines with preprocessing)
        config = load_config()
        algorithms = get_algorithms(config)
        
        # Evaluate each algorithm
        results = {}
        for name, pipeline in algorithms.items():  # Use pipeline
            print(f"[Validation] Running Holdout for {name}...")
            
            try:
                # Train
                pipeline.fit(X_train, y_train)
                
                # Predict
                y_train_pred = pipeline.predict(X_train)
                y_test_pred = pipeline.predict(X_test)
                y_test_proba = pipeline.predict_proba(X_test)[:, 1] if hasattr(pipeline, 'predict_proba') else None
                
                # Calculate metrics (binary classification - positive class only)
                from sklearn.metrics import mean_absolute_error, mean_squared_error
                
                train_metrics = {
                    'accuracy': float(accuracy_score(y_train, y_train_pred)),
                    'precision': float(precision_score(y_train, y_train_pred, zero_division=0)),
                    'recall': float(recall_score(y_train, y_train_pred, zero_division=0)),
                    'f1': float(f1_score(y_train, y_train_pred, zero_division=0)),
                    'mae': float(mean_absolute_error(y_train, y_train_pred)),
                    'rmse': float(np.sqrt(mean_squared_error(y_train, y_train_pred)))
                }
                
                test_metrics = {
                    'accuracy': float(accuracy_score(y_test, y_test_pred)),
                    'precision': float(precision_score(y_test, y_test_pred, zero_division=0)),
                    'recall': float(recall_score(y_test, y_test_pred, zero_division=0)),
                    'f1': float(f1_score(y_test, y_test_pred, zero_division=0)),
                    'mae': float(mean_absolute_error(y_test, y_test_pred)),
                    'rmse': float(np.sqrt(mean_squared_error(y_test, y_test_pred)))
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
