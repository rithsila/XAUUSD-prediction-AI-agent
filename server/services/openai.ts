import OpenAI from "openai";

export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Set it in your environment to use AI features."
    );
  }
  return new OpenAI({ apiKey, baseURL: "https://api.openai.com/v1" });
}

export interface PredictionRequest {
  symbol: string;
  horizon: string;
  marketContext?: {
    currentPrice?: number;
    dxy?: number;
    yields?: number;
  };
  newsContext?: string[];
  technicalContext?: {
    adx?: number;
    atr?: number;
    regime?: string;
  };
}

export interface PredictionResponse {
  direction: "bull" | "bear" | "neutral";
  confidence: number;
  range: {
    min: number;
    max: number;
  };
  rationale: string[];
}

export interface SentimentRequest {
  headline: string;
  body?: string;
}

export interface SentimentResponse {
  polarity: number; // -1 to 1
  score: number; // 0-100
  topic: "policy" | "inflation" | "geopolitics" | "other";
}

/**
 * Generate XAUUSD prediction using OpenAI GPT-4
 */
export async function generatePrediction(
  request: PredictionRequest
): Promise<PredictionResponse> {
  const systemPrompt = `You are an expert XAUUSD (Gold) market analyst with deep knowledge of:
- Technical analysis (ADX, ATR, trend/range regimes)
- Fundamental drivers (DXY, real yields, Fed policy, inflation, geopolitics)
- Market sentiment and news impact
- Multi-timeframe analysis

Your task is to provide actionable trading predictions with clear rationale.`;

  const userPrompt = `Analyze XAUUSD for ${request.horizon} timeframe:

Market Context:
${
  request.marketContext
    ? `- Current Price: ${request.marketContext.currentPrice}
- DXY: ${request.marketContext.dxy}
- US10Y Yields: ${request.marketContext.yields}`
    : "- No market data provided"
}

Technical Context:
${
  request.technicalContext
    ? `- ADX: ${request.technicalContext.adx} (${request.technicalContext.regime} regime)
- ATR: ${request.technicalContext.atr}`
    : "- No technical data provided"
}

Recent News:
${request.newsContext && request.newsContext.length > 0 ? request.newsContext.join("\n") : "- No recent news"}

Provide a prediction in JSON format:
{
  "direction": "bull" | "bear" | "neutral",
  "confidence": 0-100,
  "range": {
    "min": <price in pips from current>,
    "max": <price in pips from current>
  },
  "rationale": ["driver-1", "driver-2", "driver-3"]
}

Consider:
1. Direction: Overall bias based on fundamentals + technicals
2. Confidence: How strong is the signal (0-100)
3. Range: Expected price movement in pips
4. Rationale: Top 3-5 key drivers (be specific and concise)`;

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const prediction = JSON.parse(content) as PredictionResponse;

    // Validate response
    if (!["bull", "bear", "neutral"].includes(prediction.direction)) {
      throw new Error("Invalid direction in prediction");
    }
    if (prediction.confidence < 0 || prediction.confidence > 100) {
      throw new Error("Invalid confidence score");
    }

    return prediction;
  } catch (error) {
    console.error("[OpenAI] Prediction generation failed:", error);
    throw error;
  }
}

/**
 * Analyze news sentiment using OpenAI
 */
export async function analyzeSentiment(
  request: SentimentRequest
): Promise<SentimentResponse> {
  const systemPrompt = `You are a financial news sentiment analyzer specializing in commodities and forex markets.
Analyze news for impact on XAUUSD (Gold) trading.

Topics:
- policy: Central bank decisions, monetary policy, Fed/ECB communications
- inflation: CPI, PPI, inflation expectations, purchasing power
- geopolitics: Wars, conflicts, sanctions, political instability
- other: General economic news, market sentiment`;

  const userPrompt = `Analyze this news for XAUUSD trading impact:

Headline: ${request.headline}
${request.body ? `Body: ${request.body}` : ""}

Provide sentiment analysis in JSON format:
{
  "polarity": -1 to 1 (negative to positive for gold),
  "score": 0-100 (intensity/importance),
  "topic": "policy" | "inflation" | "geopolitics" | "other"
}

Consider:
- Polarity: How bullish/bearish is this for gold? (hawkish Fed = negative, geopolitical risk = positive)
- Score: How significant is this news? (0=minor, 100=major market mover)
- Topic: Primary category`;

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 500,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const sentiment = JSON.parse(content) as SentimentResponse;

    // Validate response
    if (sentiment.polarity < -1 || sentiment.polarity > 1) {
      throw new Error("Invalid polarity value");
    }
    if (sentiment.score < 0 || sentiment.score > 100) {
      throw new Error("Invalid score value");
    }
    if (
      !["policy", "inflation", "geopolitics", "other"].includes(sentiment.topic)
    ) {
      throw new Error("Invalid topic");
    }

    return sentiment;
  } catch (error) {
    console.error("[OpenAI] Sentiment analysis failed:", error);
    throw error;
  }
}
