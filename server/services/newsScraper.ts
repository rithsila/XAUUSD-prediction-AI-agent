import axios from "axios";
import * as cheerio from "cheerio";
import { nanoid } from "nanoid";

export interface ScrapedNews {
  id: string;
  sourceId: string;
  title: string;
  content?: string;
  url?: string;
  author?: string;
  publishedAt?: Date;
  scrapedAt: Date;
}

export interface EconomicCalendarEvent {
  id: string;
  source: string;
  title: string;
  country?: string;
  impact?: "high" | "medium" | "low";
  eventTime: Date;
  forecast?: string;
  previous?: string;
  actual?: string;
}

/**
 * Scrape MyFxBook Economic Calendar
 * URL: https://www.myfxbook.com/forex-economic-calendar
 */
export async function scrapeMyFxBookCalendar(): Promise<
  EconomicCalendarEvent[]
> {
  try {
    console.log("[NewsScraper] Fetching MyFxBook Economic Calendar");

    const response = await axios.get(
      "https://www.myfxbook.com/forex-economic-calendar",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 15000,
      }
    );

    const $ = cheerio.load(response.data);
    const events: EconomicCalendarEvent[] = [];

    // Look for calendar table rows
    $("table tr, .calendar-row").each((i, row) => {
      const $row = $(row);

      const title = $row.find(".event-title, td:nth-child(3)").text().trim();
      const country = $row.find(".country, td:nth-child(1)").text().trim();
      const impact = $row
        .find(".impact, td:nth-child(2)")
        .text()
        .trim()
        .toLowerCase();
      const timeStr = $row.find(".time, td:nth-child(0)").text().trim();

      if (title && title.length > 3) {
        events.push({
          id: nanoid(),
          source: "MyFxBook",
          title,
          country: country || undefined,
          impact:
            impact === "high" || impact === "medium" || impact === "low"
              ? impact
              : undefined,
          eventTime: new Date(), // Parse time string
          forecast:
            $row.find(".forecast, td:nth-child(4)").text().trim() || undefined,
          previous:
            $row.find(".previous, td:nth-child(5)").text().trim() || undefined,
          actual:
            $row.find(".actual, td:nth-child(6)").text().trim() || undefined,
        });
      }
    });

    console.log(`[NewsScraper] Found ${events.length} events from MyFxBook`);
    return events.slice(0, 20); // Return top 20 upcoming events
  } catch (error) {
    console.error("[NewsScraper] Error scraping MyFxBook calendar:", error);
    return [];
  }
}

/**
 * Scrape Trading Economics Calendar
 * URL: https://tradingeconomics.com/calendar
 */
export async function scrapeTradingEconomicsCalendar(): Promise<
  EconomicCalendarEvent[]
> {
  try {
    console.log("[NewsScraper] Fetching Trading Economics Calendar");

    const response = await axios.get("https://tradingeconomics.com/calendar", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const events: EconomicCalendarEvent[] = [];

    // Look for calendar events
    $("table tbody tr, .calendar-event").each((i, row) => {
      const $row = $(row);

      const title = $row.find("td:nth-child(2), .event-name").text().trim();
      const country = $row.find("td:nth-child(1), .country").text().trim();

      if (title && title.length > 3) {
        events.push({
          id: nanoid(),
          source: "Trading Economics",
          title,
          country: country || undefined,
          eventTime: new Date(),
          forecast:
            $row.find("td:nth-child(4), .forecast").text().trim() || undefined,
          previous:
            $row.find("td:nth-child(5), .previous").text().trim() || undefined,
          actual:
            $row.find("td:nth-child(6), .actual").text().trim() || undefined,
        });
      }
    });

    console.log(
      `[NewsScraper] Found ${events.length} events from Trading Economics`
    );
    return events.slice(0, 20);
  } catch (error) {
    console.error(
      "[NewsScraper] Error scraping Trading Economics calendar:",
      error
    );
    return [];
  }
}

/**
 * Scrape Reuters Gold News
 * URL: https://www.reuters.com/markets/commodities/gold/
 */
export async function scrapeReutersGold(
  sourceId: string
): Promise<ScrapedNews[]> {
  try {
    console.log("[NewsScraper] Fetching Reuters Gold News");

    const response = await axios.get(
      "https://www.reuters.com/markets/commodities/",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 15000,
      }
    );

    const $ = cheerio.load(response.data);
    const articles: ScrapedNews[] = [];

    // Look for article links
    $("article, .story-card").each((i, article) => {
      const $article = $(article);

      const title = $article.find("h3, .headline, a").first().text().trim();
      const url = $article.find("a").first().attr("href");
      const summary = $article.find("p, .summary").first().text().trim();

      if (title && title.toLowerCase().includes("gold")) {
        articles.push({
          id: nanoid(),
          sourceId,
          title,
          content: summary || undefined,
          url: url ? `https://www.reuters.com${url}` : undefined,
          scrapedAt: new Date(),
        });
      }
    });

    console.log(
      `[NewsScraper] Found ${articles.length} gold articles from Reuters`
    );
    return articles.slice(0, 10);
  } catch (error) {
    console.error("[NewsScraper] Error scraping Reuters:", error);
    return [];
  }
}

