import "dotenv/config";
import { appRouter } from "../server/routers";

async function main() {
  const caller = appRouter.createCaller({ req: {} as any, res: {} as any, user: null });
  try {
    const result = await caller.sentiment.getLatest({ symbol: "XAUUSD" });
    console.log("Latest result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error calling sentiment.getLatest:", err);
  }
}

main();