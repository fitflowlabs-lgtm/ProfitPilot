require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const OpenAI = require("openai");
const prisma = require("./src/db");
const session = require("express-session");
const app = express();

// -----------------------------
// Middleware
// -----------------------------
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Raw body for webhook HMAC verification — MUST be before express.json()
app.use("/webhooks", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PORT = process.env.PORT || 3000;

// -----------------------------
// Rate Limiter (in-memory)
// -----------------------------
const rateLimits = new Map();

function rateLimit(keyPrefix, maxRequests, windowMs) {
  return (req, res, next) => {
    const shop = req.query.shop || req.session?.shop || "unknown";
    const key = `${keyPrefix}:${shop}`;
    const now = Date.now();
    if (!rateLimits.has(key)) rateLimits.set(key, []);
    const timestamps = rateLimits.get(key).filter((t) => now - t < windowMs);
    timestamps.push(now);
    rateLimits.set(key, timestamps);
    if (timestamps.length > maxRequests) {
      return res.status(429).json({ error: "Too many requests. Please wait.", retryAfter: Math.ceil(windowMs / 1000) });
    }
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of rateLimits) {
    const valid = ts.filter((t) => now - t < 5 * 60 * 1000);
    if (valid.length === 0) rateLimits.delete(key);
    else rateLimits.set(key, valid);
  }
}, 5 * 60 * 1000);

// -----------------------------
// Helpers
// -----------------------------
function isValidShopDomain(shop) {
  return typeof shop === "string" && /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}

function isOlderThanMinutes(dateValue, minutes) {
  if (!dateValue) return true;
  return Date.now() - new Date(dateValue).getTime() > minutes * 60 * 1000;
}

function verifyOAuthHmac(query) {
  const { hmac, ...params } = query;
  if (!hmac) return false;
  const sorted = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  const computed = crypto.createHmac("sha256", process.env.SHOPIFY_API_SECRET).update(sorted).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(computed)); } catch { return false; }
}

function verifyWebhookHmac(rawBody, hmacHeader) {
  if (!hmacHeader) return false;
  const computed = crypto.createHmac("sha256", process.env.SHOPIFY_API_SECRET).update(rawBody).digest("base64");
  try { return crypto.timingSafeEqual(Buffer.from(hmacHeader), Buffer.from(computed)); } catch { return false; }
}

async function fetchShopifyJson(url, store) {
  const response = await fetch(url, { method: "GET", headers: { "X-Shopify-Access-Token": store.accessToken, "Content-Type": "application/json" } });
  let data = null;
  try { data = await response.json(); } catch (e) { data = null; }
  if (response.status === 401) { const err = new Error("Shopify token expired"); err.code = "REAUTH_REQUIRED"; err.shop = store.shopDomain; throw err; }
  return { response, data };
}

