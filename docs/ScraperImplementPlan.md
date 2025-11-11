# Crawlee + Playwright Implementation Plan (with 2Captcha) — Proxmox LXC Deployment

This plan replaces the current scrapers with a robust Crawlee + Playwright solution, integrates 2Captcha for challenge solving, and prepares a production-ready Proxmox LXC deployment.

## Goals and Scope

- Replace `server/services/sentimentScraper.ts`, `server/services/sentimentScraperSimple.ts`, and `server/services/newsScraper.ts` with modular Crawlee-based scrapers.
- Support headless browser operations (Playwright), proxies, browser fingerprinting, and CAPTCHA challenge solving via 2Captcha.
- Produce clean, structured data outputs validated against schemas (TypeScript + Zod).
- Implement resilient error handling, retry/backoff, rate limiting, and observability.
- Package the solution for Proxmox LXC deployment.

## Architecture Overview

- Core stack: Crawlee (TypeScript) + PlaywrightCrawler for JS-rendered pages, CheerioCrawler for static/HTML pages.
- Anti-bot: Browser fingerprints (Crawlee), rotating proxies, realistic headers/user agents, randomized timing.
- CAPTCHA: 2Captcha integration (reCAPTCHA v2/v3, hCaptcha, Cloudflare Turnstile) with detection, provider request/polling, and token injection.
- Data layer: Structured outputs with schemas for SentimentData, EconomicCalendarEvent, and ScrapedNews. Optional persistence via Drizzle if needed.
- Observability: Structured logs, error counters, success rates, latency metrics, and per-source parse completeness.

### Proposed Project Structure (server side)

```
server/services/scraping/
  core/
    config.ts              # Env + typed config
    schemas.ts             # Zod schemas for outputs
    crawlerBase.ts         # Common crawler settings (Playwright/Cheerio), proxies, fingerprints
    errorHandling.ts       # Standardized retry/backoff and failure handling
    rateLimiter.ts         # Per-host throttling and concurrency
  captcha/
    detect.ts              # Detect reCAPTCHA v2/v3, hCaptcha, Turnstile
    twoCaptcha.ts          # 2Captcha API wrapper (solve & poll)
    inject.ts              # Token injection utilities per CAPTCHA type
  sentiment/
    myfxbook.ts
    dukascopy.ts
    fxssi.ts
    index.ts               # fetchAllSentiment(), calculateAverageSentiment()
  fundamentals/
    tradingEconomics.ts
    fred.ts                # optional
    worldGoldCouncil.ts    # optional
  news/
    reuters.ts
    kitco.ts
    index.ts               # scrapeAllNews()
  social/
    twitter.ts             # only if ToS permits, otherwise use official APIs
    reddit.ts              # optional
```

Routers (`server/routers/*.ts`) will call new service functions and return structured data.

## Environment & Configuration

Create/update `.env`:

```
NODE_ENV=production
PLAYWRIGHT_HEADLESS=true
CRAWLEE_MAX_CONCURRENCY=6
CRAWLEE_NAVIGATION_TIMEOUT_MS=45000
CRAWLEE_MAX_REQUEST_RETRIES=3

PROXY_URLS=http://user:pass@proxy1:port,http://user:pass@proxy2:port

CAPTCHA_PROVIDER=2captcha
CAPTCHA_API_KEY=your-2captcha-key
CAPTCHA_POLL_INTERVAL_MS=3000
CAPTCHA_MAX_WAIT_MS=120000

LOG_LEVEL=info
``` 

Note: Keep secrets in a secure store for production. In LXC, use `/etc/environment` or a dedicated secrets file with appropriate permissions.

## Core Implementation Details

### PlaywrightCrawler baseline (TypeScript outline)

```ts
// server/services/scraping/core/crawlerBase.ts
import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';

export function createPlaywrightCrawler(opts?: Partial<ConstructorParameters<typeof PlaywrightCrawler>[0]>) {
  const proxyConfiguration = new ProxyConfiguration({
    proxyUrls: process.env.PROXY_URLS?.split(',').map(s => s.trim()).filter(Boolean) ?? [],
  });

  const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    maxConcurrency: Number(process.env.CRAWLEE_MAX_CONCURRENCY ?? 6),
    maxRequestRetries: Number(process.env.CRAWLEE_MAX_REQUEST_RETRIES ?? 3),
    browserPoolOptions: { useFingerprints: true },
    navigationTimeoutSecs: Number(process.env.CRAWLEE_NAVIGATION_TIMEOUT_MS ?? 45000) / 1000,
    ...opts,
  });

  return crawler;
}
```

