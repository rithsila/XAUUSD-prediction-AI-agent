import puppeteer from "puppeteer";

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  const url = "http://localhost:5173/sentiment";
  console.log(`[UI Verify] Navigating to ${url}`);
  await page.goto(url, { waitUntil: "networkidle2" });

  // Ensure we are authenticated (app_session_id cookie should be present)
  const cookies = await page.cookies();
  const hasSession = cookies.some(c => c.name === "app_session_id");
  console.log(`[UI Verify] Session cookie present: ${hasSession}`);

  // Wait for the aggregated card to appear
  await page.waitForSelector('[data-slot="card-title"]', { visible: true });

  // Verify the page title
  const hasRetailSentimentHeader = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll("h1"));
    return headers.some(h => /Retail Sentiment/i.test(h.textContent || ""));
  });
  console.log(`[UI Verify] Retail Sentiment header found: ${hasRetailSentimentHeader}`);

  // Wait for the Broker Sentiment Breakdown card and extract broker labels
  const brokerLabels = await page.evaluate(() => {
    // Find the Card that contains the Broker Sentiment Breakdown title
    const cards = Array.from(document.querySelectorAll('[data-slot="card"]')) as HTMLDivElement[];
    const brokerCard = cards.find(card => {
      const titleEl = card.querySelector('[data-slot="card-title"]');
      return /Broker Sentiment Breakdown/i.test(titleEl?.textContent || "");
    });

    if (!brokerCard) return [];

    // Inside the card, find all h3 labels that describe each broker
    const labels = Array.from(brokerCard.querySelectorAll('h3.font-semibold'))
      .map(el => (el.textContent || "").trim())
      .filter(text => text.length > 0);

    return labels;
  });

  console.log(`[UI Verify] Broker labels (${brokerLabels.length}):`, brokerLabels);

  // Ensure uniqueness and that we have exactly 8 sources
  const uniqueLabels = Array.from(new Set(brokerLabels));
  console.log(`[UI Verify] Unique broker labels (${uniqueLabels.length}):`, uniqueLabels);

  const expectedSources = [
    "MyFxBook",
    "Dukascopy",
    "FXSSI",
    "OANDA",
    "IG",
    "FXCM",
    "Pepperstone",
    "Forex.com",
  ];

  const missing = expectedSources.filter(s => !uniqueLabels.includes(s));
  const extra = uniqueLabels.filter(s => !expectedSources.includes(s));

  // Also verify the weighted source count text exists
  const weightedSourceCount = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[data-slot="card"]')) as HTMLDivElement[];
    const aggregatedCard = cards.find(card => {
      const titleEl = card.querySelector('[data-slot="card-title"]');
      return /Market Sentiment/i.test(titleEl?.textContent || "");
    });

    if (!aggregatedCard) return null;

    const descEl = aggregatedCard.querySelector('[data-slot="card-description"]');
    const text = (descEl?.textContent || "").trim();
    // Extract number before "broker sources"
    const match = text.match(/from\s+(\d+)\s+broker sources/i);
    return match ? Number(match[1]) : null;
  });

  console.log(`[UI Verify] Weighted source count: ${weightedSourceCount}`);

  const result = {
    hasSession,
    hasRetailSentimentHeader,
    brokerLabels,
    uniqueLabels,
    expectedSources,
    missing,
    extra,
    weightedSourceCount,
  };

  console.log("[UI Verify] Summary:", JSON.stringify(result, null, 2));

  // Exit code: 0 if pass, 1 if fail
  const pass = uniqueLabels.length === 8 && missing.length === 0 && extra.length === 0 && weightedSourceCount === 8;

  await browser.close();

  if (!pass) {
    console.error("[UI Verify] FAILED: UI does not show exactly the expected 8 broker labels.");
    process.exit(1);
  }

  console.log("[UI Verify] PASSED: Sentiment page shows exactly 8 sources with a single label per broker.");
}

run().catch(err => {
  console.error("[UI Verify] ERROR:", err);
  process.exit(1);
});