async function fetchShopifyWrite(url, method, body, store) {
  const response = await fetch(url, { method, headers: { "X-Shopify-Access-Token": store.accessToken, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  let data = null;
  try { data = await response.json(); } catch (e) { data = null; }
  if (response.status === 401) { const err = new Error("Shopify token expired"); err.code = "REAUTH_REQUIRED"; err.shop = store.shopDomain; throw err; }
  return { response, data };
}

async function requireStore(req, res, next) {
  const shop = req.query.shop || req.session.shop;
  if (!shop) return res.status(401).json({ error: "Not authenticated", redirect: "/login" });
  if (!isValidShopDomain(shop)) return res.status(400).json({ error: "Invalid shop domain" });
  req.session.shop = shop;
  const store = await prisma.store.findUnique({ where: { shopDomain: shop } });
  if (!store) return res.status(401).json({ error: "Store not found", redirect: `/auth?shop=${encodeURIComponent(shop)}` });
  req.store = store;
  next();
}

function handleShopifyError(error, res, shop) {
  if (error.code === "REAUTH_REQUIRED" || error.message?.includes("Unavailable Shop")) {
    return res.status(401).json({ error: "Shopify connection expired. Please reconnect.", reauth: true, redirect: `/auth?shop=${encodeURIComponent(shop)}` });
  }
  return null;
}

// -----------------------------
// Paginated Shopify fetch
// -----------------------------
async function fetchAllPages(baseUrl, store, rootKey) {
  let all = [];
  let url = baseUrl;
  while (url) {
    const { response, data } = await fetchShopifyJson(url, store);
    if (!response.ok) throw new Error(`Sync failed: ${JSON.stringify(data || {})}`);
    all = all.concat(data[rootKey] || []);
    const link = response.headers.get("link");
    url = null;
    if (link) { const m = link.match(/<([^>]+)>;\s*rel="next"/); if (m) url = m[1]; }
  }
  return all;
}

// -----------------------------
// Sync logic
// -----------------------------
async function syncProductsForStore(store) {
  const products = await fetchAllPages(`https://${store.shopDomain}/admin/api/2024-01/products.json?limit=250`, store, "products");
  for (const product of products) {
    const dbProduct = await prisma.product.upsert({ where: { shopifyProductId: String(product.id) }, update: { title: product.title, storeId: store.id }, create: { shopifyProductId: String(product.id), title: product.title, storeId: store.id } });
    for (const variant of product.variants || []) {
      await prisma.variant.upsert({ where: { shopifyVariantId: String(variant.id) }, update: { productId: dbProduct.id, storeId: store.id, sku: variant.sku || null, price: parseFloat(variant.price || 0), inventoryQty: variant.inventory_quantity || 0 }, create: { shopifyVariantId: String(variant.id), productId: dbProduct.id, storeId: store.id, sku: variant.sku || null, price: parseFloat(variant.price || 0), inventoryQty: variant.inventory_quantity || 0 } });
    }
  }
  await prisma.store.update({ where: { id: store.id }, data: { lastProductsSyncAt: new Date() } });
}

async function syncOrdersForStore(store) {
  const orders = await fetchAllPages(`https://${store.shopDomain}/admin/api/2024-01/orders.json?status=any&limit=250`, store, "orders");
  for (const order of orders) {
    const dbOrder = await prisma.order.upsert({ where: { shopifyOrderId: String(order.id) }, update: { orderNumber: order.name || String(order.order_number || ""), currency: order.currency || null, totalPrice: order.total_price ? parseFloat(order.total_price) : null, createdAt: new Date(order.created_at) }, create: { shopifyOrderId: String(order.id), storeId: store.id, orderNumber: order.name || String(order.order_number || ""), currency: order.currency || null, totalPrice: order.total_price ? parseFloat(order.total_price) : null, createdAt: new Date(order.created_at) } });
    for (const item of order.line_items || []) {
      if (!item.variant_id) continue;
      const variant = await prisma.variant.findUnique({ where: { shopifyVariantId: String(item.variant_id) } });
      if (!variant) continue;
      await prisma.orderItem.upsert({ where: { orderId_variantId: { orderId: dbOrder.id, variantId: variant.id } }, update: { quantity: item.quantity || 0, unitPrice: item.price ? parseFloat(item.price) : 0, lineTotal: item.price ? parseFloat(item.price) * (item.quantity || 0) : 0 }, create: { orderId: dbOrder.id, variantId: variant.id, quantity: item.quantity || 0, unitPrice: item.price ? parseFloat(item.price) : 0, lineTotal: item.price ? parseFloat(item.price) * (item.quantity || 0) : 0 } });
    }
  }
  await prisma.store.update({ where: { id: store.id }, data: { lastOrdersSyncAt: new Date() } });
}

async function autoSyncIfNeeded(store) {
  if (isOlderThanMinutes(store.lastProductsSyncAt, 10)) await syncProductsForStore(store);
  const r = await prisma.store.findUnique({ where: { id: store.id } });
  if (isOlderThanMinutes(r.lastOrdersSyncAt, 10)) await syncOrdersForStore(r);
  return prisma.store.findUnique({ where: { id: store.id } });
}

function getSeasonalMultiplier(title) {
  const m = new Date().getMonth() + 1;
  const t = title.toLowerCase();
  if ((t.includes("toy") || t.includes("gift")) && (m >= 11 || m === 12)) return 1.8;
  if (t.includes("school") && (m === 7 || m === 8)) return 1.5;
  return 1.0;
}

// -----------------------------
// Auth (HMAC verified, DB-persisted state)
// -----------------------------
setInterval(async () => { try { await prisma.oAuthState.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } } }); } catch {} }, 5 * 60 * 1000);

app.get("/auth", async (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).send("Missing shop");
  if (!isValidShopDomain(shop)) return res.status(400).send("Invalid shop domain");
  const state = crypto.randomBytes(16).toString("hex");
  await prisma.oAuthState.create({ data: { state, shop } });
  const redirectUri = `${process.env.APP_URL}/auth/callback`;
  res.redirect(`https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${encodeURIComponent(process.env.SCOPES)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`);
});

