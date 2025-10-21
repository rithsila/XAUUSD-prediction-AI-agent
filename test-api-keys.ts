/**
 * Test script for API Key Management System
 * Run with: npx tsx test-api-keys.ts
 */

import { appRouter } from "./server/routers";

async function testCreateApiKey() {
  console.log("\n🧪 Testing API Key Creation...");
  
  const caller = appRouter.createCaller({
    user: { id: "test-user", name: "Test User", role: "admin" } as any,
    req: {} as any,
    res: {} as any,
  });

  try {
    const result = await caller.apiKeys.create({
      name: "Test MT5 EA",
      username: "trader123",
      type: "MT5",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });

    console.log("✅ API key created successfully!");
    console.log("   Name:", result.apiKey.name);
    console.log("   Type:", result.apiKey.type);
    console.log("   Username:", result.apiKey.username);
    console.log("   API Key:", result.apiKey.apiKey?.substring(0, 20) + "...");
    console.log("   Expires:", result.apiKey.expiresAt);
    
    return result.apiKey;
  } catch (error) {
    console.error("❌ API key creation failed:", error);
    throw error;
  }
}

async function testListApiKeys() {
  console.log("\n🧪 Testing API Key Listing...");
  
  const caller = appRouter.createCaller({
    user: { id: "test-user", name: "Test User", role: "admin" } as any,
    req: {} as any,
    res: {} as any,
  });

  try {
    const keys = await caller.apiKeys.list();

    console.log("✅ API keys retrieved successfully!");
    console.log("   Total keys:", keys.length);
    
    if (keys.length > 0) {
      console.log("\n   Keys:");
      keys.forEach((key, idx) => {
        console.log(`   ${idx + 1}. ${key.name} (${key.type}) - ${key.status}`);
      });
    }
    
    return keys;
  } catch (error) {
    console.error("❌ API key listing failed:", error);
    throw error;
  }
}

async function testWebhookGetPrediction(apiKey: string) {
  console.log("\n🧪 Testing Webhook - Get Prediction...");
  
  const caller = appRouter.createCaller({
    user: null,
    req: {} as any,
    res: {} as any,
  });

  try {
    const result = await caller.webhook.getPrediction({
      apiKey,
      horizon: "15m",
    });

    console.log("✅ Webhook prediction retrieved successfully!");
    console.log("   Status:", result.status);
    
    if (result.status === "ok" && "data" in result) {
      console.log("   Direction:", result.data.direction);
      console.log("   Confidence:", result.data.confidence + "%");
      console.log("   Range:", result.data.range.min, "-", result.data.range.max, "pips");
      console.log("   API Key Type:", result.meta.apiKeyType);
      console.log("   Username:", result.meta.username);
    }
    
    return result;
  } catch (error) {
    console.error("❌ Webhook prediction failed:", error);
    throw error;
  }
}

async function testWebhookGetMarketData(apiKey: string) {
  console.log("\n🧪 Testing Webhook - Get Market Data...");
  
  const caller = appRouter.createCaller({
    user: null,
    req: {} as any,
    res: {} as any,
  });

  try {
    const result = await caller.webhook.getMarketData({
      apiKey,
      horizon: "15m",
      newsLimit: 5,
    });

    console.log("✅ Webhook market data retrieved successfully!");
    console.log("   Status:", result.status);
    console.log("   Has Prediction:", result.prediction !== null);
    console.log("   News Count:", result.news.length);
    console.log("   API Key Type:", result.meta.apiKeyType);
    console.log("   Username:", result.meta.username);
    
    return result;
  } catch (error) {
    console.error("❌ Webhook market data failed:", error);
    throw error;
  }
}

async function testInvalidApiKey() {
  console.log("\n🧪 Testing Invalid API Key...");
  
  const caller = appRouter.createCaller({
    user: null,
    req: {} as any,
    res: {} as any,
  });

  try {
    await caller.webhook.getPrediction({
      apiKey: "invalid_key_12345",
      horizon: "15m",
    });

    console.error("❌ Should have thrown error for invalid API key!");
    return false;
  } catch (error: any) {
    if (error.code === "UNAUTHORIZED") {
      console.log("✅ Invalid API key correctly rejected!");
      console.log("   Error:", error.message);
      return true;
    } else {
      console.error("❌ Unexpected error:", error);
      throw error;
    }
  }
}

async function testRevokeApiKey(keyId: string) {
  console.log("\n🧪 Testing API Key Revocation...");
  
  const caller = appRouter.createCaller({
    user: { id: "test-user", name: "Test User", role: "admin" } as any,
    req: {} as any,
    res: {} as any,
  });

  try {
    await caller.apiKeys.revoke({ id: keyId });

    console.log("✅ API key revoked successfully!");
    
    return true;
  } catch (error) {
    console.error("❌ API key revocation failed:", error);
    throw error;
  }
}

async function testRevokedKeyAccess(apiKey: string) {
  console.log("\n🧪 Testing Revoked API Key Access...");
  
  const caller = appRouter.createCaller({
    user: null,
    req: {} as any,
    res: {} as any,
  });

  try {
    await caller.webhook.getPrediction({
      apiKey,
      horizon: "15m",
    });

    console.error("❌ Should have thrown error for revoked API key!");
    return false;
  } catch (error: any) {
    if (error.code === "UNAUTHORIZED" && error.message.includes("revoked")) {
      console.log("✅ Revoked API key correctly rejected!");
      console.log("   Error:", error.message);
      return true;
    } else {
      console.error("❌ Unexpected error:", error);
      throw error;
    }
  }
}

async function runAllTests() {
  console.log("🚀 Starting API Key Management System Tests\n");
  console.log("=" .repeat(60));

  let createdKey: any = null;

  try {
    // Test 1: Create API key
    createdKey = await testCreateApiKey();
    
    // Test 2: List API keys
    await testListApiKeys();
    
    // Test 3: Use API key to get prediction
    if (createdKey?.apiKey) {
      await testWebhookGetPrediction(createdKey.apiKey);
    }
    
    // Test 4: Use API key to get market data
    if (createdKey?.apiKey) {
      await testWebhookGetMarketData(createdKey.apiKey);
    }
    
    // Test 5: Test invalid API key
    await testInvalidApiKey();
    
    // Test 6: Revoke API key
    if (createdKey?.id) {
      await testRevokeApiKey(createdKey.id);
    }
    
    // Test 7: Test revoked key access
    if (createdKey?.apiKey) {
      await testRevokedKeyAccess(createdKey.apiKey);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ All API key management tests completed successfully!");
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

