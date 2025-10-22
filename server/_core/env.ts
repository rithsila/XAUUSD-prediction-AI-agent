export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  // Manus OAuth removed; keep ownerId for role assignment
  ownerId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Dev login support
  devLoginEnabled: (process.env.DEV_LOGIN_ENABLED ?? "false").toLowerCase() === "true",
  devUserId: process.env.DEV_USER_ID ?? "",
  devUserName: process.env.DEV_USER_NAME ?? "",
  devUserEmail: process.env.DEV_USER_EMAIL ?? "",
};
