const imaps = require("imap-simple");
const { simpleParser } = require("mailparser");
const { createTicketWithAIDraft } = require("./supportHelper");

const IMAP_CONFIG = {
  imap: {
    user: process.env.ZOHO_EMAIL,
    password: process.env.ZOHO_PASSWORD,
    host: "imap.zoho.com",
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000,
    connTimeout: 15000,
  },
};

async function pollInbox() {
  console.log("[EmailPoller] Checking IMAP inbox for unseen emails...");
  let connection;
  try {
    connection = await imaps.connect(IMAP_CONFIG);
    await connection.openBox("INBOX");

    const searchCriteria = ["UNSEEN"];
    const fetchOptions = { bodies: ["HEADER", "TEXT", ""], struct: true, markSeen: false };
    const messages = await connection.search(searchCriteria, fetchOptions);

    if (messages.length === 0) {
      console.log("[EmailPoller] No unseen emails.");
      return;
    }

    console.log(`[EmailPoller] Found ${messages.length} unseen email(s).`);

    for (const message of messages) {
      try {
        // Get the full raw message for parsing
        const allPart = message.parts.find((p) => p.which === "");
        if (!allPart) continue;

        const parsed = await simpleParser(allPart.body);
        const from_email = parsed.from?.value?.[0]?.address || "";
        const from_name = parsed.from?.value?.[0]?.name || null;
        const subject = parsed.subject || null;
        const text = parsed.text?.trim() || "";

        if (!from_email || !text) {
          console.log(`[EmailPoller] Skipping message — missing from address or body.`);
          await connection.addFlags(message.attributes.uid, ["\\Seen"]);
          continue;
        }

        await createTicketWithAIDraft({ from_email, from_name, subject, text });
        await connection.addFlags(message.attributes.uid, ["\\Seen"]);
        console.log(`[EmailPoller] Processed email from ${from_email}: "${subject}"`);
      } catch (e) {
        console.error(`[EmailPoller] Failed to process message:`, e.message);
      }
    }
  } catch (e) {
    console.error("[EmailPoller] IMAP poll failed:", e.message);
  } finally {
    if (connection) {
      try { connection.end(); } catch (_) {}
    }
  }
}

function startPoller(intervalMs = 5 * 60 * 1000) {
  console.log(`[EmailPoller] Starting — polling every ${intervalMs / 60000} minute(s).`);
  pollInbox();
  return setInterval(pollInbox, intervalMs);
}

module.exports = { startPoller, pollInbox };
