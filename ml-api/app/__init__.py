import os
from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


def create_app():
    app = Flask(__name__)

    # Config
    app.config['ENV'] = os.getenv('FLASK_ENV', 'development')
    app.config['API_VERSION'] = os.getenv('API_VERSION', 'v1')
    # Accept single origin, comma-separated list, or '*'
    cors_origin_env = os.getenv('CORS_ORIGIN', 'http://localhost:3000')
    cors_origins = [o.strip() for o in cors_origin_env.split(',')] if cors_origin_env != '*' else '*'
    app.config['CORS_ORIGIN'] = cors_origins

    # CORS
    CORS(app, resources={r"/*": {"origins": app.config['CORS_ORIGIN'], "supports_credentials": True}})

    # Rate Limiting (no global limits, only per-endpoint limits)
    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=[],
        storage_uri="memory://",
    )
    app.limiter = limiter

    # Blueprints
    from .routes.predictions import predictions_bp
    from .routes.config import config_bp
    from .routes.validation import validation_bp
    from .routes.report import report_bp

    app.register_blueprint(predictions_bp, url_prefix=f"/api/{app.config['API_VERSION']}/predictions")
    app.register_blueprint(config_bp, url_prefix=f"/api/{app.config['API_VERSION']}")
    app.register_blueprint(validation_bp, url_prefix=f"/api/{app.config['API_VERSION']}/validation")
    app.register_blueprint(report_bp, url_prefix=f"/api/{app.config['API_VERSION']}/report")

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
