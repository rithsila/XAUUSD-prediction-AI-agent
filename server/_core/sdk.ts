import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};




class SDKServer {
  constructor() {}

  private deriveLoginMethod(
    platforms: unknown,
    fallback: string | null | undefined
  ): string | null {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set<string>(
      platforms.filter((p): p is string => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (
      set.has("REGISTERED_PLATFORM_MICROSOFT") ||
      set.has("REGISTERED_PLATFORM_AZURE")
    )
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }



  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  // Support JWT secret rotation using a comma-separated list in JWT_SECRET
  // First entry is used to sign new tokens; all entries are accepted for verification
  private getSecretsRaw(): string[] {
    const raw = ENV.cookieSecret || "";
    return raw
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }

  private getPrimarySecret(): Uint8Array {
    const primary = this.getSecretsRaw()[0] || "";
    return new TextEncoder().encode(primary);
  }

  private getAllSecrets(): Uint8Array[] {
    const secrets = this.getSecretsRaw();
    return secrets.map(s => new TextEncoder().encode(s));
  }

  /**
   * Create a session token for a user ID
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.id);
   */
  async createSessionToken(
    userId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId: userId,
        appId: ENV.appId,
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getPrimarySecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    const allSecrets = this.getAllSecrets();
    if (allSecrets.length === 0) {
      console.warn("[Auth] No JWT_SECRET configured; cannot verify session");
      return null;
    }

    // Try each configured secret to support rotation gracefully
    for (const secretKey of allSecrets) {
      try {
        const { payload } = await jwtVerify(cookieValue, secretKey, {
          algorithms: ["HS256"],
        });
        const { openId, appId, name } = payload as Record<string, unknown>;

        if (
          !isNonEmptyString(openId) ||
          !isNonEmptyString(appId) ||
          !isNonEmptyString(name)
        ) {
          console.warn("[Auth] Session payload missing required fields");
          return null;
        }

        return {
          openId,
          appId,
          name,
        };
      } catch (error) {
        // Continue to next secret
      }
    }

    console.warn("[Auth] Session verification failed: no matching secret (JWSSignatureVerificationFailed)");
    return null;
  }


  async authenticateRequest(req: Request): Promise<User> {
    // Regular authentication flow
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const sessionUserId = session.openId;
    const signedInAt = new Date();
    let user = await db.getUser(sessionUserId);

    // If user not in DB, fallback to synthetic user in dev if enabled
    if (!user) {
      if (ENV.devLoginEnabled) {
        const syntheticUser: User = {
          id: sessionUserId,
          name: session.name || null,
          email: null,
          loginMethod: "dev",
          role: sessionUserId === ENV.ownerId ? "admin" : "user",
          createdAt: signedInAt,
          lastSignedIn: signedInAt,
        };
        return syntheticUser;
      }
      throw ForbiddenError("User not found");
    }

    await db.upsertUser({
      id: user.id,
      lastSignedIn: signedInAt,
    });

    return user;
  }
}

export const sdk = new SDKServer();
