import { defineConfig } from "drizzle-kit";

const host = process.env.DB_HOST;
const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
const user = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_DATABASE;

if (!host || !port || !user || !password || !database) {
  throw new Error("DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE are required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host,
    port,
    user,
    password,
    database,
    // For MySQL-compatible clouds (e.g., TiDB/PlanetScale) SSL must be an object per mysql2
    ssl: { rejectUnauthorized: true },
  },
});
