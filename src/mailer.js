const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: { user: process.env.ZOHO_EMAIL, pass: process.env.ZOHO_PASSWORD },
});

async function sendReply({ to, subject, text }) {
  return transporter.sendMail({
    from: `"Margin Pilot Support" <${process.env.ZOHO_EMAIL}>`,
    to,
    subject: subject ? `Re: ${subject}` : "Re: Your Margin Pilot Support Request",
    text,
  });
}

async function verifyConnection() {
  return transporter.verify();
}

async function sendVerificationEmail(to, name, token) {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const link = `${clientUrl}/verify-email?token=${token}`;
  const firstName = name?.trim().split(" ")[0] || "there";
  return transporter.sendMail({
    from: `"Margin Pilot" <${process.env.ZOHO_EMAIL}>`,
    to,
    subject: "Verify your Margin Pilot email address",
    text: `Hi ${firstName},\n\nPlease verify your email address by clicking the link below:\n\n${link}\n\nThis link expires in 24 hours.\n\nIf you didn't create a Margin Pilot account, you can ignore this email.\n\nThe Margin Pilot team`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0e1a;color:#e8eaf0;">
        <div style="margin-bottom:28px;">
          <span style="font-size:16px;font-weight:800;color:#e8eaf0;letter-spacing:-0.02em;">Margin Pilot</span>
        </div>
        <h2 style="font-size:1.25rem;font-weight:700;color:#e8eaf0;margin:0 0 12px;">Verify your email address</h2>
        <p style="color:#6b7a99;font-size:0.9rem;line-height:1.7;margin:0 0 24px;">Hi ${firstName}, click the button below to verify your email and finish setting up your account.</p>
        <a href="${link}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:0.9rem;">Verify Email Address</a>
        <p style="color:#6b7a99;font-size:0.78rem;margin:24px 0 0;line-height:1.6;">This link expires in 24 hours. If you didn't create a Margin Pilot account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendReply, verifyConnection, sendVerificationEmail };
