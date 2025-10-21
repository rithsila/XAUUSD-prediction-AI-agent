/**
 * Test script for XAUUSD Prediction Agent API
 * Run with: npx tsx test-api.ts
 */

import { appRouter } from "./server/routers";

async function testPredictionGeneration() {
  console.log("\n🧪 Testing Prediction Generation...");
  
  const caller = appRouter.createCaller({
    user: null,
    req: {} as any,
    res: {} as any,
  });

  try {
    const result = await caller.predictions.generate({
      symbol: "XAUUSD",
      horizon: "15m",
      marketContext: {
        currentPrice: 2650.50,
        dxy: 104.25,
        yields: 4.35,
      },
      technicalContext: {
        adx: 28,
        atr: 15.5,
        regime: "trending",
      },
    });

    console.log("✅ Prediction generated successfully!");
    console.log("   ID:", result.id);
    console.log("   Direction:", result.prediction.direction);
    console.log("   Confidence:", result.prediction.confidence + "%");
    console.log("   Range:", result.prediction.rangeMin, "-", result.prediction.rangeMax, "pips");
    console.log("   Rationale:", result.prediction.rationale);
    
    return result;
  } catch (error) {
    console.error("❌ Prediction generation failed:", error);
    throw error;
  }
}

async function testNewsAnalysis() {
  console.log("\n🧪 Testing News Sentiment Analysis...");
  
  const caller = appRouter.createCaller({
    user: null,
    req: {} as any,
    res: {} as any,
  });

  try {
    const result = await caller.news.analyze({
      source: "Reuters",
      headline: "Federal Reserve signals potential interest rate cuts amid cooling inflation",
      body: "The Federal Reserve indicated today that it may consider reducing interest rates in the coming months as inflation shows signs of cooling. This dovish stance could impact gold prices positively.",
    });

    console.log("✅ News analyzed successfully!");
    console.log("   Sentiment Polarity:", result.sentiment.polarity);
    console.log("   Sentiment Score:", result.sentiment.score + "/100");
    console.log("   Topic:", result.sentiment.topic);
    
    return result;
  } catch (error) {
    console.error("❌ News analysis failed:", error);
    throw error;
  }
}

async function testLatestPrediction() {
  console.log("\n🧪 Testing Latest Prediction Retrieval...");
  
  const caller = appRouter.createCaller({
    user: null,
    req: {} as any,
    res: {} as any,
  });

  try {
    const result = await caller.predictions.latest({
      horizon: "15m",
    });

    if (result) {
      console.log("✅ Latest prediction retrieved!");
      console.log("   Direction:", result.direction);
      console.log("   Confidence:", result.confidence + "%");
    } else {
      console.log("ℹ️  No predictions available for 15m timeframe");
    }
    
    return result;
  } catch (error) {
    console.error("❌ Latest prediction retrieval failed:", error);
    throw error;
  }
}

async function testPredictionHistory() {
  console.log("\n🧪 Testing Prediction History...");
  
  const caller = appRouter.createCaller({
    user: null,
    req: {} as any,
    res: {} as any,
  });

  try {
    const result = await caller.predictions.history({
      limit: 5,
    });

    console.log("✅ Prediction history retrieved!");
    console.log("   Total predictions:", result.length);
    
    return result;
  } catch (error) {
    console.error("❌ Prediction history retrieval failed:", error);
    throw error;
  }
}

async function testMT5Notification() {
  console.log("\n🧪 Testing MT5 Notification...");
  
  const caller = appRouter.createCaller({
    user: null,
    req: {} as any,
    res: {} as any,
  });

  try {
    const result = await caller.mt5.notify({
      accountId: "TEST-ACCOUNT-123",
      signal: {
        symbol: "XAUUSD",
        timestamp: new Date().toISOString(),
        horizon: "15m",
        direction: "bull",
        confidence: 85,
        range: {
          min: 20,
          max: 50,
        },
        rationale: ["Fed dovish stance", "DXY weakness", "Strong technical momentum"],
      },
      risk: {
        tp: 2670.00,
        sl: 2645.00,
        rr: 2.5,
      },
    });

    console.log("✅ MT5 notification sent successfully!");
    console.log("   Status:", result.status);
    console.log("   ID:", result.id);
    
    return result;
  } catch (error) {
    console.error("❌ MT5 notification failed:", error);
    throw error;
  }
}

async function runAllTests() {
  console.log("🚀 Starting XAUUSD Prediction Agent API Tests\n");
  console.log("=" .repeat(60));

  try {
    // Test 1: Generate prediction
    await testPredictionGeneration();
    
    // Test 2: Analyze news
    await testNewsAnalysis();
    
    // Test 3: Get latest prediction
    await testLatestPrediction();
    
    // Test 4: Get prediction history
    await testPredictionHistory();
    
    // Test 5: Send MT5 notification
    await testMT5Notification();
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ All tests completed successfully!");
    console.log("=" .repeat(60) + "\n");
  } catch (error) {
    console.log("\n" + "=".repeat(60));
    console.log("❌ Tests failed!");
    console.log("=" .repeat(60) + "\n");
    process.exit(1);
  }
}

// Run tests
runAllTests();

