# API Key Management System

Complete guide for managing webhook access to the XAUUSD Prediction Agent for TradingView indicators and MT5 Expert Advisors.

---

## Overview

The API Key Management System provides secure, controlled access to prediction data through webhook endpoints. This enables automated trading systems to retrieve real-time market analysis without direct database access.

### Key Features

**Secure Authentication**
- Unique API keys with `xau_` prefix
- Per-key usage tracking and statistics
- Automatic expiration support
- Instant revocation capability

**Platform Support**
- TradingView webhook integration
- MT5 Expert Advisor HTTP requests
- Type-specific key management
- Username-based access control

**Admin Interface**
- Web-based key management dashboard
- Create, revoke, and delete keys
- Monitor usage statistics
- View last access timestamps

---

## Quick Start

### 1. Create an API Key

Navigate to `/api-keys` in the web interface and click **Create API Key**.

**Required Fields:**
- **Name**: Descriptive identifier (e.g., "My MT5 EA")
- **Username**: Associated user identifier
- **Type**: MT5 or TradingView
- **Expiration** (optional): Automatic expiration date

The system generates a unique API key in the format:
```
xau_274129b1f73d9bd4471fed1cfb4e5ab0657435d6974f7581
```

**⚠️ Important**: Copy the API key immediately - it cannot be retrieved later!

### 2. Configure Your Integration

#### TradingView Webhook

Add the webhook URL to your TradingView alert:

```
https://your-domain.com/api/trpc/webhook.getPrediction?apiKey=YOUR_API_KEY&horizon=15m
```

**Parameters:**
- `apiKey` (required): Your generated API key
- `horizon` (optional): `3m`, `5m`, `15m`, `1H`, or `4H` (default: latest)

#### MT5 Expert Advisor

Use the built-in HTTP request functions:

```cpp
#include <WinHttp.mqh>

string GetPrediction(string apiKey, string horizon) {
    string url = "https://your-domain.com/api/trpc/webhook.getPrediction";
    string params = "?apiKey=" + apiKey + "&horizon=" + horizon;
    
    string headers = "Content-Type: application/json\r\n";
    char data[];
    char result[];
    string resultHeaders;
    
    int res = WebRequest(
        "GET",
        url + params,
        headers,
        5000,  // timeout
        data,
        result,
        resultHeaders
    );
    
    if (res == 200) {
        return CharArrayToString(result);
    }
    
    return "";
}
```

---

## API Endpoints

### 1. Get Latest Prediction

**Endpoint:** `/api/trpc/webhook.getPrediction`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | string | Yes | Your API key |
| `horizon` | string | No | Timeframe: `3m`, `5m`, `15m`, `1H`, `4H` |

**Response (Success):**
```json
{
  "status": "ok",
  "data": {
    "symbol": "XAUUSD",
    "timestamp": "2025-10-20T06:23:48.000Z",
    "horizon": "15m",
    "direction": "bear",
    "confidence": 75,
    "range": {
      "min": -30,
      "max": -10
    },
    "rationale": [
      "The DXY at 104.25 suggests dollar strength...",
      "US10Y yields at 4.35% are relatively high..."
    ]
  },
  "meta": {
    "apiKeyType": "MT5",
    "username": "trader123"
  }
}
```

**Response (No Data):**
```json
{
  "status": "no_data",
  "message": "No predictions available"
}
```

