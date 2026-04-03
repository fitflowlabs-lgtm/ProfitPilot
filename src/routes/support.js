const { Router } = require("express");
const prisma = require("../db");
const OpenAI = require("openai");
const { sendReply } = require("../mailer");
const { pollInbox } = require("../emailPoller");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const router = Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
  next();
}

// GET /tickets — list tickets with optional ?status= filter
router.get("/tickets", requireAuth, async (req, res) => {
  try {
    const where = req.query.status ? { status: req.query.status } : {};
    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true, plan: true } } },
    });
    res.json({ tickets });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /:id — single ticket
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { name: true, email: true, plan: true } } },
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json({ ticket });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /:id/draft — update aiDraft
router.put("/:id/draft", requireAuth, async (req, res) => {
  const { draft } = req.body || {};
  if (draft === undefined) return res.status(400).json({ error: "Missing draft field" });
  try {
    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { aiDraft: draft },
    });
    res.json({ ticket });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /:id/send — send aiDraft via email, mark as sent
router.post("/:id/send", requireAuth, async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    if (!ticket.aiDraft) return res.status(400).json({ error: "No AI draft to send" });

    await sendReply({ to: ticket.senderEmail, subject: ticket.subject, text: ticket.aiDraft });

    const updated = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status: "sent" },
    });
    res.json({ ticket: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /:id/dismiss — mark as dismissed
router.post("/:id/dismiss", requireAuth, async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status: "dismissed" },
    });
    res.json({ ticket });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /:id/regenerate — re-generate AI draft
router.post("/:id/regenerate", requireAuth, async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // Look up sender in User table
    const user = await prisma.user.findUnique({ where: { email: ticket.senderEmail } });
    let contextBlock = "";
    if (user) {
      const stores = await prisma.store.findMany({
        where: { userId: user.id },
        include: {
          variants: { include: { product: true, orderItems: { include: { order: true } } }, take: 20 },
        },
      });
      const storeLines = stores.map((s) => {
        const variants = s.variants.map((v) => {
          const revenue30d = v.orderItems
            .filter((i) => new Date(i.order.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
            .reduce((sum, i) => sum + i.lineTotal, 0);
          const margin = v.cogs && v.price ? (((v.price - v.cogs) / v.price) * 100).toFixed(1) : null;
          return `  - ${v.product.title} | price: $${v.price} | cost: ${v.cogs ? `$${v.cogs}` : "unknown"} | margin: ${margin ? `${margin}%` : "unknown"} | revenue 30d: $${revenue30d.toFixed(2)}`;
        });
        return `Store: ${s.shopName || s.shopDomain}\n${variants.join("\n")}`;
      }).join("\n\n");
      contextBlock = `\n\nUSER CONTEXT:\nName: ${user.name}\nEmail: ${user.email}\nPlan: ${user.plan}\n\nStore Data:\n${storeLines || "No products synced."}`;
    }

    const prompt = `Email from: ${ticket.senderName || ticket.senderEmail} <${ticket.senderEmail}>\nSubject: ${ticket.subject || "(no subject)"}\n\nMessage:\n${ticket.body}${contextBlock}`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are a helpful support agent for Margin Pilot, a Shopify margin analytics tool. Draft a professional, friendly reply. You have access to the user's store data below. Keep responses concise and helpful. Sign off as the Margin Pilot team." },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
    });
    const aiDraft = completion.choices?.[0]?.message?.content || "";

    const updated = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { aiDraft },
    });
    res.json({ ticket: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /poll — manually trigger inbox check (admin only)
router.post("/poll", requireAuth, async (req, res) => {
  try {
    await pollInbox();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