app.get("/auth/callback", async (req, res) => {
  const { shop, code, state } = req.query;
  if (!shop || !code || !state) return res.status(400).send("Missing shop, code, or state");
  if (!isValidShopDomain(shop)) return res.status(400).send("Invalid shop domain");
  if (!verifyOAuthHmac(req.query)) { console.error("HMAC verification failed:", shop); return res.status(400).send("HMAC verification failed"); }
  const pending = await prisma.oAuthState.findUnique({ where: { state } });
  if (!pending) return res.status(400).send("Invalid OAuth state");
  await prisma.oAuthState.delete({ where: { state } });
  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: process.env.SHOPIFY_API_KEY, client_secret: process.env.SHOPIFY_API_SECRET, code }) });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) return res.status(400).json({ error: "OAuth failed", details: tokenData });
    await prisma.store.upsert({ where: { shopDomain: shop }, update: { accessToken: tokenData.access_token }, create: { shopDomain: shop, accessToken: tokenData.access_token } });
    req.session.shop = shop;
    try { await registerWebhooks(shop, tokenData.access_token); } catch (e) { console.error("Webhook registration failed:", e.message); }
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}?shop=${encodeURIComponent(shop)}`);
  } catch (error) { res.status(500).json({ error: "OAuth failed", details: error.message }); }
});

// -----------------------------
// Webhooks
// -----------------------------
async function registerWebhooks(shop, accessToken) {
  const url = `${process.env.APP_URL}/webhooks/app-uninstalled`;
  try {
    await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, { method: "POST", headers: { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" }, body: JSON.stringify({ webhook: { topic: "app/uninstalled", address: url, format: "json" } }) });
  } catch (e) { console.error("Webhook registration error:", e.message); }
}

app.post("/webhooks/app-uninstalled", async (req, res) => {
  const hmac = req.headers["x-shopify-hmac-sha256"];
  if (!verifyWebhookHmac(req.body, hmac)) { console.error("Webhook HMAC failed"); return res.status(401).send("Unauthorized"); }
  try {
    const shopDomain = req.headers["x-shopify-shop-domain"];
    if (shopDomain) {
      const store = await prisma.store.findUnique({ where: { shopDomain } });
      if (store) {
        await prisma.orderItem.deleteMany({ where: { order: { storeId: store.id } } });
        await prisma.order.deleteMany({ where: { storeId: store.id } });
        await prisma.variantSnapshot.deleteMany({ where: { variant: { storeId: store.id } } });
        await prisma.variant.deleteMany({ where: { storeId: store.id } });
        await prisma.product.deleteMany({ where: { storeId: store.id } });
        await prisma.store.delete({ where: { id: store.id } });
        console.log(`Cleaned up data for uninstalled store: ${shopDomain}`);
      }
    }
    res.status(200).send("OK");
  } catch (error) { console.error("Webhook error:", error.message); res.status(500).send("Error"); }
});

// -----------------------------
// API: Session
// -----------------------------
app.get("/api/me", async (req, res) => {
  const shop = req.query.shop || req.session.shop;
  if (!shop) return res.json({ authenticated: false });
  const store = await prisma.store.findUnique({ where: { shopDomain: shop } });
  if (!store) return res.json({ authenticated: false, shop });
  req.session.shop = shop;
  res.json({ authenticated: true, shop: store.shopDomain, lastProductsSyncAt: store.lastProductsSyncAt, lastOrdersSyncAt: store.lastOrdersSyncAt });
});

app.post("/api/logout", (req, res) => { req.session.destroy(() => { res.json({ ok: true }); }); });

// -----------------------------
// API: Sync
// -----------------------------
app.post("/api/sync/products", requireStore, async (req, res) => { try { await syncProductsForStore(req.store); const s = await prisma.store.findUnique({ where: { id: req.store.id } }); res.json({ ok: true, lastProductsSyncAt: s.lastProductsSyncAt }); } catch (e) { const h = handleShopifyError(e, res, req.store.shopDomain); if (h) return; res.status(500).json({ error: e.message }); } });
app.post("/api/sync/orders", requireStore, async (req, res) => { try { await syncOrdersForStore(req.store); const s = await prisma.store.findUnique({ where: { id: req.store.id } }); res.json({ ok: true, lastOrdersSyncAt: s.lastOrdersSyncAt }); } catch (e) { const h = handleShopifyError(e, res, req.store.shopDomain); if (h) return; res.status(500).json({ error: e.message }); } });
app.post("/api/sync/all", requireStore, async (req, res) => { try { const s = await autoSyncIfNeeded(req.store); res.json({ ok: true, lastProductsSyncAt: s.lastProductsSyncAt, lastOrdersSyncAt: s.lastOrdersSyncAt }); } catch (e) { const h = handleShopifyError(e, res, req.store.shopDomain); if (h) return; res.status(500).json({ error: e.message }); } });

// -----------------------------
// API: Dashboard
// -----------------------------
app.get("/api/dashboard", requireStore, async (req, res) => {
  try {
    const store = await autoSyncIfNeeded(req.store);
    const variants = await prisma.variant.findMany({ where: { storeId: store.id }, include: { product: true, orderItems: { include: { order: true } } }, orderBy: { product: { title: "asc" } } });
    let totalVariants = 0, missingCosts = 0, lowMargins = 0, losingMoney = 0, healthyMargins = 0;
    const alerts = [];
    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let totalRevenue30d = 0, totalProfit30d = 0;
    const products = variants.map((v) => {
      totalVariants++;
      const price = v.price, cost = v.cogs;
      const recentSales = v.orderItems.filter((i) => new Date(i.order.createdAt) >= last30);
      const unitsSold30 = recentSales.reduce((s, i) => s + i.quantity, 0);
      const revenue30d = recentSales.reduce((s, i) => s + i.lineTotal, 0);
      totalRevenue30d += revenue30d;
      let profit = null, marginPercent = null, status = "missing_cost";
      if (cost != null) {
        profit = price - cost; marginPercent = price > 0 ? (profit / price) * 100 : 0; totalProfit30d += profit * unitsSold30;
        if (profit < 0) { status = "losing"; losingMoney++; } else if (marginPercent < 40) { status = "low"; lowMargins++; } else if (marginPercent < 60) { status = "okay"; } else { status = "good"; healthyMargins++; }
      } else { missingCosts++; }
      const item = { id: v.id, shopifyVariantId: v.shopifyVariantId, productTitle: v.product.title, sku: v.sku || "Default", price, cost, profit, marginPercent, inventoryQty: v.inventoryQty, unitsSold30, revenue30d, status, previousPrice: v.previousPrice ?? null };
      if (status === "losing" || status === "low" || status === "missing_cost") alerts.push(item);
      return item;
    });
    const totalProducts = await prisma.product.count({ where: { storeId: store.id } });
    res.json({ store: { shop: store.shopDomain, lastProductsSyncAt: store.lastProductsSyncAt, lastOrdersSyncAt: store.lastOrdersSyncAt }, summary: { totalProducts, totalVariants, missingCosts, lowMargins, losingMoney, healthyMargins, totalRevenue30d: Math.round(totalRevenue30d * 100) / 100, totalProfit30d: Math.round(totalProfit30d * 100) / 100 }, alerts, products });
  } catch (e) { const h = handleShopifyError(e, res, req.store.shopDomain); if (h) return; res.status(500).json({ error: e.message }); }
});

// -----------------------------
// API: Products & Costs
// -----------------------------
app.get("/api/products", requireStore, async (req, res) => {
  try {
    const variants = await prisma.variant.findMany({ where: { storeId: req.store.id }, include: { product: true }, orderBy: { product: { title: "asc" } } });
    res.json({ products: variants.map((v) => { const price = v.price, cost = v.cogs, profit = cost != null ? price - cost : null, marginPercent = cost != null && price > 0 ? (profit / price) * 100 : null; let status = "missing_cost"; if (cost != null) { if (profit < 0) status = "losing"; else if (marginPercent < 40) status = "low"; else if (marginPercent < 60) status = "okay"; else status = "good"; } return { id: v.id, shopifyVariantId: v.shopifyVariantId, productId: v.productId, productTitle: v.product.title, sku: v.sku || "Default", price, cost, profit, marginPercent, inventoryQty: v.inventoryQty, status }; }) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/products/:variantId/cost", requireStore, async (req, res) => {
  try {
    const { variantId } = req.params; const { cogs } = req.body;
    if (cogs === undefined || cogs === null || cogs === "") return res.status(400).json({ error: "Missing cogs value" });
    const parsed = parseFloat(cogs); if (isNaN(parsed) || parsed < 0) return res.status(400).json({ error: "Invalid cost value" });
    const variant = await prisma.variant.findUnique({ where: { id: variantId } });
    if (!variant || variant.storeId !== req.store.id) return res.status(404).json({ error: "Variant not found" });
    const updated = await prisma.variant.update({ where: { id: variantId }, data: { cogs: parsed }, include: { product: true } });
    const price = updated.price, cost = updated.cogs, profit = cost != null ? price - cost : null, marginPercent = cost != null && price > 0 ? (profit / price) * 100 : null;
    res.json({ ok: true, variant: { id: updated.id, productTitle: updated.product.title, sku: updated.sku, price, cost, profit, marginPercent } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// -----------------------------
// API: Recommendations
// -----------------------------
app.get("/api/recommendations", requireStore, async (req, res) => {
  try {
    const store = await autoSyncIfNeeded(req.store); const targetMargin = 0.6;
    const variants = await prisma.variant.findMany({ where: { storeId: store.id }, include: { product: true }, orderBy: { product: { title: "asc" } } });
    const recommendations = variants.map((v) => {
      const price = Number(v.price || 0), cost = v.cogs == null ? null : Number(v.cogs);
      if (cost === null || price <= 0) return { variantId: v.id, previousPrice: v.previousPrice ?? null, productTitle: v.product.title, sku: v.sku || "Default", currentPrice: price, cost, currentMargin: null, suggestedPrice: null, priceDifference: null, recommendation: "Enter a cost first", status: "missing_cost" };
      const currentProfit = price - cost, currentMargin = (currentProfit / price) * 100, suggestedPrice = cost / (1 - targetMargin), priceDifference = suggestedPrice - price;
      let recommendation = "Price looks solid", status = "good";
      if (currentProfit < 0) { recommendation = "Losing money — raise price immediately"; status = "losing"; } else if (currentMargin < 40) { recommendation = `Increase price by $${priceDifference.toFixed(2)}`; status = "low"; } else if (currentMargin < 60) { recommendation = `Consider increasing price by $${Math.max(priceDifference, 0).toFixed(2)}`; status = "okay"; } else if (priceDifference < -0.01) { recommendation = `Could lower price by $${Math.abs(priceDifference).toFixed(2)}`; }
      return { variantId: v.id, previousPrice: v.previousPrice ?? null, productTitle: v.product.title, sku: v.sku || "Default", currentPrice: price, cost, currentMargin: Math.round(currentMargin * 100) / 100, suggestedPrice: Math.round(suggestedPrice * 100) / 100, priceDifference: Math.round(priceDifference * 100) / 100, recommendation, status };
    });
    res.json({ recommendations });
  } catch (e) { const h = handleShopifyError(e, res, req.store.shopDomain); if (h) return; res.status(500).json({ error: e.message }); }
});

// -----------------------------
// API: Prices
// -----------------------------
app.post("/api/prices/apply", requireStore, async (req, res) => {
  try {
    const { variantId, suggestedPrice } = req.body;
    if (!variantId || suggestedPrice == null) return res.status(400).json({ error: "Missing variantId or suggestedPrice" });
    const variant = await prisma.variant.findUnique({ where: { id: variantId }, include: { product: true } });
    if (!variant || variant.storeId !== req.store.id) return res.status(404).json({ error: "Variant not found" });
    const oldPrice = Number(variant.price), newPrice = Number(suggestedPrice);
    const { response, data } = await fetchShopifyWrite(`https://${req.store.shopDomain}/admin/api/2024-01/variants/${variant.shopifyVariantId}.json`, "PUT", { variant: { id: variant.shopifyVariantId, price: String(newPrice.toFixed(2)) } }, req.store);
    if (!response.ok) return res.status(400).json({ error: "Shopify update failed", details: data });
    await prisma.variant.update({ where: { id: variantId }, data: { previousPrice: oldPrice, price: newPrice } });
    res.json({ ok: true, oldPrice, newPrice });
  } catch (e) { const h = handleShopifyError(e, res, req.store.shopDomain); if (h) return; res.status(500).json({ error: e.message }); }
});

