from flask import Flask, render_template, request, jsonify
import joblib
import os
from preprocess import preprocess_text
from train_model import train_and_save_model

app = Flask(__name__)

# =========================
# Model Files
# =========================
MODEL_PATH = 'model.pkl'
VECTORIZER_PATH = 'vectorizer.pkl'

# =========================
# Temporary History Storage
# =========================
detection_history = []

# =========================
# Scam Keywords
# =========================
SCAM_KEYWORDS = [
    'free', 'win', 'urgent', 'click', 'offer', 'money',
    'prize', 'congratulations', 'selected', 'winner',
    'guaranteed', 'cash', 'claim', 'refund', 'account',
    'verify', 'earn', 'investment', 'lottery', 'bonus',
    'limited', 'deal', 'bitcoin', 'crypto', 'gift',
    'exclusive', 'risk-free'
]

# =========================
# Suspicious Phrases
# =========================
SUSPICIOUS_PHRASES = [
    "earn money",
    "zero investment",
    "click here",
    "limited offer",
    "claim now",
    "free cash",
    "verify account",
    "winner selected",
    "urgent response",
    "guaranteed profit",
    "risk free",
    "exclusive deal"
]

# =========================
# Load or Train Models
# =========================
def load_models():
    """
    Load model and vectorizer.
    Train them if they don't exist.
    """

    if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
        print("Model files not found. Training model now...")
        train_and_save_model()

    vectorizer = joblib.load(VECTORIZER_PATH)
    model = joblib.load(MODEL_PATH)

    return vectorizer, model

# Load models at startup

vectorizer, model = load_models()

# =========================
# Home Route
# =========================
@app.route('/')
def home():
    """
    Render home page.
    """
    return render_template(
        'index.html',
        history=detection_history[-5:]
    )

# =========================
# Prediction Route
# =========================
@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict whether message is Spam or Ham.
    """

    try:
        data = request.get_json()

        # Get user message
        message = data.get('message', '').strip()

        # Validate input
        if not message:
            return jsonify({
                'error': 'Message cannot be empty'
            }), 400

        # =========================
        # Preprocess Text
        # =========================
        transformed_message = preprocess_text(message)

        # =========================
        # Vectorize Message
        # =========================
        vectorized_message = vectorizer.transform([transformed_message])

        # =========================
        # ML Prediction
        # =========================
        prediction = model.predict(vectorized_message)[0]
        prediction_proba = model.predict_proba(vectorized_message)[0]

        # Spam probability from ML model
        spam_probability = prediction_proba[1]

        # =========================
        # Detect Scam Keywords
        # =========================
        message_lower = message.lower()

        found_keywords = [
            keyword for keyword in SCAM_KEYWORDS
            if keyword in message_lower
        ]

        # =========================
        # Detect Suspicious Phrases
        # =========================
        detected_phrases = [
            phrase for phrase in SUSPICIOUS_PHRASES
            if phrase in message_lower
        ]

        # =========================
        # Rule-Based Enhancement
        # =========================

        # Boost probability for keywords
        if len(found_keywords) >= 1:
            spam_probability += 0.15

        if len(found_keywords) >= 2:
            spam_probability += 0.20

        if len(found_keywords) >= 3:
            spam_probability += 0.25

        # Boost for suspicious phrases
        if detected_phrases:
            spam_probability += 0.20

        # Keep value between 0 and 1
        spam_probability = min(spam_probability, 1.0)

        # =========================
        # Final Prediction
        # =========================
        is_spam = bool(spam_probability > 0.5)

        # Confidence %
        if is_spam:
            confidence = float(round(spam_probability * 100, 2))
        else:
            confidence = float(round((1 - spam_probability) * 100, 2))

        # =========================
        # Save Detection History
        # =========================
        result_data = {
            'message': message,
            'is_spam': is_spam,
            'confidence': confidence,
            'keywords': found_keywords,
            'detected_phrases': detected_phrases
        }

        detection_history.append(result_data)

        # =========================
        # Return JSON Response
        # =========================
        return jsonify(result_data)

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

# =========================
# Dashboard Route
# =========================
@app.route('/dashboard')
def dashboard():

    spam_count = sum(1 for item in detection_history if item['is_spam'])
    ham_count = len(detection_history) - spam_count

    # =========================
    # FIXED: SCAM KEYWORD TRACKING
    # =========================
    keyword_counts = {}

    for item in detection_history:

        keywords = item.get('keywords', [])

        for kw in keywords:
            kw = kw.lower().strip()

            if kw:
                keyword_counts[kw] = keyword_counts.get(kw, 0) + 1


    return render_template(
        'dashboard.html',
        spam_count=spam_count,
        ham_count=ham_count,
        total_scanned=len(detection_history)
    )

# =========================
# About Route
# =========================
@app.route('/about')
def about():
    """
    About project page.
    """
    return render_template('about.html')

# =========================
# Run Flask App
# =========================
if __name__ == '__main__':
    app.run(debug=True)