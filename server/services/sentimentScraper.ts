import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

export interface SentimentData {
  symbol: string;
  source: string;
  longPercentage: number;
  shortPercentage: number;
  volume?: number;
  longPositions?: number;
  shortPositions?: number;
  timestamp: Date;
}

/**
 * Scrape MyFxBook Community Outlook
 * URL: https://www.myfxbook.com/community/outlook/XAUUSD
 */
async function scrapeMyFxBook(symbol: string): Promise<SentimentData | null> {
  try {
    console.log(`[SentimentScraper] Fetching MyFxBook sentiment for ${symbol}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    await page.setViewport({ width: 1366, height: 768 });
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(30000);

    await page.goto(`https://www.myfxbook.com/community/outlook/${symbol}`, {
      waitUntil: "networkidle2",
      timeout: 45000,
    });

    // Try to dismiss cookie banners/popups to allow scripts to run
    try {
      await page.evaluate(() => {
        const candidates = Array.from(
          document.querySelectorAll(
            'button, a, [role="button"], .cc-accept, .cookie-accept'
          )
        ) as HTMLElement[];
        const btn = candidates.find(el => {
          const text = (el.textContent || "").toLowerCase();
          const cls = (el.className || "").toLowerCase();
          return (
            /accept|agree|ok|allow all|i agree/.test(text) ||
            /accept|agree|cookie/.test(cls)
          );
        });
        (btn as any)?.click?.();
      });
    } catch {}

    // Wait for sentiment data to load, but don't fail hard on timeout
    try {
      await page.waitForSelector(".outlookSymbolPage", { timeout: 20000 });
    } catch (err) {
      console.warn(
        `[SentimentScraper] MyFxBook: selector .outlookSymbolPage not found within timeout for ${symbol}, falling back to text parsing`
      );
    }

    const data = await page.evaluate(() => {
      // Polyfill for bundler-injected __name helper used to set function names
      const __name = (fn: any, name: string) => {
        try {
          Object.defineProperty(fn, "name", {
            value: name,
            configurable: true,
          });
        } catch {}
        return fn;
      };

      const pickNum = (el: Element | null, pct = true) => {
        const txt = el?.textContent || "";
        const m = txt.match(/(\d{1,3}(?:\.\d+)?)%/);
        return m ? parseFloat(m[1]) : 0;
      };

      // Primary selectors
      const longElement = document.querySelector(
        ".outlookSymbolPage .long .percentage"
      );
      const shortElement = document.querySelector(
        ".outlookSymbolPage .short .percentage"
      );
      const longPosElement = document.querySelector(
        ".outlookSymbolPage .long .positions"
      );
      const shortPosElement = document.querySelector(
        ".outlookSymbolPage .short .positions"
      );
      const volumeElement = document.querySelector(
        ".outlookSymbolPage .volume"
      );

      let longPct = pickNum(longElement);
      let shortPct = pickNum(shortElement);
      let longPos = longPosElement
        ? parseInt(
            (longPosElement.textContent || "").replace(/[^0-9]/g, "") || "0",
            10
          )
        : 0;
      let shortPos = shortPosElement
        ? parseInt(
            (shortPosElement.textContent || "").replace(/[^0-9]/g, "") || "0",
            10
          )
        : 0;
      let volume = volumeElement
        ? parseFloat(
            (volumeElement.textContent || "").replace(/[^0-9.]/g, "") || "0"
          )
        : 0;

      // Fallback: parse body text for Long/Short percentages
      if (!longPct || !shortPct) {
        const body = document.body.innerText || "";
        const longMatch = body.match(/long[^0-9]*(\d{1,3}(?:\.\d+)?)%/i);
        const shortMatch = body.match(/short[^0-9]*(\d{1,3}(?:\.\d+)?)%/i);
        if (longMatch) longPct = parseFloat(longMatch[1]);
        if (shortMatch) shortPct = parseFloat(shortMatch[1]);
        if (longPct && !shortPct)
          shortPct = Math.max(0, Math.min(100, 100 - longPct));
      }

      return {
        longPercentage: longPct,
        shortPercentage: shortPct,
        longPositions: longPos,
        shortPositions: shortPos,
        volume,
      };
    });

    await browser.close();

    if (!data || (!data.longPercentage && !data.shortPercentage)) {
      console.warn(
        `[SentimentScraper] MyFxBook: no percentages parsed for ${symbol}`
      );
      return null;
    }

    return {
      symbol,
      source: "MyFxBook",
      longPercentage: data.longPercentage,
      shortPercentage: data.shortPercentage,
      longPositions: data.longPositions,
      shortPositions: data.shortPositions,
      volume: data.volume,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(
      `[SentimentScraper] Error fetching MyFxBook for ${symbol}:`,
      error
    );
    return null;
  }
}