app.post("/api/prices/apply-all", requireStore, async (req, res) => {
  try {
    const targetMargin = 0.6; const variants = await prisma.variant.findMany({ where: { storeId: req.store.id }, include: { product: true } });
    let applied = 0, failed = 0;
    for (const v of variants) { const price = Number(v.price || 0), cost = v.cogs == null ? null : Number(v.cogs); if (cost === null || price <= 0) continue; const sp = cost / (1 - targetMargin); try { const { response } = await fetchShopifyWrite(`https://${req.store.shopDomain}/admin/api/2024-01/variants/${v.shopifyVariantId}.json`, "PUT", { variant: { id: v.shopifyVariantId, price: String(sp.toFixed(2)) } }, req.store); if (!response.ok) { failed++; continue; } await prisma.variant.update({ where: { id: v.id }, data: { previousPrice: price, price: parseFloat(sp.toFixed(2)) } }); applied++; } catch (e) { if (e.code === "REAUTH_REQUIRED") throw e; failed++; } }
    res.json({ ok: true, applied, failed });
  } catch (e) { const h = handleShopifyError(e, res, req.store.shopDomain); if (h) return; res.status(500).json({ error: e.message }); }
});

app.post("/api/prices/undo/:variantId", requireStore, async (req, res) => {
  try {
    const { variantId } = req.params; const variant = await prisma.variant.findUnique({ where: { id: variantId } });
    if (!variant || variant.storeId !== req.store.id) return res.status(404).json({ error: "Variant not found" });
    if (variant.previousPrice == null) return res.status(400).json({ error: "No previous price to restore" });
    const { response, data } = await fetchShopifyWrite(`https://${req.store.shopDomain}/admin/api/2024-01/variants/${variant.shopifyVariantId}.json`, "PUT", { variant: { id: variant.shopifyVariantId, price: String(Number(variant.previousPrice).toFixed(2)) } }, req.store);
    if (!response.ok) return res.status(400).json({ error: "Undo failed", details: data });
    await prisma.variant.update({ where: { id: variantId }, data: { price: variant.previousPrice, previousPrice: null } });
    res.json({ ok: true });
  } catch (e) { const h = handleShopifyError(e, res, req.store.shopDomain); if (h) return; res.status(500).json({ error: e.message }); }
});

