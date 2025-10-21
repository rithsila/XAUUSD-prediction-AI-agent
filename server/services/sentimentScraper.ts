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
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.goto(`https://www.myfxbook.com/community/outlook/${symbol}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for sentiment data to load
    await page.waitForSelector('.outlookSymbolPage', { timeout: 10000 });
    
    const data = await page.evaluate(() => {
      // Extract sentiment percentages
      const longElement = document.querySelector('.outlookSymbolPage .long .percentage');
      const shortElement = document.querySelector('.outlookSymbolPage .short .percentage');
      
      // Extract position counts
      const longPosElement = document.querySelector('.outlookSymbolPage .long .positions');
      const shortPosElement = document.querySelector('.outlookSymbolPage .short .positions');
      
      // Extract volume
      const volumeElement = document.querySelector('.outlookSymbolPage .volume');
      
      return {
        longPercentage: longElement ? parseFloat(longElement.textContent?.replace('%', '') || '0') : 0,
        shortPercentage: shortElement ? parseFloat(shortElement.textContent?.replace('%', '') || '0') : 0,
        longPositions: longPosElement ? parseInt(longPosElement.textContent?.replace(/,/g, '') || '0') : 0,
        shortPositions: shortPosElement ? parseInt(shortPosElement.textContent?.replace(/,/g, '') || '0') : 0,
        volume: volumeElement ? parseFloat(volumeElement.textContent?.replace(/[^0-9.]/g, '') || '0') : 0,
      };
    });
    
    await browser.close();
    
    return {
      symbol,
      source: 'MyFxBook',
      longPercentage: data.longPercentage,
      shortPercentage: data.shortPercentage,
      longPositions: data.longPositions,
      shortPositions: data.shortPositions,
      volume: data.volume,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(`[SentimentScraper] Error fetching MyFxBook for ${symbol}:`, error);
    return null;
  }
}

/**
 * Scrape Dukascopy SWFX Sentiment
 * URL: https://www.dukascopy.com/swiss/english/marketwatch/sentiment/
 */
async function scrapeDukascopy(symbol: string): Promise<SentimentData | null> {
  try {
    console.log(`[SentimentScraper] Fetching Dukascopy sentiment for ${symbol}`);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.goto('https://www.dukascopy.com/swiss/english/marketwatch/sentiment/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for sentiment table to load
    await page.waitForSelector('.swfx-sentiment-table', { timeout: 10000 });
    
    const data = await page.evaluate((sym) => {
      // Find the row for the symbol
      const rows = document.querySelectorAll('.swfx-sentiment-table tr');
      
      for (const row of Array.from(rows)) {
        const symbolCell = row.querySelector('td:first-child');
        if (symbolCell && symbolCell.textContent?.includes(sym)) {
          const longCell = row.querySelector('td.long-percentage');
          const shortCell = row.querySelector('td.short-percentage');
          
          return {
            longPercentage: longCell ? parseFloat(longCell.textContent?.replace('%', '') || '0') : 0,
            shortPercentage: shortCell ? parseFloat(shortCell.textContent?.replace('%', '') || '0') : 0,
          };
        }
      }
      
      return null;
    }, symbol);
    
    await browser.close();
    
    if (!data) {
      console.log(`[SentimentScraper] Symbol ${symbol} not found in Dukascopy data`);
      return null;
    }
    
    return {
      symbol,
      source: 'Dukascopy',
      longPercentage: data.longPercentage,
      shortPercentage: data.shortPercentage,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(`[SentimentScraper] Error fetching Dukascopy for ${symbol}:`, error);
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
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.goto('https://fxssi.com/tools/current-ratio', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for sentiment data to load
    await page.waitForSelector('.sentiment-table', { timeout: 10000 });
    
    const data = await page.evaluate((sym) => {
      // Find the row for the symbol
      const rows = document.querySelectorAll('.sentiment-table tr, table tr');
      
      for (const row of Array.from(rows)) {
        const symbolCell = row.querySelector('td:first-child, th:first-child');
        if (symbolCell && symbolCell.textContent?.includes(sym)) {
          // Try to find percentage cells
          const cells = row.querySelectorAll('td');
          
          // FXSSI typically shows long percentage in one column
          for (let i = 0; i < cells.length; i++) {
            const text = cells[i].textContent || '';
            if (text.includes('%')) {
              const percentage = parseFloat(text.replace('%', ''));
              if (!isNaN(percentage)) {
                return {
                  longPercentage: percentage,
                  shortPercentage: 100 - percentage,
                };
              }
            }
          }
        }
      }
      
      return null;
    }, symbol);
    
    await browser.close();
    
    if (!data) {
      console.log(`[SentimentScraper] Symbol ${symbol} not found in FXSSI data`);
      return null;
    }
    
    return {
      symbol,
      source: 'FXSSI',
      longPercentage: data.longPercentage,
      shortPercentage: data.shortPercentage,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(`[SentimentScraper] Error fetching FXSSI for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch sentiment data from all sources
 */
export async function fetchAllSentiment(symbol: string): Promise<SentimentData[]> {
  console.log(`[SentimentScraper] Fetching sentiment data for ${symbol} from all sources`);
  
  const results = await Promise.allSettled([
    scrapeMyFxBook(symbol),
    scrapeDukascopy(symbol),
    scrapeFXSSI(symbol),
  ]);
  
  const sentimentData: SentimentData[] = [];
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      sentimentData.push(result.value);
    }
  }
  
  console.log(`[SentimentScraper] Successfully fetched ${sentimentData.length} sentiment sources for ${symbol}`);
  
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

