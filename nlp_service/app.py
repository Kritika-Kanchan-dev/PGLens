from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
import re
import json
from textblob import TextBlob
from collections import Counter

app = Flask(__name__)
CORS(app)

# Download required NLTK data when the server starts
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('punkt_tab', quiet=True)
from nltk.corpus import stopwords

# ─── PG-specific keyword categories ──────────────────────────────────────────
# These are words related to each topic that we look for in review text
TOPIC_KEYWORDS = {
    "hygiene": [
        "clean", "dirty", "hygiene", "hygienic", "mess", "messy", "dust",
        "dusty", "cockroach", "insects", "rats", "garbage", "smell", "odor",
        "bathroom", "toilet", "washroom", "stink", "filthy", "spotless"
    ],
    "food": [
        "food", "meal", "meals", "breakfast", "lunch", "dinner", "cooking",
        "taste", "tasty", "bland", "stale", "fresh", "quality", "cook",
        "kitchen", "tiffin", "diet", "veg", "non-veg", "healthy", "oil"
    ],
    "safety": [
        "safe", "safety", "security", "guard", "cctv", "camera", "lock",
        "theft", "steal", "dangerous", "unsafe", "secure", "night", "gated",
        "watchman", "keys", "entry", "gate"
    ],
    "amenities": [
        "wifi", "internet", "ac", "air conditioning", "fan", "tv", "television",
        "gym", "parking", "laundry", "washing", "hot water", "geyser", "power",
        "electricity", "water", "lift", "elevator", "bed", "mattress", "furniture"
    ],
    "management": [
        "owner", "manager", "staff", "rude", "helpful", "responsive", "complaint",
        "maintenance", "repair", "issue", "problem", "resolve", "cooperate",
        "behavior", "attitude", "management", "warden"
    ],
    "pricing": [
        "price", "rent", "expensive", "cheap", "value", "worth", "money",
        "cost", "affordable", "overpriced", "fair", "deposit", "refund", "fee"
    ],
    "location": [
        "location", "area", "nearby", "college", "market", "transport", "bus",
        "metro", "auto", "distance", "far", "close", "neighbourhood", "locality"
    ]
}

# Negative intensifiers that flip meaning
NEGATIONS = ["not", "no", "never", "don't", "doesn't", "didn't", "isn't",
             "wasn't", "can't", "won't", "nothing", "hardly", "barely"]

def clean_text(text):
    """Remove special characters and lowercase the text"""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_keywords(text, top_n=10):
    """Extract the most meaningful words from the review"""
    stop_words = set(stopwords.words('english'))
    # Add common words that don't add meaning for a PG review
    stop_words.update(['pg', 'room', 'stay', 'place', 'really', 'very',
                       'good', 'bad', 'nice', 'great', 'okay', 'also',
                       'would', 'could', 'like', 'make', 'get', 'went'])
    
    words = clean_text(text).split()
    # Keep only words longer than 3 chars and not in stop words
    keywords = [w for w in words if len(w) > 3 and w not in stop_words]
    
    # Count and return most common
    word_counts = Counter(keywords)
    return [word for word, count in word_counts.most_common(top_n)]

def detect_topics(text):
    """Detect which topics (hygiene, food, etc.) the review talks about"""
    text_lower = text.lower()
    detected = []
    
    for topic, keywords in TOPIC_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                detected.append(topic)
                break  # Found this topic, move to next
    
    return detected

def analyse_sentiment(text):
    """
    Analyse sentiment using TextBlob + negation checking.
    Returns: label (positive/negative/neutral), score (0-100)
    """
    if not text or len(text.strip()) < 5:
        return "neutral", 50
    
    # TextBlob gives polarity from -1.0 to +1.0
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    
    # Check for negation words — they often flip meaning
    words = text.lower().split()
    negation_count = sum(1 for w in words if w in NEGATIONS)
    
    # If there are many negations and polarity is positive,
    # it might be sarcastic — reduce polarity slightly
    if negation_count >= 2 and polarity > 0.2:
        polarity *= 0.6
    
    # Convert -1..+1 range to 0..100 score
    score = int((polarity + 1) * 50)
    score = max(0, min(100, score))  # Clamp to 0-100
    
    # Determine label
    if polarity > 0.1:
        label = "positive"
    elif polarity < -0.1:
        label = "negative"
    else:
        label = "neutral"
    
    return label, score

# ─── API ROUTES ───────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return {"message": "NLP Service Running 🚀"}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "NLP service running ✅"})

@app.route('/analyse', methods=['POST'])
def analyse():
    """
    Main endpoint. Receives review text, returns NLP results.
    
    Request body: { "text": "The food was really bad and wifi didn't work." }
    Response:     { "sentiment": "negative", "score": 22, "keywords": [...], "topics": [...] }
    """
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({"error": "Missing 'text' field"}), 400
    
    text = data['text']
    
    if not text or len(text.strip()) < 3:
        return jsonify({
            "sentiment": "neutral",
            "sentiment_score": 50,
            "keywords": [],
            "topics": []
        })
    
    # Run analysis
    sentiment_label, sentiment_score = analyse_sentiment(text)
    keywords = extract_keywords(text, top_n=8)
    topics = detect_topics(text)
    
    return jsonify({
        "sentiment": sentiment_label,
        "sentiment_score": sentiment_score,
        "keywords": keywords,
        "topics": topics
    })

@app.route('/analyse-batch', methods=['POST'])
def analyse_batch():
    """
    Analyse multiple reviews at once.
    Used for analysing old reviews that were submitted before NLP was set up.
    
    Request body: { "reviews": [{ "id": 1, "text": "..." }, ...] }
    """
    data = request.get_json()
    
    if not data or 'reviews' not in data:
        return jsonify({"error": "Missing 'reviews' field"}), 400
    
    results = []
    for review in data['reviews']:
        text = review.get('text', '')
        sentiment_label, sentiment_score = analyse_sentiment(text)
        keywords = extract_keywords(text, top_n=8)
        topics = detect_topics(text)
        
        results.append({
            "id": review.get('id'),
            "sentiment": sentiment_label,
            "sentiment_score": sentiment_score,
            "keywords": keywords,
            "topics": topics
        })
    
    return jsonify({"results": results})

if __name__ == '__main__':
    print("🧠 PGLens NLP Service starting on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)