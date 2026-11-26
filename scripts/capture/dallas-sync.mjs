// Dallas Sync, recorded in its DEMONSTRATION organization ("Motel
// Demonstração", the platform's training org: the band at the top says
// nothing there is a real motel). Local stack only: `pnpm turbo dev` in the
// Dallas repo, with `seed:demo-org` run once.
//
//   node scripts/capture/dallas-sync.mjs [card|offline|all]
//
// card     the front desk's map: a check-in on a free room, and the room
//          turning occupied with its clock running.
// offline  the same desk with the network cut (the browser is offline for
//          real): a check-in and a consumption still go through, and once the
//          network is back the stay reaches the server (checked after the take).
import { encode, discard, open } from "./lib.mjs";
import { API, WEB, signInDemo } from "./dallas-login.mjs";

const OUT = new URL("../../public/assets/projects/video/", import.meta.url).pathname;
const which = process.argv[2] ?? "all";

const { browser, context, page, human, record } = await open({ seed: 7 });
page.on("pageerror", (e) => console.error("pageerror:", e.message));
await signInDemo(page);

// ---------- the scene, off camera ----------
async function freeRooms() {
  return page.locator('.suite[data-room-status="livre"]');
}
async function ensureShift() {
  await page.goto(`${WEB}/caixa`);
  await page.waitForTimeout(2500);
  const field = page.getByLabel("Valor de abertura (R$)");
  if (await field.isVisible().catch(() => false)) {
    await field.fill("200,00");
    await page.getByRole("button", { name: "Abrir turno" }).click();
    await page.getByText(/CAIXA ABERTO/).waitFor({ timeout: 15_000 });
    console.log("shift opened");
  }
}
async function quickCheckIn(plate) {
  await page.goto(`${WEB}/mapa`);
  const free = (await freeRooms()).first();
  await free.waitFor({ timeout: 20_000 });
  await free.click();
  const modal = page.getByRole("dialog", { name: /^Check-in · Quarto/ });
  await modal.waitFor();
  await modal.getByRole("combobox").first().click();
  await page.getByRole("option").first().click();
  await modal.getByPlaceholder("AAA9A99 ou AAA9999").fill(plate);
  await modal.getByRole("button", { name: "Confirmar check-in" }).click();
  await modal.waitFor({ state: "detached" });
}
async function releaseCleaning() {
  // rooms waiting on housekeeping: a click opens "Finalizar limpeza"
  for (let i = 0; i < 6; i++) {
    const room = page.locator('.suite[data-room-status="limpeza"]').first();
    if (!(await room.isVisible().catch(() => false))) return;
    await room.click();
    await page.getByRole("button", { name: "Finalizar limpeza" }).last().click();
    await page.waitForTimeout(1200);
  }
}

async function checkOut() {
  // pays by Pix and checks out the first occupied room (off camera)
  await page.locator('.suite[data-room-status="ocupada"]').first().click();
  await page.getByRole("button", { name: "Fechar conta" }).click();
  const modal = page.locator(".modal.glass");
  await modal.getByRole("button", { name: /^Pix$/ }).click();
  await modal.getByRole("button", { name: /Registrar pagamento/ }).click();
  await modal.getByRole("button", { name: /Finalizar checkout/ }).click();
  await modal.waitFor({ state: "detached" });
  await page.waitForTimeout(800);
}

/** The consumption form's module, loaded while online, with no reload after:
    the dev server cannot serve a module the page has not fetched once the
    network is cut (in production the service worker has every chunk). */
async function warmUp() {
  await page.locator('.suite[data-room-status="ocupada"]').first().click();
  await page.getByRole("button", { name: /Lançar consumo/ }).click();
  await page.locator(".modal.glass").waitFor();
  await page.waitForTimeout(800);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
}