/**
 * Scrape Kitco Gold News (gold-specific news site)
 * URL: https://www.kitco.com/news/gold/
 */
export async function scrapeKitcoNews(
  sourceId: string
): Promise<ScrapedNews[]> {
  try {
    console.log("[NewsScraper] Fetching Kitco Gold News");

    const response = await axios.get("https://www.kitco.com/news/gold/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const articles: ScrapedNews[] = [];

    // Look for news articles
    $("article, .news-item, .story").each((i, article) => {
      const $article = $(article);

      const title = $article.find("h2, h3, .title, a").first().text().trim();
      const url = $article.find("a").first().attr("href");
      const content = $article.find("p, .excerpt").first().text().trim();

      if (title && title.length > 10) {
        articles.push({
          id: nanoid(),
          sourceId,
          title,
          content: content || undefined,
          url: url?.startsWith("http") ? url : `https://www.kitco.com${url}`,
          scrapedAt: new Date(),
        });
      }
    });

    console.log(`[NewsScraper] Found ${articles.length} articles from Kitco`);
    return articles.slice(0, 10);
  } catch (error) {
    console.error("[NewsScraper] Error scraping Kitco:", error);
    return [];
  }
}

/**
 * Generate mock social media posts (Twitter/X, Facebook)
 * In production, this would use Twitter API or web scraping
 */
export function generateMockSocialPosts(
  sourceId: string,
  sourceName: string
): ScrapedNews[] {
  const mockPosts = [
    {
      title: `${sourceName}: Gold prices showing strength amid dollar weakness`,
      content:
        "The precious metal continues to attract safe-haven demand as geopolitical tensions rise.",
    },
    {
      title: `${sourceName}: Fed policy remains key driver for gold markets`,
      content:
        "Interest rate decisions will be crucial for gold's trajectory in coming months.",
    },
    {
      title: `${sourceName}: Central banks continue gold accumulation`,
      content:
        "Major central banks have been net buyers of gold, supporting long-term bullish outlook.",
    },
  ];

  return mockPosts.map(post => ({
    id: nanoid(),
    sourceId,
    title: post.title,
    content: post.content,
    scrapedAt: new Date(),
    publishedAt: new Date(Date.now() - Math.random() * 3600000), // Random time within last hour
  }));
}

/**
 * Scrape all news sources
 */
export async function scrapeAllNews(
  sources: Array<{ id: string; name: string; type: string; url?: string }>
): Promise<{
  articles: ScrapedNews[];
  events: EconomicCalendarEvent[];
}> {
  console.log(`[NewsScraper] Starting scrape for ${sources.length} sources`);

  const articles: ScrapedNews[] = [];
  const events: EconomicCalendarEvent[] = [];

  // Scrape economic calendars
  const [myfxbookEvents, tradingEconomicsEvents] = await Promise.all([
    scrapeMyFxBookCalendar(),
    scrapeTradingEconomicsCalendar(),
  ]);

  events.push(...myfxbookEvents, ...tradingEconomicsEvents);

  // Scrape news sources
  for (const source of sources) {
    try {
      if (source.type === "website") {
        if (source.url?.includes("reuters")) {
          const reutersArticles = await scrapeReutersGold(source.id);
          articles.push(...reutersArticles);
        } else if (source.url?.includes("kitco")) {
          const kitcoArticles = await scrapeKitcoNews(source.id);
          articles.push(...kitcoArticles);
        }
      } else if (source.type === "twitter" || source.type === "facebook") {
        // Use mock data for social media (requires API keys in production)
        const mockPosts = generateMockSocialPosts(source.id, source.name);
        articles.push(...mockPosts);
      }
    } catch (error) {
      console.error(`[NewsScraper] Error scraping ${source.name}:`, error);
    }
  }

  console.log(
    `[NewsScraper] Scraping complete: ${articles.length} articles, ${events.length} events`
  );

  return { articles, events };
}