### CAPTCHA detection + 2Captcha integration (TypeScript outline)

```ts
// server/services/scraping/captcha/detect.ts
import type { Page } from 'playwright';

export type CaptchaType = 'recaptcha_v2' | 'recaptcha_v3' | 'hcaptcha' | 'turnstile';

export async function detectCaptcha(page: Page): Promise<{ type: CaptchaType; sitekey: string } | null> {
  // reCAPTCHA v2
  const v2Key = await page.locator('.g-recaptcha').first().getAttribute('data-sitekey').catch(() => null)
    || await page.locator('iframe[src*="google.com/recaptcha/api2"]').first().evaluate(el => new URL(el.src).searchParams.get('k')).catch(() => null);
  if (v2Key) return { type: 'recaptcha_v2', sitekey: v2Key };

  // hCaptcha
  const hKey = await page.locator('.h-captcha').first().getAttribute('data-sitekey').catch(() => null)
    || await page.locator('iframe[src*="hcaptcha.com"]').first().evaluate(el => new URL(el.src).searchParams.get('sitekey')).catch(() => null);
  if (hKey) return { type: 'hcaptcha', sitekey: hKey };

  // Cloudflare Turnstile
  const tKey = await page.locator('iframe[src*="challenges.cloudflare.com"]').first()
    .evaluate(el => new URL(el.src).searchParams.get('k')).catch(() => null);
  if (tKey) return { type: 'turnstile', sitekey: tKey };

  // reCAPTCHA v3 often requires site-specific parsing; add custom detection per site if needed.
  return null;
}

// server/services/scraping/captcha/twoCaptcha.ts
import axios from 'axios';

const API_KEY = process.env.CAPTCHA_API_KEY ?? '';
const POLL_MS = Number(process.env.CAPTCHA_POLL_INTERVAL_MS ?? 3000);
const MAX_WAIT_MS = Number(process.env.CAPTCHA_MAX_WAIT_MS ?? 120000);

export async function solveWith2Captcha(type: 'recaptcha_v2' | 'recaptcha_v3' | 'hcaptcha' | 'turnstile', sitekey: string, pageurl: string, extra?: Record<string, string>) {
  if (!API_KEY) throw new Error('2Captcha API key missing');
  const params: Record<string, string> = {
    key: API_KEY,
    method: type === 'hcaptcha' ? 'hcaptcha' : type === 'turnstile' ? 'turnstile' : 'userrecaptcha',
    googlekey: sitekey,
    pageurl,
    json: '1',
    soft_id: '3340', // optional affiliate ID
    ...extra,
  };

  // For v3: include version=v3 and action/min_score if known
  if (type === 'recaptcha_v3') Object.assign(params, { version: 'v3', action: extra?.action ?? 'verify', min_score: extra?.min_score ?? '0.3' });

  const inRes = await axios.get('https://2captcha.com/in.php', { params });
  if (inRes.data.status !== 1) throw new Error(`2Captcha in.php error: ${inRes.data.request}`);
  const id = inRes.data.request;

  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_MS) {
    await new Promise(r => setTimeout(r, POLL_MS));
    const res = await axios.get('https://2captcha.com/res.php', { params: { key: API_KEY, action: 'get', id, json: 1 } });
    if (res.data.status === 1) return String(res.data.request);
    if (res.data.request !== 'CAPCHA_NOT_READY') throw new Error(`2Captcha res.php error: ${res.data.request}`);
  }
  throw new Error('2Captcha timeout');
}

// server/services/scraping/captcha/inject.ts
import type { Page } from 'playwright';
import type { CaptchaType } from './detect';

export async function injectToken(page: Page, type: CaptchaType, token: string) {
  if (type === 'recaptcha_v2') {
    await page.evaluate((t) => {
      const textarea = document.createElement('textarea');
      textarea.name = 'g-recaptcha-response';
      textarea.style.display = 'none';
      textarea.value = t;
      document.body.appendChild(textarea);
      const hidden = document.querySelector('input[name="g-recaptcha-response"]') as HTMLInputElement | null;
      if (hidden) hidden.value = t;
      document.dispatchEvent(new Event('change'));
    }, token);
  } else if (type === 'hcaptcha') {
    await page.evaluate((t) => {
      const textarea = document.createElement('textarea');
      textarea.name = 'h-captcha-response';
      textarea.style.display = 'none';
      textarea.value = t;
      document.body.appendChild(textarea);
      document.dispatchEvent(new Event('change'));
    }, token);
  } else if (type === 'turnstile') {
    await page.evaluate((t) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'cf-turnstile-response';
      input.value = t;
      document.body.appendChild(input);
      document.dispatchEvent(new Event('change'));
    }, token);
  } else if (type === 'recaptcha_v3') {
    await page.evaluate((t) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'g-recaptcha-response';
      input.value = t;
      document.body.appendChild(input);
    }, token);
  }
}
```