await ensureShift();
await page.goto(`${WEB}/mapa`);
await page.waitForTimeout(2000);
// a clean desk: every room checked out, then only the scene's two taken
while ((await page.locator('.suite[data-room-status="ocupada"]').count()) > 0) await checkOut();
await releaseCleaning();
// a desk mid-shift: two rooms already taken
const occupied = await page.locator('.suite[data-room-status="ocupada"]').count();
for (const plate of ["RTA4C18", "PQN7B02"].slice(0, Math.max(0, 2 - occupied))) await quickCheckIn(plate);
await page.goto(`${WEB}/mapa`);
await page.waitForTimeout(1500);
const free = await (await freeRooms()).count();
console.log(`scene: ${await page.locator('.suite[data-room-status="ocupada"]').count()} occupied, ${free} free`);
if (free < (which === "all" ? 2 : 1)) throw new Error("not enough free rooms for the takes");

// ---------- the takes ----------
async function checkInTake(plate) {
  const room = (await freeRooms()).first();
  const number = (await room.innerText()).match(/\d{3}/)?.[0];
  await human.click(room);
  const modal = page.getByRole("dialog", { name: /^Check-in · Quarto/ });
  await modal.waitFor();
  await human.wait(500);
  await human.click(modal.getByRole("combobox").first());
  await human.wait(350);
  await human.click(page.getByRole("option").first());
  await human.wait(300);
  await human.click(modal.getByPlaceholder("AAA9A99 ou AAA9999"));
  await human.type(plate);
  await human.wait(400);
  await human.click(modal.getByRole("button", { name: "Confirmar check-in" }));
  await modal.waitFor({ state: "detached" });
  // the ticket's print preview opens; the desk closes it, back to the map
  const close = page.getByRole("button", { name: /^fechar$/i });
  if (await close.waitFor({ timeout: 4000 }).then(() => true, () => false)) {
    await human.wait(900);
    await human.click(close);
    await close.waitFor({ state: "detached" }).catch(() => {});
  }
  return number;
}

const results = {};

if (which === "card" || which === "all") {
  await page.goto(`${WEB}/mapa`);
  await page.waitForTimeout(2500);
  await human.move(1040, 720);
  const take = await record();
  await human.wait(900);
  take.mark("in");
  await checkInTake("QTR4E21");
  await human.move(1180, 760);
  await human.wait(2600); // the room's clock running
  take.mark("out");
  const t = await take.stop();
  results.card = encode(t, `${OUT}dallas-sync-card`, { from: t.marks.in - 0.4, to: t.marks.out });
  discard(t);
}

if (which === "offline" || which === "all") {
  await page.goto(`${WEB}/mapa`);
  await page.waitForTimeout(2500);
  await warmUp();
  await human.move(1040, 720);
  const take = await record();
  await human.wait(700);
  take.mark("in");
  // the network goes down, for real
  await context.setOffline(true);
  const room = await checkInTake("LMX2D45");
  await human.wait(900);
  // and a consumption on the same room
  const occupiedRoom = page.locator(`.suite[data-room-status="ocupada"]`, { hasText: room ?? "" }).first();
  await human.click(occupiedRoom);
  await human.wait(700);
  await human.click(page.getByRole("button", { name: /Lançar consumo/ }));
  const modal = page.locator(".modal.glass");
  await human.wait(400);
  await human.click(modal.getByRole("combobox").first());
  await human.wait(300);
  await human.click(page.getByRole("option", { disabled: false }).first());
  await human.wait(300);
  await human.click(modal.getByRole("button", { name: /Adicionar/ }));
  await human.wait(400);
  await human.click(modal.getByRole("button", { name: /^Lançar/ }));
  await modal.waitFor({ state: "detached" });
  await human.wait(1800);
  take.mark("out");
  await context.setOffline(false);
  const t = await take.stop();
  results.offline = encode(t, `${OUT}dallas-sync-offline`, { from: t.marks.in - 0.3, to: t.marks.out });
  discard(t);
  // the proof the take claims: once online, the stay reaches the server
  let synced = false;
  for (let i = 0; i < 20 && !synced; i++) {
    await page.waitForTimeout(1500);
    const res = await context.request.get(`${API}/stays?status=open`).catch(() => null);
    const body = res && res.ok() ? JSON.stringify(await res.json()) : "";
    synced = body.includes("LMX2D45");
  }
  results.offline.syncedAfterReconnect = synced;
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
