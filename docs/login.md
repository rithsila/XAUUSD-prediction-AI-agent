# Login Page Implementation

This document describes the Login page added under `client/src/pages/Login.tsx`, its integration with the existing authentication flow, security considerations, and testing.

## Summary
- Responsive login form with Email/Username and Password fields
- Client-side validation and error handling
- "Remember Me" checkbox (persistent session semantics)
- "Forgot Password" dialog with guidance
- Integration with the existing dev login flow (`/api/auth/dev-login`)
- Session management via HttpOnly, Secure cookies
- Tests: cookie security unit tests (server) and a Puppeteer E2E script verifying the login UI and dev login behavior

## Files Added
- `client/src/pages/Login.tsx`: Login UI and client-side logic
- `scripts/verify-login-ui.ts`: E2E script using Puppeteer
- `server/_core/cookies.test.ts`: Unit tests verifying cookie flags

## Routing Integration
A new route is registered in `client/src/App.tsx`:

- `/login` → renders the Login page

If the user is already authenticated, the page redirects to `/`.

## Authentication Flow
The project currently uses a development login endpoint:

- `GET /api/auth/dev-login` → creates a session token, sets a cookie, and redirects to `/`

The Login page detects whether a production email/password endpoint exists (`POST /api/auth/login`). If it is missing or disabled, the page falls back to dev login and navigates to `/api/auth/dev-login`.

### Enabling Dev Login
Set the following environment variables for the server:
- `DEV_LOGIN_ENABLED=true`
- `JWT_SECRET=<your-secure-secret>`

Optional overrides for the synthetic dev user:
- `DEV_USER_ID` (default: `dev-user`)
- `DEV_USER_NAME` (default: `Developer`)
- `DEV_USER_EMAIL` (default: none)

### Production Email/Password Login (Future)
If you later add `POST /api/auth/login`:
- Expect JSON payload: `{ identifier: string, password: string, rememberMe: boolean }`
- Return `{ redirect?: string }` on success and set the session cookie on the response
- Consider CSRF protection (double-submit cookie or token validation) and rate-limiting
- Use a password hashing strategy (Argon2/PBKDF2) server-side and do NOT store plaintext passwords

## Security Considerations
- Cookies are set with `httpOnly`, `secure`, and `sameSite` per `server/_core/cookies.ts`
  - `secure` is enabled when the request is HTTPS or `x-forwarded-proto` contains `https`
  - `sameSite` is `none` for secure requests, otherwise `lax`
- Session tokens are JWTs signed with `JWT_SECRET`. Rotation is supported by providing multiple comma-separated secrets.
- Client-side validation prevents obviously invalid input; the UI does not reflect raw input back to the DOM as HTML, mitigating reflected XSS risks.
- Always deploy behind HTTPS in production to ensure secure credential transmission.

### Remember Me
- Dev login sets an expiration of `ONE_YEAR_MS` (1 year); cookies persist across sessions.
- For a traditional login, pass `rememberMe` and configure the server to set a longer or session-only cookie accordingly.

### Forgot Password
- The UI provides a "Forgot Password" dialog prompting users to contact administrators.
- When implementing a real password reset:
  - Generate time-limited reset tokens
  - Send reset links via email
  - Enforce strong password policy and rate-limit reset attempts

## Testing

### Unit Tests (Server)
- `server/_core/cookies.test.ts` validates cookie flags for HTTP vs HTTPS and forwarded protocols.
- Run: `pnpm test`

### End-to-End (Puppeteer)
- `scripts/verify-login-ui.ts` navigates to `/login`, verifies the UI fields, performs dev login, and asserts the session cookie exists.
- Run the backend at `http://localhost:3000` first, then execute:
  - `pnpm tsx scripts/verify-login-ui.ts`

### Cross-Browser Compatibility
- The UI uses TailwindCSS and Radix UI components and should render consistently across modern browsers.
- For comprehensive cross-browser testing, validate on Chrome, Firefox, and Safari using BrowserStack or Playwright.

## Maintenance Notes
- The Login page relies on `react-hook-form` and follows the existing design system (`@/components/ui/*`).
- If you introduce a production login endpoint, update `client/src/pages/Login.tsx` to prefer it over dev login.
- Keep environment variables and secrets secure; rotate `JWT_SECRET` periodically.