### Usage in a crawler request handler (outline)

```ts
import { detectCaptcha } from '../captcha/detect';
import { solveWith2Captcha } from '../captcha/twoCaptcha';
import { injectToken } from '../captcha/inject';

// inside requestHandler
const cap = await detectCaptcha(page);
if (cap) {
  const token = await solveWith2Captcha(cap.type, cap.sitekey, request.url);
  await injectToken(page, cap.type, token);
  await Promise.race([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => null),
    page.waitForTimeout(2000),
  ]);
}
```

## Error Handling, Retries, and Rate Limiting

- Configure `maxRequestRetries`, exponential backoff, and per-host rate limits.
- Distinguish parse errors, anti-bot errors, HTTP errors, and CAPTCHA failures; log with source and URL.
- Add circuit breakers: temporarily pause crawling of hosts with high block rates.
- Persist failed request metadata for later inspection.

## Data Output and Validation

- Define Zod schemas for:
  - `SentimentData`: symbol, source, longPercentage, shortPercentage, volume?, longPositions?, shortPositions?, timestamp.
  - `EconomicCalendarEvent`: id, source, title, country?, impact?, eventTime, forecast?, previous?, actual?.
  - `ScrapedNews`: id, sourceId, title, content?, url?, author?, publishedAt?, scrapedAt.
- Validate before returning to routers; include `sourceCount` and averages for sentiment aggregation.

## Proxmox LXC Deployment Plan

### Container creation (Debian 12 recommended)

1. In Proxmox UI or CLI, download Debian 12 template (e.g., `debian-12-standard`).
2. Create an unprivileged LXC container:
   - Features: `nesting=1`, `keyctl=1`.
   - Resources: CPU 2–4 vCPU, RAM 4–8 GB (depending on concurrency).
   - Disk: 10–20 GB.
   - Network: veth + outbound internet access.
3. Start the container and access shell.

### System setup inside LXC

```bash
apt update && apt -y upgrade
apt -y install curl ca-certificates git unzip build-essential

# Install Node.js 22 LTS (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt -y install nodejs

# Enable corepack for pnpm
corepack enable

# Optional: create non-root app user
useradd -m -s /bin/bash appuser || true
mkdir -p /opt/xpa && chown -R appuser:appuser /opt/xpa

# Clone or copy project into /opt/xpa
cd /opt/xpa

# Install Playwright and its OS dependencies
npx playwright install --with-deps

# Fonts (for better rendering) — optional but recommended
apt -y install fonts-noto fonts-noto-color-emoji fonts-liberation
```

### App deployment workflow

1. Copy environment file to LXC (`/opt/xpa/.env` or `/etc/environment`).
2. Install dependencies: `pnpm install` (or `npm ci`).
3. Build if needed: `pnpm build`.
4. Run scrapers via Node (systemd or PM2):

```bash
# systemd unit example: /etc/systemd/system/xpa-scraper.service
[Unit]
Description=XPA Crawlee Scraper Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/xpa
EnvironmentFile=/opt/xpa/.env
ExecStart=/usr/bin/node ./server/index.js
Restart=always
RestartSec=5
User=appuser

[Install]
WantedBy=multi-user.target

systemctl daemon-reload
systemctl enable --now xpa-scraper
```

### Proxies and networking

- Confirm outbound proxy reachability from LXC (`curl https://api.ipify.org` via proxy).
- Use residential/mobile proxies when permissible for reduced CAPTCHA frequency.

## Implementation Phases & Tasks

Phase 0 — Planning & Schemas
- Define Zod schemas for sentiment, fundamentals, news outputs.
- Confirm target sources and ToS-compliant scraping approach.

