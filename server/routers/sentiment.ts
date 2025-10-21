import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { nanoid } from "nanoid";
import * as db from "../db";
import { fetchAllSentiment, calculateAverageSentiment } from "../services/sentimentScraperSimple";

export const sentimentRouter = router({
  /**
   * Fetch and refresh sentiment data for a symbol
   */
  refresh: publicProcedure
    .input(z.object({
      symbol: z.string().default("XAUUSD"),
    }))
    .mutation(async ({ input }) => {
      const { symbol } = input;

      // Fetch sentiment from all sources
      const sentiments = await fetchAllSentiment(symbol);

      // Save each sentiment to database
      for (const sentiment of sentiments) {
        await db.saveSentimentData({
          id: nanoid(),
          symbol: sentiment.symbol,
          source: sentiment.source,
          longPercentage: Math.round(sentiment.longPercentage),
          shortPercentage: Math.round(sentiment.shortPercentage),
          volume: sentiment.volume,
          longPositions: sentiment.longPositions,
          shortPositions: sentiment.shortPositions,
          timestamp: sentiment.timestamp,
        });
      }

      // Calculate weighted average
      const weighted = calculateAverageSentiment(sentiments);

      return {
        success: true,
        symbol,
        sentiments,
        weighted,
        timestamp: new Date(),
      };
    }),

  /**
   * Get latest sentiment data for a symbol
   */
  getLatest: publicProcedure
    .input(z.object({
      symbol: z.string().default("XAUUSD"),
    }))
    .query(async ({ input }) => {
      const { symbol } = input;
      const sentiments = await db.getLatestSentiment(symbol);

      // Group by source (get most recent for each)
      const bySource = new Map<string, typeof sentiments[0]>();
      for (const s of sentiments) {
        if (!bySource.has(s.source)) {
          bySource.set(s.source, s);
        }
      }

      const latest = Array.from(bySource.values());

      // Calculate weighted average
      const weighted = calculateAverageSentiment(
        latest.map(s => ({
          symbol: s.symbol,
          source: s.source,
          longPercentage: s.longPercentage,
          shortPercentage: s.shortPercentage,
          volume: s.volume ?? undefined,
          longPositions: s.longPositions ?? undefined,
          shortPositions: s.shortPositions ?? undefined,
          timestamp: s.timestamp,
        }))
      );

      return {
        symbol,
        sentiments: latest,
        weighted,
        lastUpdate: latest[0]?.timestamp || new Date(),
      };
    }),

  /**
   * Get all available symbols
   */
  getSymbols: publicProcedure.query(async () => {
    const symbols = await db.getAllSentimentSymbols();
    return symbols;
  }),

  /**
   * Get sentiment for multiple symbols
   */
  getMultiple: publicProcedure
    .input(z.object({
      symbols: z.array(z.string()).default(["XAUUSD", "EURUSD", "GBPUSD"]),
    }))
    .query(async ({ input }) => {
      const { symbols } = input;

      const results = await Promise.all(
        symbols.map(async (symbol) => {
          const sentiments = await db.getLatestSentiment(symbol);

          // Group by source
          const bySource = new Map<string, typeof sentiments[0]>();
          for (const s of sentiments) {
            if (!bySource.has(s.source)) {
              bySource.set(s.source, s);
            }
          }

          const latest = Array.from(bySource.values());

          const weighted = calculateAverageSentiment(
            latest.map(s => ({
              symbol: s.symbol,
              source: s.source,
              longPercentage: s.longPercentage,
              shortPercentage: s.shortPercentage,
              volume: s.volume ?? undefined,
              longPositions: s.longPositions ?? undefined,
              shortPositions: s.shortPositions ?? undefined,
              timestamp: s.timestamp,
            }))
          );

          return {
            symbol,
            weighted,
            sources: latest.length,
            lastUpdate: latest[0]?.timestamp || new Date(),
          };
        })
      );

      return results;
    }),
});

