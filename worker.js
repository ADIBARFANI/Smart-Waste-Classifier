/**
 * Cloudflare Worker – Smart Waste Classifier Proxy
 * Hides the Gemini API key from the frontend.
 *
 * How to deploy:
 * 1. Go to https://workers.cloudflare.com
 * 2. Create a new Worker
 * 3. Paste this code
 * 4. Add environment variable: GEMINI_API_KEY = your_key_here
 * 5. Deploy and copy the Worker URL
 */

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const CLASSIFICATION_PROMPT = `You are an expert waste classification AI for a recycling app.
Analyze the image and identify the MAIN waste object.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):

{
  "object_name": "string, object name in English",
  "confidence": 0-100 integer,
  "category": "one of: Organic Waste, Paper & Cardboard, Plastic, Glass, Metal, E-Waste, Hazardous Waste, Textile, Rubber, Composite/Mixed, Medical Waste, Residual/Other",
  "bin_color": "one of: Green, Blue, Yellow, Red, Grey",
  "material": "specific material e.g. PET plastic, cardboard, aluminum",
  "is_recyclable": true or false,
  "preparation_tips": ["tip 1", "tip 2", "tip 3"],
  "fun_fact": "one short accurate sentence about recycling this material",
  "recycling_ideas": ["idea 1", "idea 2", "idea 3"],
  "safety_note": null or a short safety warning if hazardous/sharp/medical
}

Rules:
- Focus on the most dominant clearly visible object.
- Bin colors: Organic=Green, Paper/Cardboard=Blue, Plastic/Metal/Glass=Yellow, Hazardous/E-Waste/Medical=Red, Residual/Textile/Mixed=Grey.
- Give exactly 3 short practical preparation tips.
- If hazardous, medical, or sharp: set safety_note and replace upcycling ideas with safe disposal advice.
- Never suggest burning waste or pouring chemicals down drains.
- Be honest with confidence score. Use lower confidence if image is unclear.
- Output ONLY the JSON. No other text.`;

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders()
      });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
      const body = await request.json();
      const { image } = body;

      if (!image) {
        return jsonResponse({ error: 'Missing image data' }, 400);
      }

      // Remove data URL prefix if present
      const base64Data = image.includes(',') ? image.split(',')[1] : image;

      const payload = {
        contents: [
          {
            parts: [
              { text: CLASSIFICATION_PROMPT },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      };

      const geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error('Gemini error:', errText);
        return jsonResponse({ error: 'AI service error', detail: geminiRes.status }, 502);
      }

      const data = await geminiRes.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        return jsonResponse({ error: 'Empty AI response' }, 502);
      }

      // Clean possible markdown
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const result = JSON.parse(cleaned);

      // Basic validation
      if (!result.object_name || !result.category) {
        return jsonResponse({ error: 'Invalid AI response structure' }, 502);
      }

      result.confidence = Math.max(0, Math.min(100, parseInt(result.confidence) || 70));

      return jsonResponse(result);

    } catch (err) {
      console.error(err);
      return jsonResponse({ error: 'Internal server error', message: err.message }, 500);
    }
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders()
    }
  });
}