/**
 * Scrape Dukascopy SWFX Sentiment
 * URL: https://www.dukascopy.com/swiss/english/marketwatch/sentiment/
 */
async function scrapeDukascopy(symbol: string): Promise<SentimentData | null> {
  try {
    console.log(
      `[SentimentScraper] Fetching Dukascopy sentiment for ${symbol}`
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    await page.setViewport({ width: 1366, height: 768 });
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(30000);

    await page.goto(
      "https://www.dukascopy.com/swiss/english/marketwatch/sentiment/",
      {
        waitUntil: "networkidle2",
        timeout: 45000,
      }
    );

    try {
      await page.evaluate(() => {
        const candidates = Array.from(
          document.querySelectorAll(
            'button, a, [role="button"], .cc-accept, .cookie-accept'
          )
        ) as HTMLElement[];
        const btn = candidates.find(el => {
          const text = (el.textContent || "").toLowerCase();
          const cls = (el.className || "").toLowerCase();
          return (
            /accept|agree|ok|allow all|i agree/.test(text) ||
            /accept|agree|cookie/.test(cls)
          );
        });
        (btn as any)?.click?.();
      });
    } catch {}

    // Wait for sentiment table if present
    try {
      await page.waitForSelector(".swfx-sentiment-table", { timeout: 20000 });
    } catch (err) {
      console.warn(
        `[SentimentScraper] Dukascopy: selector .swfx-sentiment-table not found within timeout for ${symbol}, falling back to text parsing`
      );
    }

    const data = await page.evaluate(sym => {
      // Polyfill for bundler-injected __name helper used to set function names
      const __name = (fn: any, name: string) => {
        try {
          Object.defineProperty(fn, "name", {
            value: name,
            configurable: true,
          });
        } catch {}
        return fn;
      };

      const SYM = String(sym);
      const parsePct = (txt: string) => {
        const m = txt.match(/(\d{1,3}(?:\.\d+)?)%/);
        return m ? parseFloat(m[1]) : NaN;
      };

      // Try table-based parsing first
      const rows = document.querySelectorAll(".swfx-sentiment-table tr");
      for (const row of Array.from(rows)) {
        const symbolCell = row.querySelector("td:first-child");
        if (symbolCell && (symbolCell.textContent || "").includes(SYM)) {
          const longCell = row.querySelector("td.long-percentage");
          const shortCell = row.querySelector("td.short-percentage");
          const longPct = longCell ? parsePct(longCell.textContent || "") : NaN;
          const shortPct = shortCell
            ? parsePct(shortCell.textContent || "")
            : NaN;
          if (!isNaN(longPct) || !isNaN(shortPct)) {
            return {
              longPercentage: !isNaN(longPct)
                ? longPct
                : !isNaN(shortPct)
                  ? Math.max(0, Math.min(100, 100 - shortPct))
                  : 0,
              shortPercentage: !isNaN(shortPct)
                ? shortPct
                : !isNaN(longPct)
                  ? Math.max(0, Math.min(100, 100 - longPct))
                  : 0,
            };
          }
        }
      }

      // Fallback: scan body text near symbol
      const body = document.body.innerText || "";
      const idx = body.indexOf(SYM);
      if (idx !== -1) {
        const snippet = body.slice(
          Math.max(0, idx - 200),
          Math.min(body.length, idx + 200)
        );
        const matches = snippet.match(/(\d{1,3}(?:\.\d+)?)%/g) || [];
        if (matches.length) {
          const firstStr = matches[0] || "0";
          const first = parseFloat(firstStr);
          if (!isNaN(first)) {
            return {
              longPercentage: first,
              shortPercentage: Math.max(0, Math.min(100, 100 - first)),
            };
          }
        }
      }

      return null;
    }, symbol);

    await browser.close();

    if (!data) {
      console.log(
        `[SentimentScraper] Symbol ${symbol} not found in Dukascopy data`
      );
      return null;
    }

    return {
      symbol,
      source: "Dukascopy",
      longPercentage: data.longPercentage,
      shortPercentage: data.shortPercentage,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(
      `[SentimentScraper] Error fetching Dukascopy for ${symbol}:`,
      error
    );
    return null;
  }
}

/**
 * Scrape FXSSI Sentiment (aggregates multiple brokers)
 * URL: https://fxssi.com/tools/current-ratio
 */
async function scrapeFXSSI(symbol: string): Promise<SentimentData | null> {
  try {
    console.log(`[SentimentScraper] Fetching FXSSI sentiment for ${symbol}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.goto("https://fxssi.com/tools/current-ratio", {
      waitUntil: "networkidle2",
      timeout: 45000,
    });

    try {
      await page.evaluate(() => {
        const candidates = Array.from(
          document.querySelectorAll(
            'button, a, [role="button"], .cc-accept, .cookie-accept'
          )
        ) as HTMLElement[];
        const btn = candidates.find(el => {
          const text = (el.textContent || "").toLowerCase();
          const cls = (el.className || "").toLowerCase();
          return (
            /accept|agree|ok|allow all|i agree/.test(text) ||
            /accept|agree|cookie/.test(cls)
          );
        });
        (btn as any)?.click?.();
      });
    } catch {}

    // Wait for sentiment data to load, but tolerate selector timeouts
    try {
      await page.waitForSelector(".sentiment-table", { timeout: 20000 });
    } catch (err) {
      console.warn(
        `[SentimentScraper] FXSSI: selector .sentiment-table not found within timeout for ${symbol}, falling back to text parsing`
      );
    }

    const data = await page.evaluate(sym => {
      // Polyfill for bundler-injected __name helper used to set function names
      const __name = (fn: any, name: string) => {
        try {
          Object.defineProperty(fn, "name", {
            value: name,
            configurable: true,
          });
        } catch {}
        return fn;
      };

      const SYM = String(sym);
      const parsePct = (txt: string) => {
        const m = txt.match(/(\d{1,3}(?:\.\d+)?)%/);
        return m ? parseFloat(m[1]) : NaN;
      };

      // Table-based parsing if available
      const rows = document.querySelectorAll(".sentiment-table tr, table tr");
      for (const row of Array.from(rows)) {
        const symbolCell = row.querySelector("td:first-child, th:first-child");
        if (symbolCell && (symbolCell.textContent || "").includes(SYM)) {
          const cells = Array.from(row.querySelectorAll("td"));
          for (const cell of cells) {
            const pct = parsePct(cell.textContent || "");
            if (!isNaN(pct)) {
              return {
                longPercentage: pct,
                shortPercentage: Math.max(0, Math.min(100, 100 - pct)),
              };
            }
          }
        }
      }

      // Fallback: scan body text near symbol
      const body = document.body.innerText || "";
      const idx = body.indexOf(SYM);
      if (idx !== -1) {
        const snippet = body.slice(
          Math.max(0, idx - 200),
          Math.min(body.length, idx + 200)
        );
        const matches = snippet.match(/(\d{1,3}(?:\.\d+)?)%/g) || [];
        if (matches.length) {
          const firstStr = matches[0] || "0";
          const first = parseFloat(firstStr);
          if (!isNaN(first)) {
            return {
              longPercentage: first,
              shortPercentage: Math.max(0, Math.min(100, 100 - first)),
            };
          }
        }
      }

      return null;
    }, symbol);

    await browser.close();

    if (!data) {
      console.log(
        `[SentimentScraper] Symbol ${symbol} not found in FXSSI data`
      );
      return null;
    }

    return {
      symbol,
      source: "FXSSI",
      longPercentage: data.longPercentage,
      shortPercentage: data.shortPercentage,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(
      `[SentimentScraper] Error fetching FXSSI for ${symbol}:`,
      error
    );
    return null;
  }
}

/**
 * Fetch sentiment data from all sources
 */
export async function fetchAllSentiment(
  symbol: string
): Promise<SentimentData[]> {
  console.log(
    `[SentimentScraper] Fetching sentiment data for ${symbol} from all sources`
  );

  const results = await Promise.allSettled([
    scrapeMyFxBook(symbol),
    scrapeDukascopy(symbol),
    scrapeFXSSI(symbol),
  ]);

  const sentimentData: SentimentData[] = [];

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      sentimentData.push(result.value);
    }
  }

  console.log(
    `[SentimentScraper] Successfully fetched ${sentimentData.length} sentiment sources for ${symbol}`
  );

  return sentimentData;
}

/**
 * Calculate weighted average sentiment from multiple sources
 */
export function calculateAverageSentiment(data: SentimentData[]): {
  longPercentage: number;
  shortPercentage: number;
  sourceCount: number;
} {
  if (data.length === 0) {
    return {
      longPercentage: 50,
      shortPercentage: 50,
      sourceCount: 0,
    };
  }

  const totalLong = data.reduce((sum, d) => sum + d.longPercentage, 0);
  const totalShort = data.reduce((sum, d) => sum + d.shortPercentage, 0);

  return {
    longPercentage: Math.round((totalLong / data.length) * 10) / 10,
    shortPercentage: Math.round((totalShort / data.length) * 10) / 10,
    sourceCount: data.length,
  };
}
