import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { createNewsEvent, getLatestNews } from "../db";
import { analyzeSentiment } from "../services/openai";
import { randomUUID } from "crypto";

export const newsRouter = router({
  /**
   * Submit and analyze news
   */
  analyze: publicProcedure
    .input(
      z.object({
        source: z.string(),
        headline: z.string(),
        body: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Analyze sentiment using OpenAI
        const sentiment = await analyzeSentiment({
          headline: input.headline,
          body: input.body,
        });

        // Save to database
        const newsRecord = {
          id: randomUUID(),
          source: input.source,
          headline: input.headline,
          body: input.body || null,
          timestamp: new Date(),
          sentimentPolarity: Math.round(sentiment.polarity * 100), // Scale to -100 to 100
          sentimentScore: sentiment.score,
          topic: sentiment.topic,
          processed: true,
        };

        await createNewsEvent(newsRecord);

        return {
          status: "ok",
          sentiment: {
            polarity: sentiment.polarity,
            score: sentiment.score,
            topic: sentiment.topic,
          },
          id: newsRecord.id,
        };
      } catch (error) {
        console.error("[News] Analysis failed:", error);
        throw new Error("Failed to analyze news");
      }
    }),

  /**
   * Get latest news
   */
  latest: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const news = await getLatestNews(input.limit);
      return news;
    }),
});

