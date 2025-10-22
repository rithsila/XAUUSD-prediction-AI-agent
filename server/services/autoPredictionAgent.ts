import OpenAI from "openai";
import * as db from "../db";
import { nanoid } from "nanoid";

export interface NewsAnalysisResult {
  articleId: string;
  goldImpact: "bullish" | "bearish" | "neutral" | "unknown";
  impactScore: number; // 0-100
  sentiment: number; // -100 to 100
  summary: string;
  reasoning: string[];
}

export interface AutoPredictionResult {
  predictionId: string;
  direction: "bull" | "bear" | "neutral";
  confidence: number;
  rangeMin: number;
  rangeMax: number;
  rationale: string[];
  newsArticleIds: string[];
}

/**
 * Analyze a single news article for gold market impact using AI
 */
export async function analyzeNewsArticle(article: {
  id: string;
  title: string;
  content?: string;
  author?: string;
  publishedAt?: Date;
}): Promise<NewsAnalysisResult> {
  console.log(`[AutoPredictionAgent] Analyzing article: ${article.title}`);

  try {
    const prompt = `You are a gold market analyst. Analyze the following news article and determine its impact on gold (XAUUSD) prices.

Article Title: ${article.title}
${article.content ? `Content: ${article.content}` : ""}
${article.author ? `Author: ${article.author}` : ""}

Provide your analysis in the following JSON format:
{
  "goldImpact": "bullish" | "bearish" | "neutral" | "unknown",
  "impactScore": <number 0-100, where 100 is maximum impact>,
  "sentiment": <number -100 to 100, where -100 is very bearish, 100 is very bullish>,
  "summary": "<brief 1-2 sentence summary>",
  "reasoning": ["<reason 1>", "<reason 2>", "<reason 3>"]
}

Consider factors like:
- Fed policy and interest rates (higher rates = bearish for gold)
- Dollar strength (stronger dollar = bearish for gold)
- Inflation expectations (higher inflation = bullish for gold)
- Geopolitical tensions (increased tensions = bullish for gold)
- Central bank gold purchases (bullish for gold)
- Economic uncertainty (bullish for gold)`;

    // Initialize OpenAI client using environment variable
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://api.openai.com/v1",
    });

    // Use OpenAI chat completions with structured JSON output
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert gold market analyst. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 800,
    });

    const content = completion.choices[0].message.content;
    const contentStr = typeof content === "string" ? content : "{}";
    const analysis = JSON.parse(contentStr);

    return {
      articleId: article.id,
      goldImpact: analysis.goldImpact || "unknown",
      impactScore: Math.min(100, Math.max(0, analysis.impactScore || 0)),
      sentiment: Math.min(100, Math.max(-100, analysis.sentiment || 0)),
      summary: analysis.summary || "No summary available",
      reasoning: Array.isArray(analysis.reasoning) ? analysis.reasoning : [],
    };
  } catch (error) {
    console.error(
      `[AutoPredictionAgent] Error analyzing article ${article.id}:`,
      error
    );

    // Return neutral analysis on error
    return {
      articleId: article.id,
      goldImpact: "unknown",
      impactScore: 0,
      sentiment: 0,
      summary: "Analysis failed",
      reasoning: ["Error analyzing article"],
    };
  }
}

/**
 * Generate prediction based on multiple analyzed news articles
 */