**Response (Unauthorized):**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key"
  }
}
```

---

### 2. Get News Sentiment

**Endpoint:** `/api/trpc/webhook.getNewsSentiment`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | string | Yes | Your API key |
| `limit` | number | No | Number of news items (1-20, default: 10) |

**Response:**
```json
{
  "status": "ok",
  "data": [
    {
      "source": "Reuters",
      "headline": "Federal Reserve signals potential rate cuts...",
      "timestamp": "2025-10-20T06:15:00.000Z",
      "sentiment": {
        "polarity": 0.8,
        "score": 85,
        "topic": "policy"
      }
    }
  ],
  "meta": {
    "apiKeyType": "TradingView",
    "username": "trader123"
  }
}
```

---

### 3. Get Combined Market Data

**Endpoint:** `/api/trpc/webhook.getMarketData`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | string | Yes | Your API key |
| `horizon` | string | No | Prediction timeframe |
| `newsLimit` | number | No | Number of news items (1-20, default: 5) |

**Response:**
```json
{
  "status": "ok",
  "prediction": {
    "symbol": "XAUUSD",
    "timestamp": "2025-10-20T06:23:48.000Z",
    "horizon": "15m",
    "direction": "bear",
    "confidence": 75,
    "range": {
      "min": -30,
      "max": -10
    },
    "rationale": [...]
  },
  "news": [
    {
      "source": "Reuters",
      "headline": "...",
      "timestamp": "2025-10-20T06:15:00.000Z",
      "sentiment": {
        "polarity": 0.8,
        "score": 85,
        "topic": "policy"
      }
    }
  ],
  "meta": {
    "apiKeyType": "MT5",
    "username": "trader123",
    "timestamp": "2025-10-20T06:25:00.000Z"
  }
}
```

---

## Database Schema

The API keys are stored in the `apiKeys` table:

```sql
CREATE TABLE apiKeys (
  id VARCHAR(64) PRIMARY KEY,
  apiKey VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL,
  type ENUM('MT5', 'TradingView') NOT NULL,
  status ENUM('active', 'revoked', 'expired') DEFAULT 'active' NOT NULL,
  expiresAt TIMESTAMP NULL,
  lastUsedAt TIMESTAMP NULL,
  requestCount INT DEFAULT 0,
  createdBy VARCHAR(64),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Field Descriptions:**

| Field | Description |
|-------|-------------|
| `id` | Unique identifier (internal) |
| `apiKey` | Public API key (starts with `xau_`) |
| `name` | Human-readable key name |
| `username` | Associated username |
| `type` | Platform type (MT5 or TradingView) |
| `status` | Current status (active/revoked/expired) |
| `expiresAt` | Optional expiration timestamp |
| `lastUsedAt` | Last successful API call timestamp |
| `requestCount` | Total number of API calls |
| `createdBy` | User ID who created the key |
| `createdAt` | Creation timestamp |
| `updatedAt` | Last modification timestamp |

---

## Security

### Authentication Flow

1. **Client** sends request with `apiKey` query parameter
2. **Server** validates API key:
   - Check if key exists
   - Verify status is `active`
   - Check expiration date (if set)
3. **Server** updates usage statistics:
   - Increment `requestCount`
   - Update `lastUsedAt` timestamp
4. **Server** returns requested data with metadata

### Error Responses

**Invalid API Key:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key"
  }
}
```

**Revoked API Key:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "API key has been revoked"
  }
}
```

**Expired API Key:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "API key has expired"
  }
}
```

### Best Practices

**Do:**
- ✅ Store API keys securely (environment variables, encrypted storage)
- ✅ Use HTTPS for all API requests
- ✅ Set expiration dates for temporary integrations
- ✅ Monitor usage statistics regularly
- ✅ Revoke unused or compromised keys immediately
- ✅ Use different keys for different systems

**Don't:**
- ❌ Share API keys publicly (GitHub, forums, etc.)
- ❌ Hardcode API keys in source code
- ❌ Use the same key across multiple systems
- ❌ Ignore unusual usage patterns
- ❌ Keep expired or unused keys active

---

## Usage Examples

### TradingView Pine Script

```pinescript
//@version=5
indicator("XAUUSD AI Prediction", overlay=true)

// Alert configuration
alertcondition(true, title="Get Prediction", message='{"action": "get_prediction"}')

// Webhook URL (set in alert settings):
// https://your-domain.com/api/trpc/webhook.getPrediction?apiKey=YOUR_KEY&horizon=15m
```

### MT5 Expert Advisor (Complete Example)

```cpp
#property strict

input string ApiKey = "xau_your_api_key_here";
input string Horizon = "15m";
input int UpdateIntervalMinutes = 5;

datetime lastUpdate = 0;
string lastDirection = "";
int lastConfidence = 0;

int OnInit() {
    Print("XAUUSD Prediction Agent EA initialized");
    return(INIT_SUCCEEDED);
}

void OnTick() {
    // Update every N minutes
    if (TimeCurrent() - lastUpdate < UpdateIntervalMinutes * 60) {
        return;
    }
    
    // Get prediction
    string prediction = GetPrediction(ApiKey, Horizon);
    
    if (StringLen(prediction) > 0) {
        ParseAndTrade(prediction);
        lastUpdate = TimeCurrent();
    }
}

string GetPrediction(string apiKey, string horizon) {
    string url = "https://your-domain.com/api/trpc/webhook.getMarketData";
    string params = "?apiKey=" + apiKey + "&horizon=" + horizon + "&newsLimit=5";
    
    string headers = "Content-Type: application/json\r\n";
    char data[];
    char result[];
    string resultHeaders;
    
    int res = WebRequest(
        "GET",
        url + params,
        headers,
        5000,
        data,
        result,
        resultHeaders
    );
    
    if (res == 200) {
        return CharArrayToString(result);
    } else {
        Print("API Error: ", res);
        return "";
    }
}

void ParseAndTrade(string jsonData) {
    // Parse JSON response
    // Extract direction, confidence, range
    // Implement your trading logic here
    
    Print("Received prediction: ", jsonData);
}
```

### Python Script

```python
import requests
import json

API_KEY = "xau_your_api_key_here"
BASE_URL = "https://your-domain.com/api/trpc"

