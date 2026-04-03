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

module.exports = { sendReply, verifyConnection };
