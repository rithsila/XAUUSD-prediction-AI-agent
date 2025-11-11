import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
    // Proactively clear an invalid/stale session cookie to stop repeated
    // JWSSignatureVerificationFailed warnings on subsequent requests.
    try {
      const cookieHeader = opts.req.headers.cookie || "";
      if (cookieHeader.includes(`${COOKIE_NAME}=`)) {
        const cookieOptions = getSessionCookieOptions(opts.req);
        opts.res.clearCookie(COOKIE_NAME, cookieOptions);
      }
    } catch {
      // No-op: cookie clearing is a best-effort improvement
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
