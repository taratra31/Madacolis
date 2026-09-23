/**
 * QA — suite de tests end-to-end sur l'API MadaColis.
 * Lancement : npx tsx scripts/qa-api.ts [baseUrl]
 * Sortie : 0 si tout passe, 1 sinon. Nettoyage auto des données créées.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const BASE = process.argv[2] ?? "http://localhost:5000/api/v1";

type Result = { name: string; ok: boolean; detail?: string };
const results: Result[] = [];

function t(name: string, cond: boolean, detail?: string) {
  results.push({ name, ok: !!cond, detail });
}

async function req(method: string, path: string, token?: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json: (json ?? {}) as Record<string, unknown> };
}

const get = (p: string, tk?: string) => req("GET", p, tk);
const post = (p: string, b: unknown, tk?: string) => req("POST", p, tk, b);
const put = (p: string, b: unknown, tk?: string) => req("PUT", p, tk, b);

const prisma = new PrismaClient();
const createdUserIds: string[] = [];
const createdShipmentIds: string[] = [];
const createdPaymentIds: string[] = [];
const createdPricingRuleIds: string[] = [];

async function cleanup() {
  for (const sid of createdShipmentIds) {
    try {
      await prisma.shipmentStatusHistory.deleteMany({ where: { shipmentId: sid } });
      await prisma.shipmentItem.deleteMany({ where: { shipmentId: sid } });
      await prisma.payment.deleteMany({ where: { shipmentId: sid } });
      await prisma.auditLog.deleteMany({ where: { entityId: sid } });
      await prisma.shipment.deleteMany({ where: { id: sid } });
    } catch (e) {
      console.log("  [cleanup] shipment", sid, "echec:", (e as Error).message);
    }
  }
  for (const pid of createdPaymentIds) {
    await prisma.payment.deleteMany({ where: { id: pid } }).catch(() => {});
  }
  for (const rid of createdPricingRuleIds) {
    await prisma.pricingRule.deleteMany({ where: { id: rid } }).catch(() => {});
  }
  for (const uid of createdUserIds) {
    try {
      await prisma.address.deleteMany({ where: { userId: uid } });
      await prisma.auditLog.deleteMany({ where: { userId: uid } });
      await prisma.user.deleteMany({ where: { id: uid } });
    } catch (e) {
      console.log("  [cleanup] user", uid, "echec:", (e as Error).message);
    }
  }
}

function summarize() {
  const fails = results.filter((r) => !r.ok);
  console.log("\n=== RESUME QA ===");
  for (const r of results) console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  console.log(`\n${results.length - fails.length}/${results.length} tests passes`);
  return fails.length === 0 ? 0 : 1;
}

async function main() {
  // ── SANTE ──────────────────────────────────────────────
  const health = await get("/health");
  t("health 200", health.status === 200 && health.json.status === "ok", JSON.stringify(health.json).slice(0, 60));

  // ── GARDES D'ACCES ─────────────────────────────────────
  const guard1 = await get("/auth/me");
  t("auth/me sans token -> 401", guard1.status === 401, `got ${guard1.status}`);

  // ── AUTH : mauvais login + register invalide ───────────
  const badLogin = await post("/auth/login", { identifier: "nobody@x.mg", password: "wrongpass" });
  t("login invalide -> 401", badLogin.status === 401, `got ${badLogin.status}`);

  const badReg = await post("/auth/register", { name: "A", phone: "1", password: "short" });
  t("register invalide -> 400", badReg.status === 400, `got ${badReg.status}`);

  // ── AUTH : register QA user ─────────────────────────────
  const qaEmail = `qa${Date.now()}@madacolis.mg`;
  const reg = await post("/auth/register", {
    name: "QA Tester", phone: `+261 34 ${Date.now() % 10000000}`, email: qaEmail, password: "QaPassw0rd!",
    country: "Madagascar", city: "Antananarivo", address: "Lot QA",
  });
  t("register -> 2xx", reg.status >= 200 && reg.status < 300, `got ${reg.status}`);
  const qaUser = (reg.json.user ?? reg.json.data?.user) as { id: string } | undefined;
  const qaToken = (reg.json.token ?? reg.json.data?.token) as string | undefined;
  if (qaUser?.id) createdUserIds.push(qaUser.id);
  t("register renvoie token+user", !!qaToken && !!qaUser, `token=${!!qaToken} user=${!!qaUser}`);

  if (qaToken) {
    const me = await get("/auth/me", qaToken);
    t("auth/me avec token -> 200 + user", me.status === 200 && !!(me.json as { user?: unknown }).user, `got ${me.status}`);

    const prof = await put("/auth/profile", { city: "Toamasina", address: "Lot QA 2" }, qaToken);
    t("profile update -> 200", prof.status === 200, `got ${prof.status}`);

    const pw = await put("/auth/password", { currentPassword: "QaPassw0rd!", newPassword: "QaPassw0rd2!" }, qaToken);
    t("password change -> 200", pw.status === 200, `got ${pw.status}`);
    const oldTok = await post("/auth/login", { identifier: qaEmail, password: "QaPassw0rd!" });
    t("ancien mdp rejete apres changement -> 401", oldTok.status === 401, `got ${oldTok.status}`);
    const relog = await post("/auth/login", { identifier: qaEmail, password: "QaPassw0rd2!" });
    t("nouveau mdp valide -> 200", relog.status === 200, `got ${relog.status}`);
  }

  // ── FINANCE : quotes & catalog (public) ─────────────────
  const services = await get("/pricing/services");
  t("pricing/services -> 200", services.status === 200, `got ${services.status}`);

  const okQuote = await post("/pricing/quote", {
    originCountry: "France", originCity: "Paris", destinationCountry: "Madagascar", destinationCity: "Antananarivo",
    serviceType: "STANDARD", shippingMethod: "AIR", weightKg: 2.5, lengthCm: 30, widthCm: 20, heightCm: 15,
  });
  t("quote valide -> 200 + prix", okQuote.status === 200 && (okQuote.json.quote?.price || okQuote.json.quote), `got ${okQuote.status}`);
  if (okQuote.status === 200) {
    const q = okQuote.json.quote as Record<string, unknown>;
    t("quote contient price>0", typeof q.price === "number" && q.price > 0, `price=${q.price}`);
  }

  const badQuote = await post("/pricing/quote", {
    destinationCountry: "Madagascar", destinationCity: "Antananarivo", serviceType: "STANDARD", weightKg: 2,
  });
  t("quote manque origine -> 400 + fieldErrors", badQuote.status === 400 && !!(badQuote.json.errors as Record<string, unknown> | undefined)?.fieldErrors, `got ${badQuote.status}`);

  const cat = await get("/pricing/marketplace/categories");
  t("marketplace/categories -> 200", cat.status === 200, `got ${cat.status}`);
  const prods = await get("/pricing/marketplace/products?q=&limit=3");
  const prodArr = prods.json.products ?? [];
  t("marketplace/products -> 200 + array", prods.status === 200 && Array.isArray(prodArr) && prodArr.length > 0, `got ${prods.status}`);
  const search = await get("/pricing/marketplace/amazon/search?q=montre&limit=5");
  t("amazon/search -> 200", search.status === 200, `got ${search.status}`);

  // ── TRACKING (public) ───────────────────────────────────
  const t404 = await get("/tracking/ZZZ-404-NOPE");
  t("tracking inconnu -> 404", t404.status === 404, `got ${t404.status}`);
  const t400 = await get("/tracking/ab");
  t("tracking trop court -> 400", t400.status === 400, `got ${t400.status}`);

  // ── LOGIN DES ROLES EXISTANTS ───────────────────────────
  const login = async (identifier: string, password: string, label: string) => {
    const r = await post("/auth/login", { identifier, password });
    t(`login ${label}`, r.status === 200 && !!r.json.token, `got ${r.status}`);
    return r.json.token as string;
  };
  const adminTok = await login("admin@madacolis.mg", "Admin@123", "admin");
  const transTok = await login("dhl@madacolis.mg", "Transitaire@123", "transitaire");
  const custTok = await login("customer@madacolis.mg", "Customer@123", "customer");

  t("admin endpoint avec token customer -> 403", !!custTok && (await get("/admin/dashboard", custTok)).status === 403, `got ${(await get("/admin/dashboard", custTok)).status}`);
  t("transitaire endpoint avec token admin -> 403", !!adminTok && (await get("/transitaire/stats", adminTok)).status === 403, `got ${(await get("/transitaire/stats", adminTok)).status}`);

  // ── ADMIN : lectures + invariants ───────────────────────
  if (adminTok) {
    const dash = await get("/admin/dashboard", adminTok);
    t("admin/dashboard -> 200 + stats", dash.status === 200 && !!dash.json.stats, `got ${dash.status}`);

    for (const ep of ["users", "transitaires", "documents", "commissions", "treasury", "notifications", "payments", "shipments", "audits", "pricing-rules"]) {
      const r = await get(`/admin/${ep}`, adminTok);
      t(`admin/${ep} -> 200`, r.status === 200, `got ${r.status}`);
    }

    const comm = await get("/admin/commissions", adminTok);
    if (comm.status === 200) {
      const j = comm.json as Record<string, unknown>;
      t("commissions : taux=20%", j.rate === 0.2, `rate=${j.rate}`);
      const tc = j.totalCommission as number;
      t("commissions : montants finis", Number.isFinite(tc) && tc >= 0, `tc=${tc}`);
    }

    for (const kind of ["colis", "utilisateurs", "paiements", "documents"]) {
      const r = await fetch(`${BASE}/admin/export?kind=${kind}`, { headers: { Authorization: `Bearer ${adminTok}` } });
      const buf = new Uint8Array(await r.arrayBuffer());
      const hasBom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
      t(`export ${kind} -> 200 + BOM UTF-8 + contenu`, r.status === 200 && hasBom && buf.length > 50, `status=${r.status} len=${buf.length} bom=${hasBom}`);
    }

    const rules = await get("/admin/pricing-rules", adminTok);
    t("admin/pricing-rules -> 200", rules.status === 200, `got ${rules.status}`);
  }

  // ── TRANSITAIRE : lectures ──────────────────────────────
  if (transTok) {
    for (const ep of ["stats", "rates", "clients", "payments", "team", "documents", "notifications", "audit?limit=5", "export?limit=5"]) {
      const r = await get(`/transitaire/${ep}`, transTok);
      t(`transitaire/${ep} -> 200`, r.status === 200, `got ${r.status}`);
    }
    const st = await get("/transitaire/stats", transTok);
    if (st.status === 200) {
      const k = (st.json.stats?.kpis ?? {}) as Record<string, unknown>;
      t("transitaire stats : total>=0", typeof k.totalValueAr === "number", `totalValueAr=${k.totalValueAr}`);
    }
  }

  // ── CREATION COLIS (client) + PAYEMENT + ANNULATION ─────
  if (qaToken) {
    const create = await post(
      "/shipments",
      {
        origin: { country: "France", city: "Paris" },
        destination: { country: "Madagascar", city: "Antananarivo" },
        serviceType: "STANDARD",
        sender: { name: "QA Sender", phone: "+33612345678", address: "Paris" },
        recipient: { name: "QA Recipient", phone: "+261341234567", address: "Antananarivo" },
        items: [{ description: "Article QA test", quantity: 1, weight: 1.2, declaredValue: 25 }],
      },
      qaToken,
    );
    t("client create shipment -> 2xx", create.status >= 200 && create.status < 300, `got ${create.status}`);
    const ship = (create.json.shipment ?? create.json) as Record<string, unknown> & { id?: string; trackingNumber?: string; status?: string };
    if (ship?.id) createdShipmentIds.push(ship.id as string);
    if (ship?.id) {
      t("client create : statut PENDING", ship.status === "PENDING", `status=${ship.status}`);
      const track = await get(`/tracking/${ship.trackingNumber}`);
      t("tracking du nouveau colis -> 200", track.status === 200, `got ${track.status}`);

      const pay = await post("/payments", { shipmentId: ship.id, provider: "MVOLA", method: "MOBILE_MONEY" }, qaToken);
      t("initier paiement MVOLA -> 2xx", pay.status >= 200 && pay.status < 300, `got ${pay.status}`);
      const payData = pay.json.payment ?? pay.json.data?.payment ?? pay.json;
      const payId = (payData as { id?: string }).id;
      if (payId) createdPaymentIds.push(payId as string);

      const myPays = await get("/payments", qaToken);
      t("liste mes paiements -> 200", myPays.status === 200, `got ${myPays.status}`);

      const canc = await post(`/shipments/${ship.id}/cancel`, { reason: "QA test" }, qaToken);
      t("annulation colis -> 2xx", canc.status >= 200 && canc.status < 300, `got ${canc.status}`);
      const after = await get(`/shipments/${ship.id}`, qaToken);
      const af = after.json.shipment ?? after.json;
      t("colis bien annule (CANCELLED)", after.status === 200 && (af as Record<string, unknown>).status === "CANCELLED", `status=${(af as Record<string, unknown>).status}`);
    }
  }

  // ── ADMIN : pricing rule create/delete ──────────────────
  if (adminTok) {
    const cr = await post(
      "/admin/pricing-rules",
      { name: `QA Rule ${Date.now()}`, originCountry: "France", destinationCountry: "Canada", serviceType: "ECONOMY", basePrice: 12.5, pricePerKg: 3, minimumPrice: 8, currency: "EUR" },
      adminTok,
    );
    t("admin create pricing rule -> 2xx", cr.status >= 200 && cr.status < 300, `got ${cr.status}`);
    const rule = (cr.json.rule ?? cr.json.pricingRule ?? cr.json) as { id?: string };
    if (rule?.id) createdPricingRuleIds.push(rule.id as string);
  }
}

main()
  .catch((e) => {
    console.error("ERREUR QA:", e);
    results.push({ name: "suite", ok: false, detail: (e as Error).message });
  })
  .finally(async () => {
    await cleanup();
    process.exit(summarize());
  });