Phase 1 — LXC & Environment
- Provision Debian 12 LXC with required features and resources.
- Install Node 22, Playwright + OS deps, fonts.
- Configure `.env` secrets (2Captcha key, proxies).

Phase 2 — Core Scaffolding
- Implement `crawlerBase.ts`, `config.ts`, `errorHandling.ts`, `rateLimiter.ts`.
- Implement CAPTCHA modules: `detect.ts`, `twoCaptcha.ts`, `inject.ts`.

Phase 3 — Sentiment Scrapers
- Implement MyFxBook, Dukascopy, FXSSI with cookie handling, selectors + fallbacks.
- Add CAPTCHA solve path and retry logic.
- Implement `fetchAllSentiment()` + aggregation.

Phase 4 — Fundamentals Scrapers
- Implement TradingEconomics (CheerioCrawler preferred, Playwright fallback).
- Add optional sources (FRED, WGC) as needed.

Phase 5 — News Scrapers
- Implement Reuters and Kitco flows; normalize outputs.
- Optional enrichment (summaries) using internal pipeline.

Phase 6 — Social Research (if permitted)
- Implement login flows with Playwright; strict rate limiting; proxies.
- Prefer official APIs where available.

Phase 7 — Observability & Benchmarks
- Add logging, metrics, error counters, and latencies.
- Run benchmarks: success rates, time-to-data, output completeness.

Phase 8 — Migration & Rollout
- Replace old services with new module exports; keep router contracts stable.
- Stage rollout, monitor, and backstop with fallbacks.

## Benchmarks & Acceptance Criteria

- Throughput: >= 2× baseline for static pages with CheerioCrawler; >= 1.5× successful extractions for JS pages.
- Stability: < 2% unhandled failures per source; retries cover transient errors.
- Data quality: >= 98% schema validation pass rate on structured outputs.
- Anti-bot resilience: measurable reduction in immediate blocks and CAPTCHA frequency vs baseline.

## Risks & Mitigations

- CAPTCHA variability (v3 scores): Implement site-specific handling and accept variability; escalate to alternate sources when needed.
- Legal/ToS: Respect site policies; prefer official APIs where available.
- Proxy reliability: Use multiple providers; add health checks and rotation.
- Dynamic UI changes: Use robust selectors; implement text-based fallbacks; add alerts for parse drop-offs.

## Rollback Plan

- Keep old scrapers callable behind a feature flag for one release cycle.
- On severe failures, revert to previous services and pause new crawlers.

## Example: Sentiment request handler integrating CAPTCHA (outline)

```ts
import { PlaywrightCrawler } from 'crawlee';
import { detectCaptcha } from '../captcha/detect';
import { solveWith2Captcha } from '../captcha/twoCaptcha';
import { injectToken } from '../captcha/inject';

const crawler = new PlaywrightCrawler({
  // ... base options (see crawlerBase.ts)
  requestHandler: async ({ page, request, log }) => {
    // Consent/cookie banners (best-effort)
    await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, a, [role="button"], .cc-accept, .cookie-accept')) as HTMLElement[];
      candidates.find(el => /accept|agree|ok|allow all|i agree/i.test(el.textContent || '') || /accept|agree|cookie/i.test(el.className || ''))?.click?.();
    }).catch(() => {});

    const cap = await detectCaptcha(page);
    if (cap) {
      const token = await solveWith2Captcha(cap.type, cap.sitekey, request.url);
      await injectToken(page, cap.type, token);
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => null),
        page.waitForTimeout(2000),
      ]);
      log.info(`CAPTCHA solved: ${cap.type}`);
    }

    // TODO: extract sentiment fields, validate with Zod, push data
  },
  failedRequestHandler: async ({ request, log }) => {
    log.error(`Failed after retries: ${request.url}`);
  },
});
```

## Timeline (indicative)

- Week 1: LXC provisioning, core scaffolding, CAPTCHA module.
- Week 2: Sentiment scrapers + aggregation.
- Week 3: Fundamentals + News scrapers; observability.
- Week 4: Benchmarks, migration, and rollout.

## Maintenance

- Weekly monitoring of success rates and parse completeness.
- Monthly proxy audits; update fingerprints/user agents.
- Add site-specific overrides when major UI changes occur.

---

Prepared to proceed with Phase 1 (LXC & environment) and Phase 2 (core scaffolding). Once approved, we will implement modules under `server/services/scraping/` and wire them to existing routers.