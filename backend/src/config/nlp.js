// backend/src/config/nlp.js
// Helper that calls our Python NLP microservice

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:5001';

/**
 * Sends review text to the Python NLP service and returns analysis results.
 * If the service is down or fails, returns safe default values so the
 * review submission still works.
 *
 * @param {string} text - The review text written by the student
 * @returns {{ sentiment, sentiment_score, keywords, topics }}
 */
const analyseReviewText = async (text) => {
  // If no text provided, return neutral defaults
  if (!text || text.trim().length < 5) {
    return {
      sentiment: 'neutral',
      sentiment_score: 50,
      keywords: [],
      topics: []
    };
  }

  try {
    const response = await fetch(`${NLP_SERVICE_URL}/analyse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000)  // 5 second timeout — don't block forever
    });

    if (!response.ok) {
      throw new Error(`NLP service returned ${response.status}`);
    }

    const data = await response.json();
    return {
      sentiment: data.sentiment || 'neutral',
      sentiment_score: data.sentiment_score ?? 50,
      keywords: data.keywords || [],
      topics: data.topics || []
    };

  } catch (err) {
    // NLP service is down — log it but don't crash review submission
    console.warn('⚠️  NLP service unavailable, skipping analysis:', err.message);
    return {
      sentiment: 'neutral',
      sentiment_score: 50,
      keywords: [],
      topics: []
    };
  }
};

module.exports = { analyseReviewText };