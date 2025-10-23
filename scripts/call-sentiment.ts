import "dotenv/config";
import { appRouter } from "../server/routers";

async function main() {
  const caller = appRouter.createCaller({ req: {} as any, res: {} as any, user: null });
  try {
    const result = await caller.sentiment.refresh({ symbol: "XAUUSD" });
    console.log("Refresh result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error calling sentiment.refresh:", err);
  }
}

main();