import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { createMT5Notification, updateMT5NotificationStatus } from "../db";
import { randomUUID } from "crypto";

export const mt5Router = router({
  /**
   * Push notification to MT5 EA
   */
  notify: publicProcedure
    .input(
      z.object({
        accountId: z.string(),
        signal: z.object({
          symbol: z.string(),
          timestamp: z.string(),
          horizon: z.string(),
          direction: z.enum(["bull", "bear", "neutral"]),
          confidence: z.number(),
          range: z.object({
            min: z.number(),
            max: z.number(),
          }),
          rationale: z.array(z.string()),
        }),
        risk: z
          .object({
            tp: z.number().optional(),
            sl: z.number().optional(),
            rr: z.number().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const notificationId = randomUUID();

        // Save notification to database
        await createMT5Notification({
          id: notificationId,
          accountId: input.accountId,
          predictionId: null, // Can be linked if needed
          signal: input.signal,
          risk: input.risk || null,
          status: "delivered", // In real implementation, this would be "pending" until confirmed
          deliveredAt: new Date(),
        });

        return {
          status: "delivered",
          id: notificationId,
        };
      } catch (error) {
        console.error("[MT5] Notification failed:", error);
        throw new Error("Failed to send MT5 notification");
      }
    }),

  /**
   * Get MT5 bridge status
   */
  status: publicProcedure.query(async () => {
    return {
      status: "online",
      lastCheck: new Date().toISOString(),
      connections: 0, // Placeholder
    };
  }),
});

