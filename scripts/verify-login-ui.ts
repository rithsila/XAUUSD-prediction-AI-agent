import puppeteer from "puppeteer";

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  const url = process.env.UI_BASE_URL?.replace(/\/$/, "") + "/login" || "http://localhost:3000/login";
  console.log(`[Login Verify] Navigating to ${url}`);
  await page.goto(url, { waitUntil: "networkidle2" });

  // Wait for the Sign in header
  await page.waitForSelector('[data-slot="card-title"]', { visible: true });
  const hasSignInHeader = await page.evaluate(() => {
    const titles = Array.from(document.querySelectorAll('[data-slot="card-title"]'));
    return titles.some(t => /Sign in/i.test(t.textContent || ""));
  });
  console.log(`[Login Verify] Sign in header found: ${hasSignInHeader}`);

  // Verify fields exist
  const hasFields = await page.evaluate(() => {
    const email = document.querySelector('#emailOrUsername') as HTMLInputElement | null;
    const password = document.querySelector('#password') as HTMLInputElement | null;
    const remember = document.querySelector('#rememberMe') as HTMLInputElement | null;
    return Boolean(email && password && remember);
  });
  console.log(`[Login Verify] Fields present: ${hasFields}`);

  // Click the Dev Login button and ensure cookie is set
  // Wait until a button with the desired text is present
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('button')).some(b => (b.textContent || '').includes('Use Developer Login'));
  }, { timeout: 30000 });

  // Click the button by text content
  const clicked = await page.$$eval('button', buttons => {
    const target = buttons.find(b => (b.textContent || '').includes('Use Developer Login')) as HTMLButtonElement | undefined;
    if (target) { target.click(); return true; }
    return false;
  });
  if (!clicked) {
    throw new Error("Dev Login button not found");
  }

  // After navigation, check for the session cookie
  await page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {});
  const cookies = await page.cookies();
  const hasSession = cookies.some(c => c.name === "app_session_id");
  console.log(`[Login Verify] Session cookie present after dev login: ${hasSession}`);

  await browser.close();

  if (!hasSignInHeader || !hasFields || !hasSession) {
    console.error("[Login Verify] FAILED: Login UI or session cookie validation failed.");
    process.exit(1);
  }

  console.log("[Login Verify] PASSED: Login UI rendered and dev login establishes a session cookie.");
}

run().catch(err => {
  console.error("[Login Verify] ERROR:", err);
  process.exit(1);
});