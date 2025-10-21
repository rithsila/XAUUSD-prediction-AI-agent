import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { predictionsRouter } from "./routers/predictions";
import { newsRouter } from "./routers/news";
import { mt5Router } from "./routers/mt5";
import { apiKeysRouter } from "./routers/apiKeys";
import { webhookRouter } from "./routers/webhook";
import { sentimentRouter } from "./routers/sentiment";
import { automationRouter } from "./routers/automation";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Feature routers
  predictions: predictionsRouter,
  news: newsRouter,
  mt5: mt5Router,
  apiKeys: apiKeysRouter,
  webhook: webhookRouter,
  sentiment: sentimentRouter,
  automation: automationRouter,
});

export type AppRouter = typeof appRouter;
