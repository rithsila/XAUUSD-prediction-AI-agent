# XAUUSD Prediction Agent

A production-grade AI agent delivering real-time analysis and predictions for XAUUSD (Gold), combining news sentiment, fundamentals, and technical signals. Built with **OpenAI GPT-4**, **React**, **FastAPI-style tRPC**, and **MySQL**.

![XAUUSD Prediction Agent](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![OpenAI](https://img.shields.io/badge/AI-OpenAI%20GPT--4-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Features

### Core Functionality

**Real-time Prediction Generation**
- Multi-horizon predictions (3m, 5m, 15m, 1H, 4H)
- Direction analysis (Bull/Bear/Neutral)
- Confidence scoring (0-100%)
- Expected price range in pips
- Detailed rationale with key market drivers

**News Sentiment Analysis**
- AI-powered sentiment scoring
- Topic classification (policy, inflation, geopolitics)
- Polarity analysis (-1 to 1)
- Impact scoring (0-100)

**API Key Management**
- Secure webhook access for TradingView and MT5
- Create keys with expiration dates and usage tracking
- Platform-specific keys (MT5 or TradingView)
- Admin dashboard for key management

**MT5 Integration**
- Push notifications to MT5 Expert Advisors
- REST API endpoints for polling
- Signal delivery with risk parameters (TP/SL/RR)

**Modern Web Interface**
- Dark/Light theme support
- Responsive design (mobile, tablet, desktop)
- Interactive dashboard with prediction history

**Sentiment Dashboard**
- Aggregates multi-source positioning (MyFxBook, Dukascopy, FXSSI) with weighted averages
- Supports multiple symbols (e.g., XAUUSD, EURUSD, GBPUSD)
- Fast refresh and caching with React Query

**Automation & Alerts**
- Scheduled news scraping and automated analysis
- Optional Telegram alerts for predictions and high-impact news
- In-app Settings to configure bot token, channel ID, and alert preferences
- Test connection workflow to validate Telegram setup

**Secure Authentication**
- OAuth sign-in via Manus Auth portal
- Session cookies with automatic redirect on unauthorized API responses

---

## API Webhook Access

The system provides secure webhook endpoints for automated trading systems:

**Available Endpoints:**
- `/api/trpc/webhook.getPrediction` - Get latest prediction
- `/api/trpc/webhook.getNewsSentiment` - Get news sentiment
- `/api/trpc/webhook.getMarketData` - Combined prediction + news

**Authentication:**
All webhook endpoints require an API key. Create and manage keys at `/api-keys` in the web interface.

**Example Usage:**
```bash
curl "https://your-domain.com/api/trpc/webhook.getPrediction?apiKey=xau_your_key&horizon=15m"
```

**Complete Documentation:**
See [API_KEYS.md](./API_KEYS.md) for integration guides, code examples, and security best practices.

---

## Technology Stack

### Backend
- Runtime: Node.js 22 + TypeScript 5.9
- Web: Express 4 + tRPC 11
- AI: OpenAI client 6.x (GPT-4o)
- Database: MySQL (TiDB compatible)
- ORM: Drizzle ORM 0.44 + mysql2

### Frontend
- UI: React 19 + Vite 7
- Styling: Tailwind CSS 4 + shadcn/ui + Radix UI
- Data: TanStack React Query 5 + superjson
- Routing: Wouter 3
- Validation: Zod 4
- Testing: Vitest 2


---

## Quick Start

### Prerequisites

- Node.js 22+ and pnpm
- MySQL database (or TiDB)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xauusd-prediction-agent
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   
   Create `.env.local` file:
   ```env
   # Database
   DATABASE_URL=mysql://user:password@host:port/database
   
   # OpenAI (server/services/openai.ts)
   OPENAI_API_KEY=sk-...your-key-here
   
   # Auth & Cookies
   JWT_SECRET=your-secret-key
   OWNER_OPEN_ID=your-admin-open-id # optional, used for admin features
   
   # OAuth (Manus Auth)
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
   VITE_APP_ID=your-app-id
   
   # Branding (optional)
   VITE_APP_TITLE="XAUUSD Prediction Agent"
   VITE_APP_LOGO="https://your-cdn/logo.png"
   
   # Manus Forge API override (optional)
   BUILT_IN_FORGE_API_URL=https://forge.manus.im
   BUILT_IN_FORGE_API_KEY=forge-key
   ```
   
   Notes:
   - Telegram integration is configured within the app Settings page (bot token, channel ID, alert preferences). No environment variables are required for Telegram.
   - PORT is auto-detected if busy; you can set PORT=3000 to prefer a specific port.

4. **Push database schema**
   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Open browser**
   ```
   http://localhost:3000
   ```

---

## API Documentation

### Predictions

#### Generate Prediction
```typescript
POST /api/trpc/predictions.generate

Input:
{
  symbol: "XAUUSD",
  horizon: "15m" | "5m" | "3m" | "1H" | "4H",
  marketContext?: {
    currentPrice?: number,
    dxy?: number,
    yields?: number
  },
  technicalContext?: {
    adx?: number,
    atr?: number,
    regime?: string
  }
}

Output:
{
  status: "ok",
  id: "uuid",
  prediction: {
    direction: "bull" | "bear" | "neutral",
    confidence: 0-100,
    rangeMin: number,
    rangeMax: number,
    rationale: string[]
  }
}
```

#### Get Latest Prediction
```typescript
GET /api/trpc/predictions.latest

Query:
{
  horizon?: "15m" | "5m" | "3m" | "1H" | "4H"
}

Output: Prediction | null
```

#### Get Prediction History
```typescript
GET /api/trpc/predictions.history

Query:
{
  limit?: number (default: 50, max: 100)
}

Output: Prediction[]
```

### News

#### Analyze News Sentiment
```typescript
POST /api/trpc/news.analyze

Input:
{
  source: string,
  headline: string,
  body?: string
}

Output:
{
  status: "ok",
  sentiment: {
    polarity: -1 to 1,
    score: 0-100,
    topic: "policy" | "inflation" | "geopolitics" | "other"
  }
}
```

#### Get Latest News
```typescript
GET /api/trpc/news.latest

Query:
{
  limit?: number (default: 20, max: 50)
}

Output: NewsEvent[]
```

### MT5

#### Send Notification
```typescript
POST /api/trpc/mt5.notify

Input:
{
  accountId: string,
  signal: {
    symbol: string,
    timestamp: string,
    horizon: string,
    direction: "bull" | "bear" | "neutral",
    confidence: number,
    range: { min: number, max: number },
    rationale: string[]
  },
  risk?: {
    tp?: number,
    sl?: number,
    rr?: number
  }
}

Output:
{
  status: "delivered",
  id: "uuid"
}
```

### Sentiment

#### Refresh Sentiment
```typescript
POST /api/trpc/sentiment.refresh

Input:
{
  symbol?: string // default: "XAUUSD"
}

Output:
{
  success: true,
  symbol: string,
  sentiments: Array<{
    source: string,
    longPercentage: number,
    shortPercentage: number,
    volume?: number,
    longPositions?: number,
    shortPositions?: number,
    timestamp: string
  }>,
  weighted: {
    longPercentage: number,
    shortPercentage: number,
    sourceCount: number
  },
  timestamp: string
}
```

#### Get Latest Sentiment
```typescript
GET /api/trpc/sentiment.getLatest

Input:
{
  symbol?: string // default: "XAUUSD"
}

Output:
{
  symbol: string,
  sentiments: Array<{
    source: string,
    longPercentage: number,
    shortPercentage: number,
    volume?: number,
    longPositions?: number,
    shortPositions?: number,
    timestamp: string
  }>,
  weighted: {
    longPercentage: number,
    shortPercentage: number,
    sourceCount: number
  },
  lastUpdate: string
}
```

#### Get Available Symbols
```typescript
GET /api/trpc/sentiment.getSymbols

Output: string[]
```

#### Get Sentiment for Multiple Symbols
```typescript
GET /api/trpc/sentiment.getMultiple

Input:
{
  symbols?: string[] // defaults: ["XAUUSD", "EURUSD", "GBPUSD"]
}

Output:
Array<{
  symbol: string,
  weighted: {
    longPercentage: number,
    shortPercentage: number,
    sourceCount: number
  },
  sources: number,
  lastUpdate: string
}>
```

Notes:
- Sentiment sources include MyFxBook, Dukascopy, FXSSI, and an OANDA-like fallback. The system gracefully falls back to realistic mock data when a source is unavailable.

### API Keys

All endpoints below require authentication (session cookie). Use the web UI to sign in via OAuth, then call these mutations.

#### Create API Key
```typescript
POST /api/trpc/apiKeys.create

Input:
{
  name: string,
  username: string,
  type: "MT5" | "TradingView",
  expiresAt?: string // ISO date
}

Output:
{
  status: "ok",
  apiKey: {
    id: string,
    apiKey: string,
    name: string,
    username: string,
    type: "MT5" | "TradingView",
    status: "active" | "revoked" | "expired",
    expiresAt?: string,
    createdBy?: string,
    requestCount: number,
    createdAt?: string
  }
}
```

#### List API Keys
```typescript
GET /api/trpc/apiKeys.list

Output: Array<ApiKey> // expired status is computed when expiresAt < now
```

#### Revoke API Key
```typescript
POST /api/trpc/apiKeys.revoke

Input: { id: string }

Output: { status: "ok" }
```

#### Delete API Key
```typescript
POST /api/trpc/apiKeys.delete

Input: { id: string }

Output: { status: "ok" }
```

#### Validate API Key (Public)
```typescript
GET /api/trpc/apiKeys.validate

Input: { apiKey: string }

Output: { valid: true, type: "MT5" | "TradingView", username: string }
```

Note: Webhook endpoints automatically update API key usage counts on successful calls.

### Automation

Automate scraping, analysis, and Telegram alerts.

#### Get System Settings
```typescript
GET /api/trpc/automation.getSettings

Output:
{
  autoScrapingEnabled: boolean,
  scrapingInterval: number, // minutes (5-1440)
  autoPredictionEnabled: boolean,
  predictionInterval: number, // minutes (5-1440)
  telegramEnabled: boolean,
  telegramBotToken?: string | null,
  telegramChannelId?: string | null,
  telegramAlertOnPrediction: boolean,
  telegramAlertOnNews: boolean,
  minImpactScore: number, // 0-100
  updatedAt: string
}
```

#### Update Settings
```typescript
POST /api/trpc/automation.updateSettings

Input: Partial<{
  autoScrapingEnabled: boolean,
  scrapingInterval: number,
  autoPredictionEnabled: boolean,
  predictionInterval: number,
  telegramEnabled: boolean,
  telegramBotToken: string,
  telegramChannelId: string,
  telegramAlertOnPrediction: boolean,
  telegramAlertOnNews: boolean,
  minImpactScore: number
}>

Output: { success: true }
```

#### Test Telegram Connection
```typescript
POST /api/trpc/automation.testTelegram

Input: {
  botToken: string,
  channelId: string
}

Output: { success: boolean, error?: string }
```

#### Manually Scrape News
```typescript
POST /api/trpc/automation.scrapeNews

Output: {
  success: boolean,
  articlesScraped: number,
  eventsScraped: number,
  error?: string
}
```

#### Run Automated Analysis
```typescript
POST /api/trpc/automation.runAnalysis

Output: {
  articlesAnalyzed: number,
  predictionGenerated: boolean,
  predictionId?: string
}
```

#### News Sources
```typescript
GET /api/trpc/automation.getNewsSources
POST /api/trpc/automation.addNewsSource
GET /api/trpc/automation.getRecentArticles
GET /api/trpc/automation.getUpcomingEvents
```

---

## Database Schema

### Predictions Table
```sql
CREATE TABLE predictions (
  id VARCHAR(64) PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL DEFAULT 'XAUUSD',
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  horizon VARCHAR(10) NOT NULL,
  direction ENUM('bull', 'bear', 'neutral') NOT NULL,
  confidence INT NOT NULL,
  rangeMin INT,
  rangeMax INT,
  rationale JSON,
  technicalContext JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### News Events Table
```sql
CREATE TABLE newsEvents (
  id VARCHAR(64) PRIMARY KEY,
  source VARCHAR(100) NOT NULL,
  headline TEXT NOT NULL,
  body TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sentimentPolarity INT,
  sentimentScore INT,
  topic VARCHAR(50),
  processed BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### MT5 Notifications Table
```sql
CREATE TABLE mt5Notifications (
  id VARCHAR(64) PRIMARY KEY,
  accountId VARCHAR(100) NOT NULL,
  predictionId VARCHAR(64),
  signal JSON,
  risk JSON,
  status VARCHAR(20) DEFAULT 'pending',
  deliveredAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Testing

### Run API Tests
```bash
npx tsx test-api.ts
```

### Test Coverage
- ✅ Prediction generation with OpenAI
- ✅ News sentiment analysis
- ✅ Latest prediction retrieval
- ✅ Prediction history
- ✅ MT5 notification delivery

---

## Project Structure

```
xauusd-prediction-agent/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Home.tsx       # Main dashboard
│   │   │   ├── ApiKeys.tsx    # API key management
│   │   │   ├── Sentiment.tsx  # Sentiment dashboard
│   │   │   └── Settings.tsx   # System & Telegram settings
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # tRPC client
│   │   ├── contexts/      # React contexts (Theme)
│   │   └── index.css      # Global styles & theme
│   └── public/            # Static assets
├── server/                # Backend Express + tRPC
│   ├── routers/           # tRPC routers
│   │   ├── predictions.ts # Prediction endpoints
│   │   ├── news.ts        # News analysis endpoints
│   │   ├── mt5.ts         # MT5 integration
│   │   ├── webhook.ts     # Public API (Prediction/News/Combined)
│   │   ├── apiKeys.ts     # API keys CRUD & validation
│   │   ├── sentiment.ts   # Sentiment endpoints
│   │   └── automation.ts  # Scraping, analysis, Telegram tests
│   ├── services/          # Business logic
│   │   ├── openai.ts      # OpenAI integration
│   │   ├── sentimentScraperSimple.ts # Sentiment sources
│   │   └── telegram.ts    # Telegram helpers
│   ├── db.ts              # Database queries
│   └── routers.ts         # Main router
├── drizzle/               # Database schema & migrations
│   └── schema.ts          # Table definitions
├── test-api.ts            # API test suite
└── README.md              # This file
```

---

## Deployment

For a comprehensive, step-by-step guide covering Docker Compose, Vercel, Railway, Google Cloud Run, and VPS (PM2 + Nginx + SSL), see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Environment Setup

1. **Database**: Set up MySQL or TiDB instance
2. **Environment Variables**: Configure all required secrets
3. **Build**: Run `pnpm build`
4. **Start**: Run `pnpm start`

### Docker (Optional)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

### Cloud Deployment

The application is ready for deployment to:
- **Vercel** (recommended for frontend)
- **Railway** (full-stack)
- **AWS/GCP/Azure** (containerized)
- **DigitalOcean App Platform**

---

## Configuration

### OpenAI Settings

The agent uses GPT-4 with the following configuration:
- **Model**: `gpt-4o`
- **Temperature**: 0.7 (predictions), 0.5 (sentiment)
- **Response Format**: JSON structured output
- **Max Tokens**: 1000 (predictions), 500 (sentiment)

### Prediction Prompts

The system uses carefully engineered prompts that include:
- Market context (price, DXY, yields)
- Technical indicators (ADX, ATR, regime)
- Recent news sentiment
- Multi-factor analysis framework

---

## Security Considerations

### API Security
- Environment variables for sensitive data
- Input validation with Zod schemas
- Rate limiting (recommended for production)
- CORS configuration

### Data Security
- No API keys in client-side code
- Secure database connections
- Session-based authentication (optional)

---

## Performance

### Benchmarks
- **Prediction Generation**: ~2-5 seconds (OpenAI API latency)
- **News Analysis**: ~1-3 seconds
- **Database Queries**: <50ms
- **Frontend Load**: <1 second

### Optimization Tips
- Cache predictions for same timeframe
- Batch news analysis
- Use database indexes
- Implement Redis for caching

---

## Troubleshooting

### Common Issues

**OpenAI API Errors**
- Verify API key is valid
- Check billing status
- Ensure baseURL is set correctly

**Database Connection Issues**
- Verify DATABASE_URL format
- Check network connectivity
- Ensure database exists

**Frontend Not Loading**
- Clear browser cache
- Check console for errors
- Verify API endpoints are accessible

---

## Roadmap

### Planned Features
- [ ] WebSocket for real-time updates
- [ ] Advanced charting with TradingView integration
- [ ] Backtesting framework
- [ ] Performance metrics dashboard
- [ ] Email/Telegram notifications
- [ ] Multi-symbol support (EURUSD, BTCUSD, etc.)
- [ ] Machine learning model training
- [ ] Historical data analysis

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

---

## License

MIT License - see LICENSE file for details

---

## Support

For issues, questions, or feature requests:
- **GitHub Issues**: [Create an issue](https://github.com/your-repo/issues)
- **Documentation**: [Full docs](https://docs.your-site.com)
- **Email**: support@your-domain.com

---

## Acknowledgments

- **OpenAI** for GPT-4 API
- **shadcn/ui** for beautiful UI components
- **tRPC** for type-safe API layer
- **Drizzle ORM** for database management

---

## Disclaimer

**This software is for informational and educational purposes only.**

The predictions and analysis provided by this agent should **NOT** be considered financial advice. Trading gold (XAUUSD) and other financial instruments involves substantial risk of loss. Always conduct your own research and consult with qualified financial advisors before making trading decisions.

The developers and contributors of this project are not responsible for any financial losses incurred from using this software.

---

**Built with ❤️ by the XAUUSD Prediction Agent Team**

*Powered by OpenAI GPT-4*

