# Database Installation and Setup

This project uses MySQL (or compatible) via Drizzle ORM. Follow this guide to create the database, configure environment variables, apply the schema, and troubleshoot common issues.

Supported databases
- MySQL 8.x (recommended)
- TiDB Cloud (MySQL-compatible)
- MariaDB 10.x (works in most cases; use mysql_native_password if auth errors)

Prerequisites
- Node.js 22+
- pnpm 10+
- A MySQL-compatible server available locally or in the cloud

Option A: Quick setup with Docker (MySQL 8)
1) Start MySQL 8 container
```
docker run --name mysql8 \
  -e MYSQL_ROOT_PASSWORD=changeme \
  -e MYSQL_DATABASE=main \
  -e MYSQL_USER=app \
  -e MYSQL_PASSWORD=app123 \
  -p 3306:3306 -d mysql:8.3
```
2) Verify connectivity
- Host: localhost
- Port: 3306
- Database: main
- User: app / Password: app123

Option B: Existing MySQL/TiDB
If you have an existing server, create a dedicated database and user.

MySQL SQL (run in mysql shell as root or admin):
```
CREATE DATABASE main CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'app'@'%' IDENTIFIED BY 'app123';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX ON main.* TO 'app'@'%';
FLUSH PRIVILEGES;
```

Configure environment variables
Create/update .env.local (or use .env) with your connection string.
- DATABASE_URL=mysql://app:app123@localhost:3306/main
- JWT_SECRET=your-secure-jwt-secret
- OPENAI_API_KEY=your-openai-api-key
- OAUTH_SERVER_URL, VITE_OAUTH_PORTAL_URL, VITE_APP_ID as per OAuth setup

Note: drizzle.config.ts requires DATABASE_URL to run drizzle-kit commands. If missing, you will see: "DATABASE_URL is required to run drizzle commands".

Apply the database schema (migrations)
Run the project’s migration script:
```
pnpm db:push
```
This runs: drizzle-kit generate && drizzle-kit migrate, applying SQL migrations from the drizzle/ folder based on drizzle/schema.ts.

Verify installation
- Connect to the DB and list tables:
```
SHOW TABLES FROM main;
```
You should see (at minimum): users, predictions, newsEvents, mt5Notifications, apiKeys, sentimentData, newsSources, scrapedArticles, economicEvents, systemSettings.
- Start the dev server to ensure the app can connect:
```
pnpm dev
```
If DATABASE_URL is set correctly, database operations in server/db.ts will work. If not available, the app logs warnings like "[Database] Cannot ... database not available" but continues to run for non-DB features.

How to use (basic checks)
- Test API: "test-api.ts" can be used to exercise endpoints.
```
pnpm tsx test-api.ts
```
- Test API keys: "test-api-keys.ts" demonstrates API-key-related flows.
```
pnpm tsx test-api-keys.ts
```
- Logging in via OAuth will upsert a user record. The owner ID (OWNER_OPEN_ID) can be set to receive admin role automatically.

Connection string examples
- Local MySQL: mysql://app:app123@localhost:3306/main
- TiDB Cloud (example): mysql://<user>:<password>@<host>:<port>/main?ssl=true

Troubleshooting
- DATABASE_URL missing
  - Error: "DATABASE_URL is required to run drizzle commands". Add DATABASE_URL to .env and retry pnpm db:push.
- Access denied (ER_ACCESS_DENIED_ERROR)
  - Check user/password; ensure the user has privileges (SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX) on the database.
- Auth mode not supported (ER_NOT_SUPPORTED_AUTH_MODE)
  - On MariaDB/MySQL, create user with mysql_native_password:
```
ALTER USER 'app'@'%' IDENTIFIED WITH mysql_native_password BY 'app123';
```
  - Or upgrade mysql2 (already ^3.15.0 here) and ensure the server supports caching_sha2_password.
- ECONNREFUSED / ETIMEDOUT
  - DB not reachable. Verify host/port, firewall, container port mapping, and that the DB is listening on 0.0.0.0.
- Unknown database 'main'
  - Create the database first (CREATE DATABASE main) or adjust DATABASE_URL to match your DB name.
- Migration permission errors
  - Ensure your DB user has CREATE/ALTER/INDEX privileges for schema changes.
- Collation/charset issues
  - Use utf8mb4 and a modern collation (utf8mb4_0900_ai_ci on MySQL 8). Avoid utf8mb3.
- Too many connections
  - Use a single app instance during development. In production, consider connection pooling and proper server sizing.

Next steps
- See README.md for environment variables and quick start.
- See DEPLOYMENT.md for Docker Compose, cloud deployment, and production recommendations.