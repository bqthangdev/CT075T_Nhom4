import os
from flask import Flask
from flask_cors import CORS


def create_app():
    app = Flask(__name__)

    # Config
    app.config['ENV'] = os.getenv('FLASK_ENV', 'development')
    app.config['API_VERSION'] = os.getenv('API_VERSION', 'v1')
    app.config['CORS_ORIGIN'] = os.getenv('CORS_ORIGIN', 'http://localhost:3000')

    # CORS
    CORS(app, resources={r"/*": {"origins": app.config['CORS_ORIGIN']}})

    # Blueprints
    from .routes.predictions import predictions_bp
    from .routes.config import config_bp
    from .routes.validation import validation_bp

    app.register_blueprint(predictions_bp, url_prefix=f"/api/{app.config['API_VERSION']}/predictions")
    app.register_blueprint(config_bp, url_prefix=f"/api/{app.config['API_VERSION']}")
    app.register_blueprint(validation_bp, url_prefix=f"/api/{app.config['API_VERSION']}/validation")

    # Health check
    @app.get('/health')
    def health():
        return {
            'status': 'healthy',
            'timestamp': __import__('datetime').datetime.utcnow().isoformat() + 'Z'
        }

    @app.get('/')
    def root():
        return {
            'message': 'Stroke Prediction ML API (Flask)',
            'version': app.config['API_VERSION'],
            'status': 'running'
        }

    return app
