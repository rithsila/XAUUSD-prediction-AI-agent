import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { 
  createApiKey, 
  getAllApiKeys, 
  getApiKey, 
  revokeApiKey, 
  deleteApiKey,
  updateApiKeyUsage 
} from "../db";
import { randomBytes } from "crypto";
import type { ApiKey } from "../../drizzle/schema";

/**
 * API Keys Router
 * Manages API keys for TradingView and MT5 webhook access
 */
export const apiKeysRouter = router({
  /**
   * Create a new API key
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        username: z.string().min(1).max(100),
        type: z.enum(["MT5", "TradingView"]),
        expiresAt: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Generate unique API key
      const apiKey = `xau_${randomBytes(24).toString("hex")}`;
      const id = randomBytes(16).toString("hex");

      const newKey = await createApiKey({
        id,
        apiKey,
        name: input.name,
        username: input.username,
        type: input.type,
        status: "active",
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        createdBy: ctx.user?.id,
        requestCount: 0,
      });

      return {
        status: "ok" as const,
        apiKey: newKey,
      };
    }),

  /**
   * List all API keys
   */
  list: protectedProcedure.query(async () => {
    const keys = await getAllApiKeys();
    
    // Check for expired keys and update status
    const now = new Date();
    const keysWithStatus = keys.map((key: ApiKey) => {
      if (key.status === "active" && key.expiresAt && key.expiresAt < now) {
        return { ...key, status: "expired" as const };
      }
      return key;
    });

    return keysWithStatus;
  }),

  /**
   * Revoke an API key
   */
  revoke: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await revokeApiKey(input.id);
      return { status: "ok" as const };
    }),

  /**
   * Delete an API key
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await deleteApiKey(input.id);
      return { status: "ok" as const };
    }),

  /**
   * Validate API key (internal use)
   */
  validate: publicProcedure
    .input(z.object({ apiKey: z.string() }))
    .query(async ({ input }) => {
      const key = await getApiKey(input.apiKey);
      
      if (!key) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid API key",
        });
      }

      if (key.status === "revoked") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "API key has been revoked",
        });
      }

      if (key.expiresAt && key.expiresAt < new Date()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "API key has expired",
        });
      }

      // Update usage statistics
      await updateApiKeyUsage(input.apiKey);

      return {
        valid: true,
        type: key.type,
        username: key.username,
      };
    }),
});

