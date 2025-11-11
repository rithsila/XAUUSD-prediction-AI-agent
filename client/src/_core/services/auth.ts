import { getLoginUrl } from "@/const";

export async function loginWithCredentials(
  identifier: string,
  password: string,
  rememberMe: boolean
): Promise<{ ok: boolean; redirect?: string; error?: string; shouldFallbackToDev?: boolean }> {
  try {
    const resp = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password, rememberMe }),
    });

    if (resp.status === 404 || resp.status === 403) {
      return { ok: false, shouldFallbackToDev: true };
    }

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({ error: "Login failed" }));
      const msg = typeof data?.error === "string" ? data.error : "Login failed";
      return { ok: false, error: msg };
    }

    const data = await resp.json().catch(() => ({}));
    const redirect = typeof data?.redirect === "string" ? data.redirect : "/";
    return { ok: true, redirect };
  } catch (e) {
    return { ok: false, shouldFallbackToDev: true };
  }
}

export function devLogin(): void {
  // Direct to backend dev-login endpoint regardless of client getLoginUrl
  window.location.assign("/api/auth/dev-login");
}