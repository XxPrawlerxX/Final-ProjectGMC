// Plain functions that build the emails, so they can be tested without sending anything.

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Subjects must be one line (stops header injection) and not absurdly long
const oneLine = (text, max = 120) => String(text).replace(/[\r\n]+/g, " ").trim().slice(0, max);

function layout({ heading, intro, quote, link, footer }) {
  const text = [intro, "", quote.split("\n").map((l) => `> ${l}`).join("\n"), "", `Open the chat: ${link}`, "", footer].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111">
<h2 style="margin:0 0 12px">${escapeHtml(heading)}</h2>
<p>${escapeHtml(intro)}</p>
<blockquote style="margin:16px 0;padding:12px 16px;background:#fff5ec;border-left:4px solid #ff6a00;white-space:pre-wrap">${escapeHtml(quote)}</blockquote>
<p><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 22px;background:#ff6a00;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Reply in Marketfind</a></p>
<p style="color:#667078;font-size:12px">${escapeHtml(footer)}</p></div>`;
  return { text, html };
}

const FOOTER = "You're receiving this because of your Marketfind account. You can turn these emails off under Account > Profile.";

// Seller answered the buyer -> email the buyer
export function sellerReplyEmail({ storeName, productName, body, link }) {
  return {
    subject: oneLine(`${storeName} replied about "${productName}"`),
    ...layout({
      heading: `${storeName} replied`,
      intro: `About: ${productName}`,
      quote: body,
      link,
      footer: FOOTER,
    }),
  };
}

// Buyer wrote to the seller -> email the seller
export function buyerMessageEmail({ buyerName, productName, body, link }) {
  return {
    subject: oneLine(`New message from ${buyerName} about "${productName}"`),
    ...layout({
      heading: `New message from ${buyerName}`,
      intro: `About: ${productName}`,
      quote: body,
      link,
      footer: FOOTER,
    }),
  };
}
