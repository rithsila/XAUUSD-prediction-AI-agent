import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, predictions, InsertPrediction, newsEvents, InsertNewsEvent, mt5Notifications, InsertMT5Notification, apiKeys, InsertApiKey, sentimentData, InsertSentimentData, newsSources, InsertNewsSource, scrapedArticles, InsertScrapedArticle, economicEvents, InsertEconomicEvent, systemSettings, InsertSystemSettings } from "../drizzle/schema";
import { sql } from "drizzle-orm";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Prediction queries
export async function createPrediction(prediction: InsertPrediction) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create prediction: database not available");
    return null;
  }
  try {
    await db.insert(predictions).values(prediction);
    return prediction;
  } catch (error) {
    console.error("[Database] Failed to create prediction:", error);
    throw error;
  }
}

export async function getLatestPrediction(horizon?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get prediction: database not available");
    return null;
  }
  try {
    let result;
    if (horizon) {
      result = await db.select().from(predictions).where(eq(predictions.horizon, horizon)).orderBy(desc(predictions.timestamp)).limit(1);
    } else {
      result = await db.select().from(predictions).orderBy(desc(predictions.timestamp)).limit(1);
    }
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get latest prediction:", error);
    return null;
  }
}

export async function getPredictionHistory(limit: number = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get prediction history: database not available");
    return [];
  }
  try {
    const result = await db.select().from(predictions).orderBy(desc(predictions.timestamp)).limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get prediction history:", error);
    return [];
  }
}

// News queries
export async function createNewsEvent(news: InsertNewsEvent) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create news event: database not available");
    return null;
  }
  try {
    await db.insert(newsEvents).values(news);
    return news;
  } catch (error) {
    console.error("[Database] Failed to create news event:", error);
    throw error;
  }
}

export async function getLatestNews(limit: number = 20) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get latest news: database not available");
    return [];
  }
  try {
    const result = await db.select().from(newsEvents).orderBy(desc(newsEvents.timestamp)).limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get latest news:", error);
    return [];
  }
}

// MT5 notification queries
export async function createMT5Notification(notification: InsertMT5Notification) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create MT5 notification: database not available");
    return null;
  }
  try {
    await db.insert(mt5Notifications).values(notification);
    return notification;
  } catch (error) {
    console.error("[Database] Failed to create MT5 notification:", error);
    throw error;
  }
}

export async function updateMT5NotificationStatus(id: string, status: string, deliveredAt?: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update MT5 notification: database not available");
    return null;
  }
  try {
    await db.update(mt5Notifications).set({ status, deliveredAt }).where(eq(mt5Notifications.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update MT5 notification:", error);
    return false;
  }
}

// API Keys Management
export async function createApiKey(data: InsertApiKey) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.insert(apiKeys).values(data);
    return data;
  } catch (error) {
    console.error("[Database] Failed to create API key:", error);
    throw error;
  }
}

export async function getApiKey(apiKey: string) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.select().from(apiKeys).where(eq(apiKeys.apiKey, apiKey)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get API key:", error);
    return null;
  }
}

export async function getAllApiKeys() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get all API keys:", error);
    return [];
  }
}

export async function updateApiKeyUsage(apiKey: string) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.update(apiKeys)
      .set({ 
        lastUsedAt: new Date(),
        requestCount: sql`${apiKeys.requestCount} + 1`
      })
      .where(eq(apiKeys.apiKey, apiKey));
  } catch (error) {
    console.error("[Database] Failed to update API key usage:", error);
  }
}

export async function revokeApiKey(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.update(apiKeys)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(eq(apiKeys.id, id));
  } catch (error) {
    console.error("[Database] Failed to revoke API key:", error);
    throw error;
  }
}

export async function deleteApiKey(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  } catch (error) {
    console.error("[Database] Failed to delete API key:", error);
    throw error;
  }
}

// Sentiment data queries
export async function saveSentimentData(data: InsertSentimentData) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save sentiment data: database not available");
    return;
  }

  try {
    await db.insert(sentimentData).values(data);
  } catch (error) {
    console.error("[Database] Failed to save sentiment data:", error);
    throw error;
  }
}

