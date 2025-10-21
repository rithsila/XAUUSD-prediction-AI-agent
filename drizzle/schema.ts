import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Predictions table for XAUUSD analysis
 */
export const predictions = mysqlTable("predictions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull().default("XAUUSD"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  horizon: varchar("horizon", { length: 10 }).notNull(), // 3m, 5m, 15m, 1H, 4H
  direction: mysqlEnum("direction", ["bull", "bear", "neutral"]).notNull(),
  confidence: int("confidence").notNull(), // 0-100
  rangeMin: int("rangeMin"), // Price range minimum (in pips or cents)
  rangeMax: int("rangeMax"), // Price range maximum
  rationale: json("rationale").$type<string[]>(), // Array of top drivers
  technicalContext: json("technicalContext").$type<{
    adx?: number;
    atr?: number;
    regime?: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;

/**
 * News and sentiment analysis table
 */
export const newsEvents = mysqlTable("newsEvents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  source: varchar("source", { length: 100 }).notNull(),
  headline: text("headline").notNull(),
  body: text("body"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  sentimentPolarity: int("sentimentPolarity"), // -100 to 100 (scaled from -1 to 1)
  sentimentScore: int("sentimentScore"), // 0-100
  topic: varchar("topic", { length: 50 }), // policy, inflation, geopolitics, other
  processed: boolean("processed").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type NewsEvent = typeof newsEvents.$inferSelect;
export type InsertNewsEvent = typeof newsEvents.$inferInsert;

/**
 * MT5 notification log
 */
export const mt5Notifications = mysqlTable("mt5Notifications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  accountId: varchar("accountId", { length: 100 }).notNull(),
  predictionId: varchar("predictionId", { length: 64 }),
  signal: json("signal").$type<any>(),
  risk: json("risk").$type<{
    tp?: number;
    sl?: number;
    rr?: number;
  }>(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, delivered, failed
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type MT5Notification = typeof mt5Notifications.$inferSelect;
export type InsertMT5Notification = typeof mt5Notifications.$inferInsert;

/**
 * API Keys table for TradingView and MT5 webhook access
 */
export const apiKeys = mysqlTable("apiKeys", {
  id: varchar("id", { length: 64 }).primaryKey(),
  apiKey: varchar("apiKey", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  username: varchar("username", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["MT5", "TradingView"]).notNull(),
  status: mysqlEnum("status", ["active", "revoked", "expired"]).default("active").notNull(),
  expiresAt: timestamp("expiresAt"),
  lastUsedAt: timestamp("lastUsedAt"),
  requestCount: int("requestCount").default(0),
  createdBy: varchar("createdBy", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Sentiment data from multiple broker sources
 */
export const sentimentData = mysqlTable("sentimentData", {
  id: varchar("id", { length: 64 }).primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull(), // XAUUSD, EURUSD, etc.
  source: varchar("source", { length: 50 }).notNull(), // Dukascopy, MyFxBook, FXSSI, etc.
  longPercentage: int("longPercentage").notNull(), // 0-100
  shortPercentage: int("shortPercentage").notNull(), // 0-100
  volume: int("volume"), // Total volume in lots (scaled by 100)
  longPositions: int("longPositions"),
  shortPositions: int("shortPositions"),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type SentimentData = typeof sentimentData.$inferSelect;
export type InsertSentimentData = typeof sentimentData.$inferInsert;

/**
 * News sources configuration (social media, websites, influential figures)
 */
export const newsSources = mysqlTable("newsSources", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // "Donald Trump", "Jerome Powell", "Reuters Gold"
  type: mysqlEnum("type", ["twitter", "facebook", "website", "rss", "calendar"]).notNull(),
  url: text("url"), // Profile URL, RSS feed, or API endpoint
  handle: varchar("handle", { length: 100 }), // @realDonaldTrump, @federalreserve
  keywords: json("keywords").$type<string[]>(), // ["gold", "inflation", "fed"]
  enabled: boolean("enabled").default(true).notNull(),
  lastScraped: timestamp("lastScraped"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type NewsSource = typeof newsSources.$inferSelect;
export type InsertNewsSource = typeof newsSources.$inferInsert;

/**
 * Scraped articles and social media posts
 */
export const scrapedArticles = mysqlTable("scrapedArticles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  sourceId: varchar("sourceId", { length: 64 }).notNull(),
  title: text("title").notNull(),
  content: text("content"),
  url: text("url"),
  author: varchar("author", { length: 200 }),
  publishedAt: timestamp("publishedAt"),
  scrapedAt: timestamp("scrapedAt").notNull().defaultNow(),
  
  // AI Analysis results
  analyzed: boolean("analyzed").default(false),
  goldImpact: mysqlEnum("goldImpact", ["bullish", "bearish", "neutral", "unknown"]),
  impactScore: int("impactScore"), // 0-100 (how much this affects gold)
  sentiment: int("sentiment"), // -100 to 100
  summary: text("summary"), // AI-generated summary
  
  // Link to generated prediction
  predictionId: varchar("predictionId", { length: 64 }),
  
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ScrapedArticle = typeof scrapedArticles.$inferSelect;
export type InsertScrapedArticle = typeof scrapedArticles.$inferInsert;

/**
 * Economic calendar events
 */
export const economicEvents = mysqlTable("economicEvents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  source: varchar("source", { length: 50 }).notNull(), // "MyFxBook", "Trading Economics"
  title: text("title").notNull(),
  country: varchar("country", { length: 10 }), // US, EU, UK, etc.
  impact: mysqlEnum("impact", ["high", "medium", "low"]),
  eventTime: timestamp("eventTime").notNull(),
  forecast: varchar("forecast", { length: 50 }),
  previous: varchar("previous", { length: 50 }),
  actual: varchar("actual", { length: 50 }),
  
  // Analysis
  analyzed: boolean("analyzed").default(false),
  goldImpact: mysqlEnum("goldImpact", ["bullish", "bearish", "neutral", "unknown"]),
  predictionId: varchar("predictionId", { length: 64 }),
  
  createdAt: timestamp("createdAt").defaultNow(),
});

export type EconomicEvent = typeof economicEvents.$inferSelect;
export type InsertEconomicEvent = typeof economicEvents.$inferInsert;

/**
 * System settings for automation and integrations
 */
export const systemSettings = mysqlTable("systemSettings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  
  // Automation settings
  autoScrapingEnabled: boolean("autoScrapingEnabled").default(false),
  scrapingInterval: int("scrapingInterval").default(60), // minutes
  autoPredictionEnabled: boolean("autoPredictionEnabled").default(false),
  predictionInterval: int("predictionInterval").default(60), // minutes
  
  // Telegram settings
  telegramEnabled: boolean("telegramEnabled").default(false),
  telegramBotToken: text("telegramBotToken"),
  telegramChannelId: varchar("telegramChannelId", { length: 100 }),
  telegramAlertOnPrediction: boolean("telegramAlertOnPrediction").default(true),
  telegramAlertOnNews: boolean("telegramAlertOnNews").default(false),
  
  // News filtering
  minImpactScore: int("minImpactScore").default(50), // Only alert on high-impact news
  
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = typeof systemSettings.$inferInsert;
