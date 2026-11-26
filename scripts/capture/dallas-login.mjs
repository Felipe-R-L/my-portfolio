// Signs in to Dallas Sync as the DEMONSTRATION organization and refuses to go
// on unless the active organization, read back from the server, is "demo".
// Local stack only (localhost); the demo org is fictitious (seed:demo-org).
export const WEB = "http://localhost:5173";
export const API = "http://localhost:3000/api";
const EMAIL = "demo@dallas.local";
const PASSWORD = process.env.DEMO_PASSWORD ?? "demo12345";

export async function signInDemo(page) {
  await page.goto(`${WEB}/login`);
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30_000 });
  const api = page.context().request;
  const set = await api.post(`${API}/auth/organization/set-active`, { data: { organizationSlug: "demo" }, headers: { Origin: WEB } });
  if (!set.ok()) throw new Error(`set-active ${set.status()}`);
  const org = await (await api.get(`${API}/auth/organization/get-full-organization`)).json();
  if (org?.slug !== "demo") throw new Error(`refusing: active org is "${org?.slug}", not the demo one`);
  await page.reload();
  await page.waitForLoadState("networkidle", { timeout: 30_000 });
}
