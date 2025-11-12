import json
import os
from flask import Blueprint, request, jsonify
from pathlib import Path

config_bp = Blueprint('config', __name__)

CONFIG_FILE = Path('app/config/model_config.json')

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
