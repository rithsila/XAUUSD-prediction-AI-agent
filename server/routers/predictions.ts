import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { createPrediction, getLatestPrediction, getPredictionHistory } from "../db";
import { generatePrediction } from "../services/openai";
import { randomUUID } from "crypto";

export const predictionsRouter = router({
  /**
   * Generate a new XAUUSD prediction
   */
  generate: publicProcedure
    .input(
      z.object({
        symbol: z.string().default("XAUUSD"),
        horizon: z.enum(["3m", "5m", "15m", "1H", "4H"]),
        marketContext: z
          .object({
            currentPrice: z.number().optional(),
            dxy: z.number().optional(),
            yields: z.number().optional(),
          })
          .optional(),
        newsContext: z.array(z.string()).optional(),
        technicalContext: z
          .object({
            adx: z.number().optional(),
            atr: z.number().optional(),
            regime: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Generate prediction using OpenAI
        const prediction = await generatePrediction({
          symbol: input.symbol,
          horizon: input.horizon,
          marketContext: input.marketContext,
          newsContext: input.newsContext,
          technicalContext: input.technicalContext,
        });

        // Save to database
        const predictionRecord = {
          id: randomUUID(),
          symbol: input.symbol,
          timestamp: new Date(),
          horizon: input.horizon,
          direction: prediction.direction,
          confidence: prediction.confidence,
          rangeMin: prediction.range.min,
          rangeMax: prediction.range.max,
          rationale: prediction.rationale,
          technicalContext: input.technicalContext || null,
        };

        await createPrediction(predictionRecord);

        return {
          status: "ok",
          id: predictionRecord.id,
          prediction: predictionRecord,
        };
      } catch (error) {
        console.error("[Predictions] Generation failed:", error);
        throw new Error("Failed to generate prediction");
      }
    }),

  /**
   * Get latest prediction
   */
  latest: publicProcedure
    .input(
      z.object({
        horizon: z.enum(["3m", "5m", "15m", "1H", "4H"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const prediction = await getLatestPrediction(input.horizon);
      return prediction;
    }),

  /**
   * Get prediction history
   */
  history: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const predictions = await getPredictionHistory(input.limit);
      return predictions;
    }),
});