// -----------------------------
// API: Inventory
// -----------------------------
app.get("/api/inventory", requireStore, async (req, res) => {
  try {
    const store = await autoSyncIfNeeded(req.store);
    const variants = await prisma.variant.findMany({ where: { storeId: store.id }, include: { product: true, orderItems: { include: { order: true } } }, orderBy: { product: { title: "asc" } } });
    const now = new Date(), last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let urgentReorders = 0, reorderSoon = 0, overstockRisks = 0, healthyInventory = 0;
    const items = variants.map((v) => {
      const inventory = v.inventoryQty || 0;
      const recentSales = v.orderItems.filter((i) => new Date(i.order.createdAt) >= last30);
      const unitsSold30 = recentSales.reduce((s, i) => s + i.quantity, 0), dailySales = unitsSold30 / 30;
      const sm = getSeasonalMultiplier(v.product.title), adj = dailySales * sm;
      const days = adj > 0 ? inventory / adj : Infinity;
      let rec = "No action needed", rq = 0, status = "good";
      if (adj === 0) { rec = "No sales data"; status = "no_data"; } else if (days < 7) { rq = Math.ceil(adj * 30); rec = `URGENT: reorder ${rq} units`; status = "urgent"; urgentReorders++; } else if (days < 14) { rq = Math.ceil(adj * 21); rec = `Reorder soon: ${rq} units`; status = "soon"; reorderSoon++; } else if (days > 60 && days !== Infinity) { rec = "Overstock risk"; status = "overstock"; overstockRisks++; } else { healthyInventory++; }
      return { id: v.id, productTitle: v.product.title, sku: v.sku || "Default", inventory, unitsSold30, dailySales: Math.round(dailySales * 100) / 100, seasonalMultiplier: sm, adjustedDailySales: Math.round(adj * 100) / 100, daysOfInventory: days === Infinity ? null : Math.round(days * 10) / 10, reorderQty: rq, recommendation: rec, status };
    });
    res.json({ summary: { total: variants.length, urgentReorders, reorderSoon, overstockRisks, healthyInventory }, items });
  } catch (e) { const h = handleShopifyError(e, res, req.store.shopDomain); if (h) return; res.status(500).json({ error: e.message }); }
});