export async function getLatestSentiment(symbol: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get sentiment: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(sentimentData)
      .where(eq(sentimentData.symbol, symbol))
      .orderBy(desc(sentimentData.timestamp))
      .limit(20); // Get latest data from each source

    return result;
  } catch (error) {
    console.error("[Database] Failed to get sentiment:", error);
    return [];
  }
}

export async function getAllSentimentSymbols() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get symbols: database not available");
    return [];
  }

  try {
    const result = await db
      .selectDistinct({ symbol: sentimentData.symbol })
      .from(sentimentData);

    return result.map(r => r.symbol);
  } catch (error) {
    console.error("[Database] Failed to get symbols:", error);
    return [];
  }
}


// News Sources Management
export async function saveNewsSource(source: InsertNewsSource) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save news source: database not available");
    return;
  }

  try {
    await db.insert(newsSources).values(source);
  } catch (error) {
    console.error("[Database] Failed to save news source:", error);
    throw error;
  }
}

export async function getAllNewsSources() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get news sources: database not available");
    return [];
  }

  try {
    const result = await db.select().from(newsSources);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get news sources:", error);
    return [];
  }
}

export async function getEnabledNewsSources() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get enabled sources: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(newsSources)
      .where(eq(newsSources.enabled, true));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get enabled sources:", error);
    return [];
  }
}

// Scraped Articles Management
export async function saveScrapedArticle(article: InsertScrapedArticle) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save article: database not available");
    return;
  }

  try {
    await db.insert(scrapedArticles).values(article);
  } catch (error) {
    console.error("[Database] Failed to save article:", error);
    throw error;
  }
}

export async function getUnanalyzedArticles(limit: number = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get articles: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(scrapedArticles)
      .where(eq(scrapedArticles.analyzed, false))
      .orderBy(desc(scrapedArticles.scrapedAt))
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get unanalyzed articles:", error);
    return [];
  }
}

export async function updateArticleAnalysis(
  id: string,
  analysis: {
    analyzed: boolean;
    goldImpact?: "bullish" | "bearish" | "neutral" | "unknown";
    impactScore?: number;
    sentiment?: number;
    summary?: string;
    predictionId?: string;
  }
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update article: database not available");
    return;
  }

  try {
    await db
      .update(scrapedArticles)
      .set(analysis)
      .where(eq(scrapedArticles.id, id));
  } catch (error) {
    console.error("[Database] Failed to update article analysis:", error);
    throw error;
  }
}

export async function getRecentArticles(limit: number = 20) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get recent articles: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(scrapedArticles)
      .orderBy(desc(scrapedArticles.scrapedAt))
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get recent articles:", error);
    return [];
  }
}

// Economic Events Management
export async function saveEconomicEvent(event: InsertEconomicEvent) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save economic event: database not available");
    return;
  }

  try {
    await db.insert(economicEvents).values(event);
  } catch (error) {
    console.error("[Database] Failed to save economic event:", error);
    throw error;
  }
}

export async function getUpcomingEconomicEvents(limit: number = 20) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get economic events: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(economicEvents)
      .where(sql`${economicEvents.eventTime} >= NOW()`)
      .orderBy(economicEvents.eventTime)
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get economic events:", error);
    return [];
  }
}

// System Settings Management
export async function getSystemSettings() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get settings: database not available");
    return null;
  }

  try {
    const result = await db.select().from(systemSettings).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get settings:", error);
    return null;
  }
}

export async function updateSystemSettings(settings: Partial<InsertSystemSettings>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update settings: database not available");
    return;
  }

  try {
    // Check if settings exist
    const existing = await db.select().from(systemSettings).limit(1);
    
    if (existing.length === 0) {
      // Insert default settings
      await db.insert(systemSettings).values({
        id: "default",
        ...settings,
      });
    } else {
      // Update existing settings
      await db
        .update(systemSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(systemSettings.id, existing[0].id));
    }
  } catch (error) {
    console.error("[Database] Failed to update settings:", error);
    throw error;
  }
}

