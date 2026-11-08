import { config } from "../config.js";

let transport; // created on first use

async function getTransport() {
  if (transport !== undefined) return transport;
  const { host, port, user, pass } = config.smtp;
  if (!host || !user || !pass) {
    transport = null; // email not configured
    return transport;
  }
  const { default: nodemailer } = await import("nodemailer");
  transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
  return transport;
}

// Returns "sent", "skipped" (no SMTP settings) or "failed". Never throws, so a
// mail problem can't break the chat.
export async function sendMail({ to, subject, text, html }) {
  try {
    const mailer = await getTransport();
    if (!mailer) {
      console.log(`[email skipped - set SMTP_* in .env] to=${to} subject="${subject}"`);
      return "skipped";
    }
    await mailer.sendMail({ from: config.smtp.from, to, subject, text, html });
    return "sent";
  } catch (err) {
    console.error("Email failed:", err.message);
    return "failed";
  }
}
