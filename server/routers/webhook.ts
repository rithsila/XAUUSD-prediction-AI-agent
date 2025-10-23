import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getApiKey, updateApiKeyUsage, getLatestPrediction, getLatestNews } from "../db";
import type { NewsEvent } from "../../drizzle/schema";

/**
 * Webhook Router
 * Public endpoints for TradingView and MT5 to retrieve predictions
 */
export const webhookRouter = router({
  /**
   * Get latest prediction (for TradingView/MT5 webhooks)
   * Requires API key authentication
   */
  getPrediction: publicProcedure
    .input(
      z.object({
        apiKey: z.string(),
        horizon: z.enum(["3m", "5m", "15m", "1H", "4H"]).optional(),
      })
    )
    .query(async ({ input }) => {
      // Validate API key
      const key = await getApiKey(input.apiKey);
      
      if (!key) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid API key",
        });
      }

      if (key.status === "revoked") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "API key has been revoked",
        });
      }

      if (key.expiresAt && key.expiresAt < new Date()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "API key has expired",
        });
      }

      // Update usage statistics
      await updateApiKeyUsage(input.apiKey);

      // Get latest prediction
      const prediction = await getLatestPrediction(input.horizon);

      if (!prediction) {
        return {
          status: "no_data" as const,
          message: "No predictions available",
        };
      }

      return {
        status: "ok" as const,
        data: {
          symbol: prediction.symbol,
          timestamp: prediction.timestamp.toISOString(),
          horizon: prediction.horizon,
          direction: prediction.direction,
          confidence: prediction.confidence,
          range: {
            min: prediction.rangeMin,
            max: prediction.rangeMax,
          },
          rationale: prediction.rationale as string[] | null,
        },
        meta: {
          apiKeyType: key.type,
          username: key.username,
        },
      };
    }),

  /**
   * Get latest news sentiment (for TradingView/MT5 webhooks)
   * Requires API key authentication
   */
  getNewsSentiment: publicProcedure
    .input(
      z.object({
        apiKey: z.string(),
        limit: z.number().min(1).max(20).optional(),
      })
    )
    .query(async ({ input }) => {
      // Validate API key
      const key = await getApiKey(input.apiKey);
      
      if (!key) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid API key",
        });
      }

      if (key.status === "revoked") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "API key has been revoked",
        });
      }

      if (key.expiresAt && key.expiresAt < new Date()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "API key has expired",
        });
      }

      // Update usage statistics
      await updateApiKeyUsage(input.apiKey);

      // Get latest news
      const news = await getLatestNews(input.limit || 10);

      if (news.length === 0) {
        return {
          status: "no_data" as const,
          message: "No news available",
        };
      }

      return {
        status: "ok" as const,
        data: news.map((item: NewsEvent) => ({
          source: item.source,
          headline: item.headline,
          timestamp: item.timestamp.toISOString(),
          sentiment: {
            polarity: item.sentimentPolarity,
            score: item.sentimentScore,
            topic: item.topic,
          },
        })),
        meta: {
          apiKeyType: key.type,
          username: key.username,
        },
      };
    }),

  /**
   * Combined endpoint - Get prediction + news sentiment
   * Useful for MT5 EAs that need both data points
   */
  getMarketData: publicProcedure
    .input(
      z.object({
        apiKey: z.string(),
        horizon: z.enum(["3m", "5m", "15m", "1H", "4H"]).optional(),
        newsLimit: z.number().min(1).max(20).optional(),
      })
    )
    .query(async ({ input }) => {
      // Validate API key
      const key = await getApiKey(input.apiKey);
      
      if (!key) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid API key",
        });
      }

      if (key.status === "revoked") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "API key has been revoked",
        });
      }

      if (key.expiresAt && key.expiresAt < new Date()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "API key has expired",
        });
      }

      // Update usage statistics
      await updateApiKeyUsage(input.apiKey);

      // Get both prediction and news
      const [prediction, news] = await Promise.all([
        getLatestPrediction(input.horizon),
        getLatestNews(input.newsLimit || 5),
      ]);

      return {
        status: "ok" as const,
        prediction: prediction ? {
          symbol: prediction.symbol,
          timestamp: prediction.timestamp.toISOString(),
          horizon: prediction.horizon,
          direction: prediction.direction,
          confidence: prediction.confidence,
          range: {
            min: prediction.rangeMin,
            max: prediction.rangeMax,
          },
          rationale: prediction.rationale as string[] | null,
        } : null,
        news: news.map((item: NewsEvent) => ({
          source: item.source,
          headline: item.headline,
          timestamp: item.timestamp.toISOString(),
          sentiment: {
            polarity: item.sentimentPolarity,
            score: item.sentimentScore,
            topic: item.topic,
          },
        })),
        meta: {
          apiKeyType: key.type,
          username: key.username,
          timestamp: new Date().toISOString(),
        },
      };
    }),
});

