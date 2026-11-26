// The two public sites, recorded on production, read-only.
//
//   node scripts/capture/sites.mjs [secret-card|secret-detail|motel-card|motel-detail|all]
//
// Nothing is ever sent: every request that is not a GET to the shop, its
// database or Mercado Pago is aborted, analytics included, so a take leaves
// no order, no lead and no page view behind. The shop take stops at the Pix
// form (the Mercado Pago step) with the name typed in and the CPF left blank;
// it is never submitted.
import { encode, discard, open } from "./lib.mjs";

const OUT = new URL("../../public/assets/projects/video/", import.meta.url).pathname;
const which = process.argv[2] ?? "all";
const SHOP = "https://secret-boutique.com.br";
const MOTEL = "https://jrdallasmotel.com.br";

async function session(seed) {
  const s = await open({ seed });
  let blocked = 0;
  await s.page.route("**/*", (route) => {
    const req = route.request();
    if (req.method() !== "GET" && req.method() !== "HEAD" && req.method() !== "OPTIONS") {
      blocked++;
      return route.abort();
    }
    return route.continue();
  });
  s.blocked = () => blocked;
  return s;
}

const results = {};

if (which === "secret-card" || which === "all") {
  const { browser, page, human, record, blocked } = await session(11);
  await page.goto(SHOP, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const take = await record();
  await human.wait(900);
  take.mark("in");
  // the gate at the door: the open catalogue
  await human.click(page.getByRole("button", { name: /SFW/ }));
  await human.wait(1400);
  await human.move(1100, 560);
  await human.glide(1500, 6.5);
  await human.wait(800);
  take.mark("out");
  const t = await take.stop();
  results["secret-card"] = { ...encode(t, `${OUT}secret-card`, { from: t.marks.in - 0.3, to: t.marks.out }), blocked: blocked() };
  discard(t);
  await browser.close();
}

if (which === "secret-detail" || which === "all") {
  const { browser, page, human, record, blocked } = await session(12);
  await page.goto(SHOP, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /SFW/ }).click();
  await page.waitForTimeout(1200);
  const take = await record();
  await human.wait(700);
  take.mark("in");
  await human.click(page.getByRole("button", { name: "Ver opções" }).first());
  await human.wait(1300);
  const variant = page.getByText("Capim-limão", { exact: true }).first();
  await human.click(variant);
  await human.wait(900);
  // detail 1: the variant chosen, with its own price on the button
  take.mark("variant");
  await take.box("variant", variant.locator("xpath=ancestor::button[1]"));
  await take.box("add", page.getByRole("button", { name: /Adicionar ao Carrinho/ }));
  await human.click(page.getByRole("button", { name: /Adicionar ao Carrinho/ }));
  await human.wait(1000);
  await human.click(page.getByRole("link", { name: /Ver carrinho|Ver Carrinho/ }).first());
  await page.waitForURL(/\/cart/);
  await human.wait(1100);
  // detail 2: what the cart holds, and where to pick it up
  take.mark("cart");
  await take.box("cartItem", page.getByText("Capim-limão").first().locator("xpath=ancestor::*[.//button][1]"));
  await take.box("pickup", page.getByRole("button", { name: /Retirar na recepção/ }));
  await human.click(page.getByRole("button", { name: /Retirar na recepção/ }));
  await human.wait(500);
  await human.click(page.getByRole("button", { name: /^Continuar$/ }));
  await human.wait(900);
  await human.click(page.getByRole("button", { name: /Pix agora/ }));
  await human.wait(900);
  await human.click(page.getByPlaceholder("Seu nome"));
  await human.type("Gravação");
  await human.click(page.getByPlaceholder("Seu sobrenome"));
  await human.type("portfólio");
  await human.wait(600);
  // detail 3: Pix, the Mercado Pago step, and why it asks for CPF
  take.mark("pix");
  await take.box("pixOption", page.getByRole("button", { name: /Pix agora/ }));
  await take.box("pixNote", page.getByText(/exigidos pelo/).first());
  await take.box("name", page.getByPlaceholder("Seu nome"));
  await human.wait(900);
  take.mark("out");
  const t = await take.stop();
  results["secret-detail"] = { ...encode(t, `${OUT}secret-detail`, { from: t.marks.in - 0.3, to: t.marks.out }), blocked: blocked() };
  discard(t);
  await browser.close();
}

if (which === "motel-card" || which === "all") {
  const { browser, page, human, record, blocked } = await session(21);
  await page.goto(MOTEL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  await human.move(980, 600);
  const take = await record();
  await human.wait(1200);
  take.mark("in");
  await human.glide(1900, 7.5);
  await human.wait(800);
  take.mark("out");
  const t = await take.stop();
  results["motel-card"] = { ...encode(t, `${OUT}dallas-motel-card`, { from: t.marks.in - 0.3, to: t.marks.out }), blocked: blocked() };
  discard(t);
  await browser.close();
}

if (which === "motel-detail" || which === "all") {
  // From the hero down the page (Felipe, 2026-11-26): the site as a visitor
  // meets it, the suites and the day's price, the motel's story, the menu.
  // Slow eased glides, so the take has no wheel jolts.
  const { browser, page, human, record, blocked } = await session(22);
  await page.goto(MOTEL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  const top = async (sel) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top, sel);
  await human.move(980, 640);
  const take = await record();
  await human.wait(900);
  take.mark("in");
  await human.wait(1700);
  take.mark("hero");
  // the suites, with the tabs of the day near the top
  await human.glide((await top("#suites")) - 70, 2.4);
  await human.wait(700);
  const weekend = page.getByRole("button", { name: /Fim de semana/ }).first();
  await take.box("tabs", weekend.locator(".."));
  take.mark("suites");
  await human.click(weekend);
  await human.wait(1600);
  take.mark("weekend");
  // the story of the place
  await human.move(1100, 420);
  await human.glide((await top("#legado")) + 40, 3.2);
  await human.wait(1300);
  take.mark("legacy");
  // room service: the menu, ordered from the suite
  const menu = page.getByText("Peça sem sair da suíte").first();
  // where it is now, below the fold (a box is measured without scrolling)
  const y = (await menu.boundingBox()).y;
  await human.glide(y - 330, 3.4);
  await human.wait(700);
  await take.box("menu", menu.locator("xpath=ancestor::section[1]"));
  take.mark("menu");
  await human.wait(1600);
  take.mark("out");
  const t = await take.stop();
  results["motel-detail"] = { ...encode(t, `${OUT}dallas-motel-detail`, { from: t.marks.in - 0.3, to: t.marks.out }), blocked: blocked() };
  discard(t);
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));
