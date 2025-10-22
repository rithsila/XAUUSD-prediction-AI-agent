import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function isEnabled(): boolean {
  return ENV.devLoginEnabled && !!ENV.cookieSecret;
}

function getDevUser() {
  const id = ENV.devUserId || "dev-user";
  const name = ENV.devUserName || "Developer";
  const email = ENV.devUserEmail || null;
  return { id, name, email };
}

export function registerAuthRoutes(app: Express) {
  app.get("/api/auth/dev-login", async (req: Request, res: Response) => {
    if (!isEnabled()) {
      res.status(403).json({ error: "Dev login disabled. Set DEV_LOGIN_ENABLED=true and JWT_SECRET." });
      return;
    }

    try {
      const devUser = getDevUser();

      // Upsert the dev user
      await db.upsertUser({
        id: devUser.id,
        name: devUser.name,
        email: devUser.email,
        loginMethod: "dev",
        lastSignedIn: new Date(),
      });

      // Create session token and set cookie
      const sessionToken = await sdk.createSessionToken(devUser.id, {
        name: devUser.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to home
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Auth] Dev login failed", error);
      res.status(500).json({ error: "Dev login failed" });
    }
  });
}