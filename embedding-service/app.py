from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configure rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Load model with error handling
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    raise

MAX_TEXT_LENGTH = 5000

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "timestamp": time.time()
    })

@app.route('/embed', methods=['POST'])
@limiter.limit("10 per minute")
def embed():
    start_time = time.time()
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        text = data.get("text", "")
        if not text:
            return jsonify({"error": "Missing 'text' field"}), 400

        if len(text) > MAX_TEXT_LENGTH:
            return jsonify({
                "error": f"Input text too long. Maximum length is {MAX_TEXT_LENGTH} characters"
            }), 400

        embedding = model.encode(text).tolist()
        
        # Log successful request
        logger.info(f"Successfully generated embedding for text of length {len(text)}")
        
        return jsonify({
            "embedding": embedding,
            "processing_time": time.time() - start_time
        })

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=6000, debug=False)