def get_prediction(horizon="15m"):
    """Get latest prediction"""
    url = f"{BASE_URL}/webhook.getPrediction"
    params = {
        "apiKey": API_KEY,
        "horizon": horizon
    }
    
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        data = response.json()
        if data["status"] == "ok":
            return data["data"]
    
    return None

def get_market_data(horizon="15m", news_limit=5):
    """Get prediction + news sentiment"""
    url = f"{BASE_URL}/webhook.getMarketData"
    params = {
        "apiKey": API_KEY,
        "horizon": horizon,
        "newsLimit": news_limit
    }
    
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        return response.json()
    
    return None

# Example usage
if __name__ == "__main__":
    prediction = get_prediction("15m")
    
    if prediction:
        print(f"Direction: {prediction['direction']}")
        print(f"Confidence: {prediction['confidence']}%")
        print(f"Range: {prediction['range']['min']} to {prediction['range']['max']} pips")
    
    market_data = get_market_data("15m", 5)
    
    if market_data:
        print(f"\nMarket Data:")
        print(f"Prediction: {market_data['prediction']['direction']}")
        print(f"News Count: {len(market_data['news'])}")
```

---

## Admin Operations

### Create API Key (via tRPC)

```typescript
const result = await trpc.apiKeys.create.mutate({
  name: "Production MT5 EA",
  username: "trader123",
  type: "MT5",
  expiresAt: "2025-12-31T23:59:59.000Z", // Optional
});

console.log("API Key:", result.apiKey.apiKey);
```

### List All Keys

```typescript
const keys = await trpc.apiKeys.list.query();

keys.forEach(key => {
  console.log(`${key.name} (${key.type}): ${key.status}`);
  console.log(`  Usage: ${key.requestCount} requests`);
  console.log(`  Last used: ${key.lastUsedAt}`);
});
```

### Revoke API Key

```typescript
await trpc.apiKeys.revoke.mutate({ id: "key-id-here" });
```

### Delete API Key

```typescript
await trpc.apiKeys.delete.mutate({ id: "key-id-here" });
```

---

## Monitoring

### Usage Statistics

Track API key usage through the admin dashboard:

- **Total Requests**: Number of successful API calls
- **Last Used**: Timestamp of most recent access
- **Status**: Active, Revoked, or Expired
- **Expiration**: Remaining time until expiration

### Rate Limiting (Recommended)

While not implemented by default, you can add rate limiting:

```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each API key to 100 requests per window
  keyGenerator: (req) => req.query.apiKey as string,
});

app.use('/api/trpc/webhook', apiLimiter);
```

---

## Troubleshooting

### Common Issues

**Issue: "Invalid API key" error**
- Verify the API key is copied correctly
- Check if the key has been revoked
- Ensure the key hasn't expired

**Issue: "No predictions available"**
- Generate a prediction first from the dashboard
- Check the horizon parameter matches available data
- Verify the prediction service is running

**Issue: CORS errors in browser**
- API keys are designed for server-side use
- Use server-side proxy for browser-based integrations
- Configure CORS headers if needed

**Issue: High latency**
- Predictions are generated on-demand (2-5 seconds)
- Consider caching results on your end
- Use the combined endpoint to reduce round trips

---

## Migration Guide

### From Direct Database Access

If you're currently accessing the database directly:

1. **Create API Key**: Generate a key for your system
2. **Update Code**: Replace database queries with webhook calls
3. **Test**: Verify data matches expected format
4. **Deploy**: Switch to production API key
5. **Remove**: Delete database credentials from your system

### From Previous Version

If upgrading from a version without API keys:

1. **Run Migration**: `pnpm db:push` to create `apiKeys` table
2. **Create Keys**: Generate keys for existing integrations
3. **Update Integrations**: Add `apiKey` parameter to requests
4. **Test**: Verify all integrations work correctly
5. **Monitor**: Check usage statistics for anomalies

---

## FAQ

**Q: Can I regenerate an API key?**
A: No, API keys cannot be regenerated. Create a new key and revoke the old one.

**Q: How many API keys can I create?**
A: There's no hard limit, but we recommend one key per integration for better tracking.

**Q: Do API keys work with all endpoints?**
A: API keys only work with webhook endpoints (`/webhook.*`). Admin endpoints require user authentication.

**Q: What happens when a key expires?**
A: The status automatically changes to "expired" and requests are rejected with a 401 error.

**Q: Can I change the expiration date?**
A: Not currently. Create a new key with the desired expiration and revoke the old one.

**Q: Are API keys encrypted in the database?**
A: API keys are stored as plain text. Ensure your database has proper access controls.

---

## Support

For issues or questions:
- **GitHub Issues**: Technical problems
- **Documentation**: Full integration guides
- **Email**: support@your-domain.com

---

**Last Updated**: October 20, 2025
**Version**: 2.0.0

