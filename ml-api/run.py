import os
from dotenv import load_dotenv
from app import create_app

# Load environment variables from .env if present
load_dotenv()

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_DEBUG', '1') == '1')