export async function generatePredictionFromNews(
  analyses: NewsAnalysisResult[],
  horizon: string = "1H"
): Promise<AutoPredictionResult | null> {
  if (analyses.length === 0) {
    console.log(
      "[AutoPredictionAgent] No analyses provided, skipping prediction"
    );
    return null;
  }

  console.log(
    `[AutoPredictionAgent] Generating prediction from ${analyses.length} news analyses`
  );

  try {
    // Calculate aggregate sentiment and impact
    const totalImpact = analyses.reduce((sum, a) => sum + a.impactScore, 0);
    const avgImpact = totalImpact / analyses.length;

    const weightedSentiment =
      analyses.reduce((sum, a) => {
        return sum + (a.sentiment * a.impactScore) / 100;
      }, 0) / analyses.length;

    // Count bullish vs bearish signals
    const bullishCount = analyses.filter(
      a => a.goldImpact === "bullish"
    ).length;
    const bearishCount = analyses.filter(
      a => a.goldImpact === "bearish"
    ).length;

    // Determine direction
    let direction: "bull" | "bear" | "neutral";
    if (bullishCount > bearishCount && weightedSentiment > 20) {
      direction = "bull";
    } else if (bearishCount > bullishCount && weightedSentiment < -20) {
      direction = "bear";
    } else {
      direction = "neutral";
    }

    // Calculate confidence based on consensus
    const totalSignals = bullishCount + bearishCount;
    const consensus =
      totalSignals > 0
        ? Math.max(bullishCount, bearishCount) / totalSignals
        : 0.5;
    const confidence = Math.round(Math.min(95, Math.max(50, consensus * 100)));

    // Determine price range based on impact
    const baseRange = avgImpact > 70 ? 40 : avgImpact > 50 ? 25 : 15;
    const rangeMin =
      direction === "bear" ? -baseRange - 10 : direction === "bull" ? 5 : -10;
    const rangeMax =
      direction === "bear" ? -5 : direction === "bull" ? baseRange + 10 : 10;

    // Compile rationale from top analyses
    const topAnalyses = analyses
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 3);

    const rationale = topAnalyses.flatMap(a => a.reasoning).slice(0, 5);

    // Create prediction
    const predictionId = nanoid();

    await db.createPrediction({
      id: predictionId,
      symbol: "XAUUSD",
      timestamp: new Date(),
      horizon,
      direction,
      confidence,
      rangeMin,
      rangeMax,
      rationale,
      technicalContext: {
        regime: "news-driven",
      },
    });

    console.log(
      `[AutoPredictionAgent] Created prediction ${predictionId}: ${direction} (${confidence}% confidence)`
    );

    return {
      predictionId,
      direction,
      confidence,
      rangeMin,
      rangeMax,
      rationale,
      newsArticleIds: analyses.map(a => a.articleId),
    };
  } catch (error) {
    console.error("[AutoPredictionAgent] Error generating prediction:", error);
    return null;
  }
}

/**
 * Run full automated analysis cycle:
 * 1. Get unanalyzed articles
 * 2. Analyze each with AI
 * 3. Generate prediction if enough high-impact news
 * 4. Update article records
 */
export async function runAutomatedAnalysis(): Promise<{
  articlesAnalyzed: number;
  predictionGenerated: boolean;
  predictionId?: string;
}> {
  console.log("[AutoPredictionAgent] Starting automated analysis cycle");

  try {
    // Get unanalyzed articles
    const articles = await db.getUnanalyzedArticles(20);

    if (articles.length === 0) {
      console.log("[AutoPredictionAgent] No unanalyzed articles found");
      return {
        articlesAnalyzed: 0,
        predictionGenerated: false,
      };
    }

    console.log(
      `[AutoPredictionAgent] Found ${articles.length} unanalyzed articles`
    );

    // Analyze each article
    const analyses: NewsAnalysisResult[] = [];

    for (const article of articles) {
      const analysis = await analyzeNewsArticle({
        id: article.id,
        title: article.title,
        content: article.content || undefined,
        author: article.author || undefined,
        publishedAt: article.publishedAt || undefined,
      });

      analyses.push(analysis);

      // Update article with analysis
      await db.updateArticleAnalysis(article.id, {
        analyzed: true,
        goldImpact: analysis.goldImpact,
        impactScore: analysis.impactScore,
        sentiment: analysis.sentiment,
        summary: analysis.summary,
      });
    }

    // Filter high-impact analyses
    const highImpactAnalyses = analyses.filter(a => a.impactScore >= 50);

    if (highImpactAnalyses.length >= 2) {
      // Generate prediction from high-impact news
      const prediction = await generatePredictionFromNews(
        highImpactAnalyses,
        "1H"
      );

      if (prediction) {
        // Link articles to prediction
        for (const analysis of highImpactAnalyses) {
          await db.updateArticleAnalysis(analysis.articleId, {
            analyzed: true,
            predictionId: prediction.predictionId,
          });
        }

        return {
          articlesAnalyzed: articles.length,
          predictionGenerated: true,
          predictionId: prediction.predictionId,
        };
      }
    }

    return {
      articlesAnalyzed: articles.length,
      predictionGenerated: false,
    };
  } catch (error) {
    console.error("[AutoPredictionAgent] Error in automated analysis:", error);
    throw error;
  }
}
