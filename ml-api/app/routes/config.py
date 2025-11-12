import json
import os
import subprocess
import threading
from flask import Blueprint, request, jsonify
from pathlib import Path

config_bp = Blueprint('config', __name__)

CONFIG_FILE = Path('app/config/model_config.json')

# Global variable to track training status
training_status = {
    'is_training': False,
    'progress': 0,
    'message': '',
    'error': None
}

@config_bp.route('/config', methods=['GET'])
def get_config():
    """Get current model configuration"""
    try:
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
            return jsonify(config), 200
        else:
            return jsonify({'error': 'Config file not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@config_bp.route('/config', methods=['PUT'])
def update_config():
    """Update model configuration"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Ensure directory exists
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        # Save config
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        return jsonify({
            'message': 'Configuration updated successfully',
            'config': data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@config_bp.route('/config/reset', methods=['POST'])
def reset_config():
    """Reset configuration to defaults"""
    try:
        default_config = {
            "logistic_regression": {
                "max_iter": 1000,
                "solver": "liblinear",
                "class_weight": "balanced",
                "C": 1.0,
                "penalty": "l2",
                "random_state": 42
            },
            "random_forest": {
                "n_estimators": 300,
                "max_depth": None,
                "min_samples_split": 2,
                "min_samples_leaf": 1,
                "max_features": "sqrt",
                "class_weight": "balanced",
                "random_state": 42
            },
            "gradient_boosting": {
                "n_estimators": 100,
                "learning_rate": 0.1,
                "max_depth": 3,
                "min_samples_split": 2,
                "min_samples_leaf": 1,
                "subsample": 1.0,
                "random_state": 42
            },
            "knn": {
                "n_neighbors": 15,
                "weights": "uniform",
                "algorithm": "auto",
                "leaf_size": 30,
                "p": 2,
                "metric": "minkowski"
            }
        }
        
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, indent=2, ensure_ascii=False)
        
        return jsonify({
            'message': 'Configuration reset to defaults',
            'config': default_config
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@config_bp.route('/metrics', methods=['GET'])
def get_metrics():
    """Get training metrics for all models"""
    try:
        metrics_file = Path('app/models/metrics.json')
        if metrics_file.exists():
            with open(metrics_file, 'r', encoding='utf-8') as f:
                metrics = json.load(f)
            return jsonify(metrics), 200
        else:
            return jsonify({'error': 'Metrics file not found. Please train models first.'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def run_training():
    """Background thread function to run training"""
    global training_status
    try:
        training_status['is_training'] = True
        training_status['progress'] = 10
        training_status['message'] = 'Bắt đầu training models...'
        training_status['error'] = None
        
        # Run training script
        training_status['progress'] = 30
        training_status['message'] = 'Đang training các thuật toán ML...'
        
        result = subprocess.run(
            ['python', 'train_model.py'],
            cwd=os.getcwd(),
            capture_output=True,
            text=True,
            timeout=600  # 10 minutes timeout
        )
        
        if result.returncode == 0:
            training_status['progress'] = 100
            training_status['message'] = 'Training hoàn tất thành công!'
            training_status['error'] = None
        else:
            training_status['progress'] = 0
            training_status['message'] = 'Training thất bại'
            training_status['error'] = result.stderr or 'Unknown error'
            
    except subprocess.TimeoutExpired:
        training_status['progress'] = 0
        training_status['message'] = 'Training timeout'
        training_status['error'] = 'Training took too long (>10 minutes)'
    except Exception as e:
        training_status['progress'] = 0
        training_status['message'] = 'Training lỗi'
        training_status['error'] = str(e)
    finally:
        training_status['is_training'] = False

@config_bp.route('/train', methods=['POST'])
def train_models():
    """Trigger model training in background"""
    global training_status
    
    if training_status['is_training']:
        return jsonify({
            'error': 'Training is already in progress',
            'status': training_status
        }), 400
    
    # Start training in background thread
    thread = threading.Thread(target=run_training)
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'message': 'Training started',
        'status': training_status
    }), 202

@config_bp.route('/train/status', methods=['GET'])
def get_training_status():
    """Get current training status"""
    return jsonify(training_status), 200

