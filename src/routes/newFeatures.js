const express = require("express");
const crypto = require("crypto");

function verifyWebhookHmac(rawBody, hmacHeader, secret) {
  if (!hmacHeader) return false;
  const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  try { return crypto.timingSafeEqual(Buffer.from(hmacHeader), Buffer.from(computed)); } catch { return false; }
}

module.exports = (prisma, requireStore, handleShopifyError) => {
  const router = express.Router();

  // ------------------------------------------------------------------
  // POST /api/variants/import-cogs
  // Bulk import COGS from CSV-style rows [{ sku, cogs }]
  // ------------------------------------------------------------------
  router.post("/variants/import-cogs", requireStore, async (req, res) => {
    try {
      const { rows } = req.body || {};
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: "rows must be a non-empty array" });
      }
      let updated = 0, notFound = 0;
      const errors = [];
      for (const row of rows) {
        try {
          const sku = (row.sku || "").trim();
          const newCogs = parseFloat(row.cogs);
          if (!sku) { errors.push({ row, reason: "missing sku" }); continue; }
          if (isNaN(newCogs) || newCogs < 0) { errors.push({ row, reason: "invalid cogs" }); continue; }
          const variant = await prisma.variant.findFirst({
            where: { storeId: req.store.id, sku: { equals: sku, mode: "insensitive" } },
          });
          if (!variant) { notFound++; continue; }
          const oldCogs = variant.cogs ?? null;
          await prisma.variant.update({ where: { id: variant.id }, data: { cogs: newCogs } });
          await prisma.supplierCostLog.create({
            data: { variantId: variant.id, storeId: req.store.id, oldCogs, newCogs },
          });
          updated++;
        } catch (rowErr) {
          errors.push({ row, reason: rowErr.message });
        }
      }
      res.json({ updated, notFound, errors });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ------------------------------------------------------------------
  // POST /api/snapshots/capture
  // Capture today's snapshot for every variant in the store
  // ------------------------------------------------------------------
  router.post("/snapshots/capture", requireStore, async (req, res) => {
    try {
      const captured = await captureSnapshots(req.store, prisma);
      res.json({ captured });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ------------------------------------------------------------------
  // GET /api/variants/:id/snapshots
  // Last 90 days of snapshots for a variant
  // ------------------------------------------------------------------
  router.get("/variants/:id/snapshots", requireStore, async (req, res) => {
    try {
      const variant = await prisma.variant.findUnique({ where: { id: req.params.id } });
      if (!variant || variant.storeId !== req.store.id) {
        return res.status(404).json({ error: "Variant not found" });
      }
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const snapshots = await prisma.variantSnapshot.findMany({
        where: { variantId: variant.id, capturedAt: { gte: since } },
        orderBy: { capturedAt: "asc" },
      });
      res.json({ snapshots });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ------------------------------------------------------------------
  // GET /api/alerts
  // All active alerts for the store
  // ------------------------------------------------------------------
  router.get("/alerts", requireStore, async (req, res) => {
    try {
      const alerts = await prisma.marginAlert.findMany({
        where: { storeId: req.store.id, active: true },
        include: {
          variant: {
            include: { product: { select: { title: true } } },
            select: { price: true, cogs: true, product: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      res.json({ alerts });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ------------------------------------------------------------------
  // POST /api/alerts
  // Create a margin alert for a variant
  // ------------------------------------------------------------------
  router.post("/alerts", requireStore, async (req, res) => {
    try {
      const { variantId, threshold } = req.body || {};
      if (!variantId || threshold == null) {
        return res.status(400).json({ error: "variantId and threshold are required" });
      }
      const parsed = parseFloat(threshold);
      if (isNaN(parsed) || parsed < 0 || parsed > 1) {
        return res.status(400).json({ error: "threshold must be a decimal between 0 and 1 (e.g. 0.20)" });
      }
      const variant = await prisma.variant.findUnique({ where: { id: variantId } });
      if (!variant || variant.storeId !== req.store.id) {
        return res.status(404).json({ error: "Variant not found" });
      }
      const alert = await prisma.marginAlert.create({
        data: { storeId: req.store.id, variantId, threshold: parsed },
      });
      res.json({ alert });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ------------------------------------------------------------------
  // DELETE /api/alerts/:id
  // ------------------------------------------------------------------
  router.delete("/alerts/:id", requireStore, async (req, res) => {
    try {
      const alert = await prisma.marginAlert.findUnique({ where: { id: req.params.id } });
      if (!alert || alert.storeId !== req.store.id) {
        return res.status(404).json({ error: "Alert not found" });
      }
      await prisma.marginAlert.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ------------------------------------------------------------------
  // GET /api/alerts/check
  // Check which active alerts are currently firing
  // ------------------------------------------------------------------
  router.get("/alerts/check", requireStore, async (req, res) => {
    try {
      const { firing } = await checkAlerts(req.store, prisma);
      const all = await prisma.marginAlert.findMany({
        where: { storeId: req.store.id, active: true },
        include: { variant: { include: { product: { select: { title: true } } } } },
      });
      res.json({ firing, all });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/sync/metafields-cogs — Pull COGS from Shopify metafields and update variants
  router.post("/sync/metafields-cogs", requireStore, async (req, res) => {
    try {
      const variants = await prisma.variant.findMany({ where: { storeId: req.store.id } });
      let synced = 0, skipped = 0, notFound = 0;
      for (const variant of variants) {
        try {
          const url = `https://${req.store.shopDomain}/admin/api/2024-01/variants/${variant.shopifyVariantId}/metafields.json`;
          const response = await fetch(url, {
            headers: { "X-Shopify-Access-Token": req.store.accessToken, "Content-Type": "application/json" },
          });
          if (!response.ok) { skipped++; continue; }
          const data = await response.json();
          const metafields = data.metafields || [];
          const cogsField = metafields.find(
            (m) =>
              (m.namespace === "margin_pilot" && m.key === "cogs") ||
              (m.namespace === "inventory" && m.key === "cost") ||
              (m.namespace === "custom" && m.key === "cost_per_item")
          );
          if (!cogsField) { notFound++; continue; }
          const newCogs = parseFloat(cogsField.value);
          if (isNaN(newCogs) || newCogs < 0) { skipped++; continue; }
          const oldCogs = variant.cogs ?? null;
          await prisma.variant.update({ where: { id: variant.id }, data: { cogs: newCogs } });
          await prisma.supplierCostLog.create({
            data: { variantId: variant.id, storeId: req.store.id, oldCogs, newCogs, note: `metafield:${cogsField.namespace}.${cogsField.key}` },
          });
          synced++;
        } catch (variantErr) {
          if (variantErr.code === "REAUTH_REQUIRED") throw variantErr;
          skipped++;
        }
      }
      res.json({ synced, skipped, notFound });
    } catch (e) {
      const h = handleShopifyError(e, res, req.store.shopDomain);
      if (h) return;
      res.status(500).json({ error: e.message });
    }
  });

  // ------------------------------------------------------------------
  // GET /api/reports/pnl
  // Monthly P&L aggregation
  // ------------------------------------------------------------------
  router.get("/reports/pnl", requireStore, async (req, res) => {
    try {
      const months = Math.max(1, parseInt(req.query.months) || 6);
      const since = new Date();
      since.setMonth(since.getMonth() - months);
      since.setDate(1);
      since.setHours(0, 0, 0, 0);

      const orders = await prisma.order.findMany({
        where: { storeId: req.store.id, createdAt: { gte: since } },
        include: {
          items: { include: { variant: { select: { cogs: true } } } },
        },
        orderBy: { createdAt: "asc" },
      });

      const monthMap = new Map();
      for (const order of orders) {
        const d = new Date(order.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap.has(key)) monthMap.set(key, { revenue: 0, estimatedCogs: 0 });
        const bucket = monthMap.get(key);
        for (const item of order.items) {
          bucket.revenue += item.lineTotal || 0;
          if (item.variant?.cogs != null) {
            bucket.estimatedCogs += item.quantity * item.variant.cogs;
          }
        }
      }

      const result = Array.from(monthMap.entries())
        .map(([month, { revenue, estimatedCogs }]) => {
          const grossProfit = revenue - estimatedCogs;
          const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
          return {
            month,
            revenue: Math.round(revenue * 100) / 100,
            estimatedCogs: Math.round(estimatedCogs * 100) / 100,
            grossProfit: Math.round(grossProfit * 100) / 100,
            grossMarginPct: Math.round(grossMarginPct * 100) / 100,
          };
        })
        .sort((a, b) => b.month.localeCompare(a.month));

      res.json({ pnl: result });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ------------------------------------------------------------------
  // GET /api/reports/profitability
  // Per-variant profitability for last 30 days
  // ------------------------------------------------------------------
  router.get("/reports/profitability", requireStore, async (req, res) => {
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const variants = await prisma.variant.findMany({
        where: { storeId: req.store.id, cogs: { not: null } },
        include: {
          product: { select: { title: true } },
          orderItems: {
            where: { order: { createdAt: { gte: since } } },
            include: { order: { select: { createdAt: true } } },
          },
        },
      });

      const rows = variants.map((v) => {
        const totalRevenue30d = v.orderItems.reduce((s, i) => s + (i.lineTotal || 0), 0);
        const unitsSold30d = v.orderItems.reduce((s, i) => s + i.quantity, 0);
        const grossProfit30d = unitsSold30d * (v.price - v.cogs);
        const marginPct = v.price > 0 ? ((v.price - v.cogs) / v.price) * 100 : 0;
        return {
          variantId: v.id,
          productTitle: v.product.title,
          sku: v.sku || "Default",
          price: v.price,
          cogs: v.cogs,
          totalRevenue30d: Math.round(totalRevenue30d * 100) / 100,
          unitsSold30d,
          grossProfit30d: Math.round(grossProfit30d * 100) / 100,
          marginPct: Math.round(marginPct * 100) / 100,
        };
      });

      rows.sort((a, b) => b.grossProfit30d - a.grossProfit30d);
      res.json({ profitability: rows });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ------------------------------------------------------------------
  // POST /api/webhooks/register
  // Register the 3 Shopify webhooks for this store
  // ------------------------------------------------------------------
  router.post("/webhooks/register", requireStore, async (req, res) => {
    try {
      const topics = ["products/update", "orders/create", "app/uninstalled"];
      const address = `${process.env.APP_URL}/api/webhooks/shopify`;
      const registered = [];
      for (const topic of topics) {
        try {
          const response = await fetch(
            `https://${req.store.shopDomain}/admin/api/2024-01/webhooks.json`,
            {
              method: "POST",
              headers: {
                "X-Shopify-Access-Token": req.store.accessToken,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ webhook: { topic, address, format: "json" } }),
            }
          );
          if (response.ok) registered.push(topic);
        } catch (topicErr) {
          console.error(`Webhook register failed for ${topic}:`, topicErr.message);
        }
      }
      res.json({ ok: true, registered });
    } catch (e) {
      const h = handleShopifyError(e, res, req.store.shopDomain);
      if (h) return;
      res.status(500).json({ error: e.message });
    }
  });

  // ------------------------------------------------------------------
  // POST /api/webhooks/shopify
  // Unified Shopify webhook handler (products/update, orders/create, app/uninstalled)
  // NOTE: raw body parser for this path is added in server.js
  // ------------------------------------------------------------------
  router.post("/webhooks/shopify", async (req, res) => {
    const hmac = req.headers["x-shopify-hmac-sha256"];
    if (!verifyWebhookHmac(req.body, hmac, process.env.SHOPIFY_API_SECRET)) {
      console.error("Shopify webhook HMAC failed");
      return res.status(401).send("Unauthorized");
    }
    const topic = req.headers["x-shopify-topic"];
    const shopDomain = req.headers["x-shopify-shop-domain"];
    let payload;
    try {
      payload = JSON.parse(req.body.toString());
    } catch (e) {
      return res.status(400).send("Bad JSON");
    }

    try {
      if (topic === "products/update") {
        const shopifyProductId = String(payload.id);
        const store = await prisma.store.findUnique({ where: { shopDomain } });
        if (store) {
          const dbProduct = await prisma.product.findUnique({ where: { shopifyProductId } });
          if (dbProduct) {
            await prisma.product.update({ where: { shopifyProductId }, data: { title: payload.title } });
            for (const v of payload.variants || []) {
              await prisma.variant.upsert({
                where: { shopifyVariantId: String(v.id) },
                update: { price: parseFloat(v.price || 0), sku: v.sku || null, inventoryQty: v.inventory_quantity || 0 },
                create: {
                  shopifyVariantId: String(v.id),
                  productId: dbProduct.id,
                  storeId: store.id,
                  sku: v.sku || null,
                  price: parseFloat(v.price || 0),
                  inventoryQty: v.inventory_quantity || 0,
                },
              });
            }
          }
        }
      } else if (topic === "orders/create") {
        const store = await prisma.store.findUnique({ where: { shopDomain } });
        if (store) {
          const dbOrder = await prisma.order.upsert({
            where: { shopifyOrderId: String(payload.id) },
            update: {
              orderNumber: payload.name || String(payload.order_number || ""),
              currency: payload.currency || null,
              totalPrice: payload.total_price ? parseFloat(payload.total_price) : null,
              createdAt: new Date(payload.created_at),
            },
            create: {
              shopifyOrderId: String(payload.id),
              storeId: store.id,
              orderNumber: payload.name || String(payload.order_number || ""),
              currency: payload.currency || null,
              totalPrice: payload.total_price ? parseFloat(payload.total_price) : null,
              createdAt: new Date(payload.created_at),
            },
          });
          for (const item of payload.line_items || []) {
            if (!item.variant_id) continue;
            const variant = await prisma.variant.findUnique({ where: { shopifyVariantId: String(item.variant_id) } });
            if (!variant) continue;
            await prisma.orderItem.upsert({
              where: { orderId_variantId: { orderId: dbOrder.id, variantId: variant.id } },
              update: { quantity: item.quantity || 0, unitPrice: parseFloat(item.price || 0), lineTotal: parseFloat(item.price || 0) * (item.quantity || 0) },
              create: { orderId: dbOrder.id, variantId: variant.id, quantity: item.quantity || 0, unitPrice: parseFloat(item.price || 0), lineTotal: parseFloat(item.price || 0) * (item.quantity || 0) },
            });
          }
        }
      } else if (topic === "app/uninstalled") {
        await prisma.store.updateMany({ where: { shopDomain }, data: { accessToken: "" } });
      }
    } catch (handlerErr) {
      console.error(`Shopify webhook handler error [${topic}]:`, handlerErr.message);
    }

    res.status(200).send("OK");
  });

  // ------------------------------------------------------------------
  // GET /api/variants/:id/cost-log
  // Last 20 SupplierCostLog entries for a variant
  // ------------------------------------------------------------------
  router.get("/variants/:id/cost-log", requireStore, async (req, res) => {
    try {
      const variant = await prisma.variant.findUnique({ where: { id: req.params.id } });
      if (!variant || variant.storeId !== req.store.id) {
        return res.status(404).json({ error: "Variant not found" });
      }
      const logs = await prisma.supplierCostLog.findMany({
        where: { variantId: variant.id },
        orderBy: { loggedAt: "desc" },
        take: 20,
      });
      res.json({ logs });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};

// ------------------------------------------------------------------
// Shared helpers (also used by server.js Tasks 4 & 5)
// ------------------------------------------------------------------

async function captureSnapshots(store, prisma) {
  const dayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const variants = await prisma.variant.findMany({ where: { storeId: store.id } });
  let captured = 0;
  for (const v of variants) {
    const orderItems = await prisma.orderItem.findMany({
      where: { variantId: v.id, order: { createdAt: { gte: since30 } } },
    });
    const unitsSold30d = orderItems.reduce((s, i) => s + i.quantity, 0);
    const revenue30d = orderItems.reduce((s, i) => s + (i.lineTotal || 0), 0);
    await prisma.variantSnapshot.upsert({
      where: { variantId_capturedAt: { variantId: v.id, capturedAt: dayStart } },
      update: { price: v.price, cogs: v.cogs, inventoryQty: v.inventoryQty, unitsSold30d, revenue30d, storeId: store.id },
      create: { variantId: v.id, storeId: store.id, price: v.price, cogs: v.cogs ?? null, inventoryQty: v.inventoryQty, unitsSold30d, revenue30d, capturedAt: dayStart },
    });
    captured++;
  }
  return captured;
}

async function checkAlerts(store, prisma) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const alerts = await prisma.marginAlert.findMany({
    where: { storeId: store.id, active: true },
    include: { variant: true },
  });
  const firing = [];
  for (const alert of alerts) {
    const { price, cogs } = alert.variant;
    if (cogs == null || price <= 0) continue;
    const margin = (price - cogs) / price;
    const shouldFire =
      margin < alert.threshold &&
      (alert.lastFiredAt === null || alert.lastFiredAt < twentyFourHoursAgo);
    if (shouldFire) {
      await prisma.marginAlert.update({ where: { id: alert.id }, data: { lastFiredAt: new Date() } });
      firing.push({ ...alert, currentMargin: margin });
    }
  }
  return { firing };
}

module.exports.captureSnapshots = captureSnapshots;
module.exports.checkAlerts = checkAlerts;
