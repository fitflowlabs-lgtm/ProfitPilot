const prisma = require("./db");
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function createSupportTicket({ from_email, from_name, subject, text }) {
  const user = await prisma.user.findUnique({ where: { email: from_email } });

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

  const prompt = `Email from: ${from_name || from_email} <${from_email}>\nSubject: ${subject || "(no subject)"}\n\nMessage:\n${text}${contextBlock}`;
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: "You are a helpful support agent for Margin Pilot, a Shopify margin analytics tool. Draft a professional, friendly reply. You have access to the user's store data below. Keep responses concise and helpful. Sign off as the Margin Pilot team." },
      { role: "user", content: prompt },
    ],
    temperature: 0.5,
  });
  const aiDraft = completion.choices?.[0]?.message?.content || "";
  console.log(`[Support] New ticket from ${from_email}\nSubject: ${subject}\n\nAI Draft:\n${aiDraft}\n${"─".repeat(60)}`);

  await prisma.supportTicket.create({
    data: {
      senderEmail: from_email,
      senderName: from_name || null,
      subject: subject || null,
      body: text,
      aiDraft,
      userId: user?.id || null,
    },
  });
}

module.exports = { createSupportTicket };