// -----------------------------
// API: Deal Simulator
// -----------------------------
app.post("/api/deals/simulate", requireStore, async (req, res) => {
  try {
    const { variantIds, dealType, discountValue, extraCost, projectedLiftPercent } = req.body;
    if (!variantIds?.length) return res.status(400).json({ error: "No products selected" });
    const variants = await prisma.variant.findMany({ where: { id: { in: variantIds }, storeId: req.store.id }, include: { product: true, orderItems: { include: { order: true } } } });
    const now = new Date(), last7 = new Date(now - 7*864e5), last30 = new Date(now - 30*864e5), last90 = new Date(now - 90*864e5);
    const results = variants.map((v) => {
      const us7 = v.orderItems.filter((i) => new Date(i.order.createdAt) >= last7).reduce((s,i) => s+i.quantity, 0);
      const us30 = v.orderItems.filter((i) => new Date(i.order.createdAt) >= last30).reduce((s,i) => s+i.quantity, 0);
      const us90 = v.orderItems.filter((i) => new Date(i.order.createdAt) >= last90).reduce((s,i) => s+i.quantity, 0);
      const cp = Number(v.price||0), cost = v.cogs==null?null:Number(v.cogs), inv = Number(v.inventoryQty||0);
      const cpu = cost==null?null:cp-cost, cmp = cost==null||cp<=0?null:(cpu/cp)*100;
      let ep = cp, npu = null, nmp = null;
      if (cost!=null) { if (dealType==="percent"){ep=Math.max(0,cp*(1-discountValue/100));npu=ep-cost-extraCost;nmp=ep>0?(npu/ep)*100:0;} else if(dealType==="fixed"){ep=Math.max(0,cp-discountValue);npu=ep-cost-extraCost;nmp=ep>0?(npu/ep)*100:0;} else if(dealType==="bogo_free"){const r=cp,c=cost*2+extraCost;ep=cp/2;npu=(r-c)/2;nmp=r>0?((r-c)/r)*100:0;} else if(dealType==="bogo_percent"){const s=cp*(1-discountValue/100),r=cp+s,c=cost*2+extraCost;ep=r/2;npu=(r-c)/2;nmp=r>0?((r-c)/r)*100:0;} }
      const pu = Math.max(0, Math.round(us30*(1+projectedLiftPercent/100)));
      const ctp = cpu==null?null:cpu*us30, pdp = npu==null?null:npu*pu;
      let st = "good"; if(cost==null)st="missing_cost"; else if(npu<0)st="bad"; else if(pdp<ctp)st="risky";
      return { variantId:v.id, productTitle:v.product.title, sku:v.sku||"Default", currentPrice:cp, cost, inventory:inv, unitsSold7:us7, unitsSold30:us30, unitsSold90:us90, currentProfitPerUnit:cpu!=null?Math.round(cpu*100)/100:null, currentMarginPercent:cmp!=null?Math.round(cmp*100)/100:null, effectivePrice:Math.round(ep*100)/100, newProfitPerUnit:npu!=null?Math.round(npu*100)/100:null, newMarginPercent:nmp!=null?Math.round(nmp*100)/100:null, projectedUnits:pu, currentTotalProfit:ctp!=null?Math.round(ctp*100)/100:null, projectedDealProfit:pdp!=null?Math.round(pdp*100)/100:null, status:st };
    });
    const tcp = results.reduce((s,r)=>s+(r.currentTotalProfit||0),0), tpp = results.reduce((s,r)=>s+(r.projectedDealProfit||0),0);
    res.json({ summary: { totalCurrentProfit:Math.round(tcp*100)/100, totalProjectedProfit:Math.round(tpp*100)/100, good:results.filter(r=>r.status==="good").length, risky:results.filter(r=>r.status==="risky").length, bad:results.filter(r=>r.status==="bad").length }, results });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// -----------------------------
// API: AI (rate limited — 20/min per store)
// -----------------------------
const aiRL = rateLimit("ai", 20, 60000);

app.post("/api/ai/summary", requireStore, aiRL, async (req, res) => {
  try {
    const variants = await prisma.variant.findMany({ where: { storeId: req.store.id }, include: { product: true } });
    if (!variants.length) return res.json({ analysis: "No products synced yet." });
    const sd = variants.map((v) => { const p=v.price,c=v.cogs,pr=c==null?null:p-c,mp=c==null||p<=0?null:(pr/p)*100; return { productTitle:v.product.title, variantTitle:v.sku||"Default", price:p, cost:c, profit:pr, marginPercent:mp, inventoryQty:v.inventoryQty }; });
    const t = { totalVariants:sd.length, missingCosts:sd.filter(v=>v.cost==null).length, losingMoney:sd.filter(v=>v.profit!=null&&v.profit<0).length, lowMargins:sd.filter(v=>v.marginPercent!=null&&v.marginPercent<40).length, healthyMargins:sd.filter(v=>v.marginPercent!=null&&v.marginPercent>=60).length };
    const c = await openai.chat.completions.create({ model:"gpt-4.1-mini", messages:[{role:"system",content:"You are an expert ecommerce margin and pricing strategist."},{role:"user",content:`Analyze this Shopify store and give: 1) Executive summary 2) Biggest risks 3) Biggest opportunities 4) 3 specific actions. Be practical and concise. Do not mention you are an AI.\n\nStore: ${req.store.shopDomain}\n${JSON.stringify({totals:t,products:sd.slice(0,50)},null,2)}`}], temperature:0.7 });
    res.json({ analysis: c.choices?.[0]?.message?.content || "No analysis returned." });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/ai/product/:variantId", requireStore, aiRL, async (req, res) => {
  try {
    const v = await prisma.variant.findUnique({ where:{id:req.params.variantId}, include:{product:true} });
    if (!v||v.storeId!==req.store.id) return res.status(404).json({error:"Variant not found"});
    const p=v.price,co=v.cogs??null,pr=co==null?null:p-co,mp=co==null||p<=0?null:(pr/p)*100;
    const c = await openai.chat.completions.create({ model:"gpt-4.1-mini", messages:[{role:"system",content:"You are an expert ecommerce margin and pricing strategist."},{role:"user",content:`Analyze this product: 1) Profitability assessment 2) Raise/lower/keep price? 3) Lower cost? 4) One action. Be concise.\n\n${JSON.stringify({productTitle:v.product.title,sku:v.sku,price:p,cost:co,profit:pr,marginPercent:mp},null,2)}`}], temperature:0.7 });
    res.json({ analysis: c.choices?.[0]?.message?.content || "No analysis." });
  } catch (e) { res.status(500).json({error:e.message}); }
});

app.post("/api/ai/inventory/:variantId", requireStore, aiRL, async (req, res) => {
  try {
    const v = await prisma.variant.findUnique({ where:{id:req.params.variantId}, include:{product:true,orderItems:{include:{order:true}}} });
    if (!v||v.storeId!==req.store.id) return res.status(404).json({error:"Variant not found"});
    const now=new Date(), last30=new Date(now-30*864e5), inv=v.inventoryQty||0;
    const rs=v.orderItems.filter(i=>new Date(i.order.createdAt)>=last30), us=rs.reduce((s,i)=>s+i.quantity,0), ds=us/30, sm=getSeasonalMultiplier(v.product.title), ad=ds*sm, di=ad>0?inv/ad:Infinity;
    const c = await openai.chat.completions.create({ model:"gpt-4.1-mini", messages:[{role:"system",content:"You are an expert ecommerce inventory strategist."},{role:"user",content:`Analyze: 1) Assessment 2) Reorder? 3) Qty 4) Seasonality 5) Action. Be concise.\n\n${JSON.stringify({productTitle:v.product.title,sku:v.sku,inventory:inv,unitsSold30:us,dailySales:ds,seasonalMultiplier:sm,adjustedDailySales:ad,daysOfInventory:di===Infinity?"Infinity":di.toFixed(1)},null,2)}`}], temperature:0.7 });
    res.json({ analysis: c.choices?.[0]?.message?.content || "No analysis." });
  } catch (e) { res.status(500).json({error:e.message}); }
});

app.post("/api/ai/deal", requireStore, aiRL, async (req, res) => {
  try {
    const { simulationData } = req.body;
    const c = await openai.chat.completions.create({ model:"gpt-4.1-mini", messages:[{role:"system",content:"You are an expert ecommerce promotion strategist. When asked to predict sales lift, include a specific percentage estimate in format 'X%'."},{role:"user",content:`Analyze: 1) Should all go on sale? 2) Exclude which? 3) Strongest? 4) Too broad? 5) Better deal? 6) Predict sales lift %. Be concise.\n\n${JSON.stringify(simulationData,null,2)}`}], temperature:0.7 });
    res.json({ analysis: c.choices?.[0]?.message?.content || "No analysis." });
  } catch (e) { res.status(500).json({error:e.message}); }
});


// -----------------------------
// Production: Serve React
// -----------------------------
const path = require("path");
if (process.env.NODE_ENV === "production") {
  const dist = path.join(__dirname, "client", "dist");
  app.use(express.static(dist));
  app.get(/^\/(?!api|auth|webhooks).*/, (req, res) => { res.sendFile(path.join(dist, "index.html")); });
}

// Global error handler
app.use((err, req, res, next) => { console.error("Unhandled:", err.message); res.status(500).json({ error: "Internal server error" }); });

app.listen(PORT, () => { console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || "development"})`); });