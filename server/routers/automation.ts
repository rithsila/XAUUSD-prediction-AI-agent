import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { scrapeAllNews } from "../services/newsScraper";
import { runAutomatedAnalysis } from "../services/autoPredictionAgent";
import { sendTelegramMessage, formatPredictionMessage, testTelegramConnection } from "../services/telegram";
import { nanoid } from "nanoid";
import type { NewsSource } from "../../drizzle/schema";

export const automationRouter = router({
  // Get system settings
  getSettings: publicProcedure.query(async () => {
    const settings = await db.getSystemSettings();
    
    // Return default settings if none exist
    if (!settings) {
      return {
        id: "default",
        autoScrapingEnabled: false,
        scrapingInterval: 60,
        autoPredictionEnabled: false,
        predictionInterval: 60,
        telegramEnabled: false,
        telegramBotToken: null,
        telegramChannelId: null,
        telegramAlertOnPrediction: true,
        telegramAlertOnNews: false,
        minImpactScore: 50,
        updatedAt: new Date(),
      };
    }
    
    return settings;
  }),

  // Update system settings
  updateSettings: protectedProcedure
    .input(z.object({
      autoScrapingEnabled: z.boolean().optional(),
      scrapingInterval: z.number().min(5).max(1440).optional(), // 5 min to 24 hours
      autoPredictionEnabled: z.boolean().optional(),
      predictionInterval: z.number().min(5).max(1440).optional(),
      telegramEnabled: z.boolean().optional(),
      telegramBotToken: z.string().optional(),
      telegramChannelId: z.string().optional(),
      telegramAlertOnPrediction: z.boolean().optional(),
      telegramAlertOnNews: z.boolean().optional(),
      minImpactScore: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      await db.updateSystemSettings(input);
      return { success: true };
    }),

  // Test Telegram connection
  testTelegram: protectedProcedure
    .input(z.object({
      botToken: z.string(),
      channelId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const result = await testTelegramConnection(input.botToken, input.channelId);
      return result;
    }),

  // Manually trigger news scraping
  scrapeNews: protectedProcedure.mutation(async () => {
    console.log("[Automation] Manual news scraping triggered");
    
    const sources = await db.getEnabledNewsSources();
    
    if (sources.length === 0) {
      return {
        success: false,
        error: "No enabled news sources found",
      };
    }
    
    const sourcesForScraping = sources.map((s: NewsSource) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      url: s.url || undefined
    }));
    
    const { articles, events } = await scrapeAllNews(sourcesForScraping);
    
    // Save articles to database
    for (const article of articles) {
      await db.saveScrapedArticle({
        ...article,
        analyzed: false,
      });
    }
    
    // Save economic events
    for (const event of events) {
      await db.saveEconomicEvent({
        ...event,
        analyzed: false,
      });
    }
    
    return {
      success: true,
      articlesScraped: articles.length,
      eventsScraped: events.length,
    };
  }),

  // Manually trigger automated analysis
  runAnalysis: protectedProcedure.mutation(async () => {
    console.log("[Automation] Manual analysis triggered");
    
    const result = await runAutomatedAnalysis();
    
    // Send Telegram alert if prediction was generated
    if (result.predictionGenerated && result.predictionId) {
      const settings = await db.getSystemSettings();
      
      if (settings?.telegramEnabled && settings.telegramAlertOnPrediction) {
        const prediction = await db.getLatestPrediction();
        
        if (prediction && settings.telegramBotToken && settings.telegramChannelId) {
          const message = formatPredictionMessage({
            direction: prediction.direction,
            confidence: prediction.confidence,
            rangeMin: prediction.rangeMin || 0,
            rangeMax: prediction.rangeMax || 0,
            horizon: prediction.horizon,
            rationale: prediction.rationale as string[] || [],
            timestamp: prediction.timestamp,
          });
          
          await sendTelegramMessage(
            settings.telegramBotToken,
            settings.telegramChannelId,
            { text: message, parse_mode: "Markdown" }
          );
        }
      }
    }
    
    return result;
  }),

  // Get news sources
  getNewsSources: publicProcedure.query(async () => {
    return await db.getAllNewsSources();
  }),

  // Add news source
  addNewsSource: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(["twitter", "facebook", "website", "rss", "calendar"]),
      url: z.string().optional(),
      handle: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      enabled: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      await db.saveNewsSource({
        id: nanoid(),
        ...input,
        lastScraped: null,
      });
      
      return { success: true };
    }),

  // Get recent scraped articles
  getRecentArticles: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      return await db.getRecentArticles(input.limit);
    }),

  // Get upcoming economic events
  getUpcomingEvents: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      return await db.getUpcomingEconomicEvents(input.limit);
    }),
});

