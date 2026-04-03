const { createSupportTicket } = require("./supportHelper");

const ZOHO_API_BASE = "https://mail.zoho.com/api/accounts";

async function fetchUnreadEmails() {
  const accountId = process.env.ZOHO_ACCOUNT_ID;
  const token = process.env.ZOHO_MAIL_TOKEN;
  const url = `${ZOHO_API_BASE}/${accountId}/messages/view?status=unread&limit=25&sortorder=false`;
  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoho API error ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data?.data || [];
}

async function markAsRead(messageId) {
  const accountId = process.env.ZOHO_ACCOUNT_ID;
  const token = process.env.ZOHO_MAIL_TOKEN;
  const url = `${ZOHO_API_BASE}/${accountId}/updatemessage`;
  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messageId, isRead: true }),
  });
}

async function pollInbox() {
  console.log("[ZohoPoller] Checking inbox for unread emails...");
  try {
    const emails = await fetchUnreadEmails();
    if (emails.length === 0) {
      console.log("[ZohoPoller] No unread emails.");
      return;
    }
    console.log(`[ZohoPoller] Found ${emails.length} unread email(s).`);
    for (const email of emails) {
      const from_email = email.fromAddress || email.sender;
      const from_name = email.fromDisplayName || email.senderDisplayName || null;
      const subject = email.subject || null;
      const text = email.content || email.summary || "";
      if (!from_email || !text) {
        console.log(`[ZohoPoller] Skipping email ${email.messageId} — missing from or body.`);
        await markAsRead(email.messageId);
        continue;
      }
      try {
        await createSupportTicket({ from_email, from_name, subject, text });
        await markAsRead(email.messageId);
        console.log(`[ZohoPoller] Processed email from ${from_email}: "${subject}"`);
      } catch (e) {
        console.error(`[ZohoPoller] Failed to process email ${email.messageId}:`, e.message);
      }
    }
  } catch (e) {
    console.error("[ZohoPoller] Poll failed:", e.message);
  }
}

function startPoller(intervalMs = 5 * 60 * 1000) {
  console.log(`[ZohoPoller] Starting — polling every ${intervalMs / 60000} minute(s).`);
  pollInbox(); // run immediately on startup
  return setInterval(pollInbox, intervalMs);
}

module.exports = { startPoller };
