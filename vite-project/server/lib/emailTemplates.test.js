import test from "node:test";
import assert from "node:assert/strict";
import { buyerMessageEmail, sellerReplyEmail } from "./emailTemplates.js";

test("seller reply email carries the reply text and a link", () => {
  const mail = sellerReplyEmail({
    storeName: "Ada Gadgets", productName: "Aurora Watch", body: "Yes, it is in stock.\nI can deliver tomorrow.",
    link: "https://shop.example/messages/abc",
  });
  assert.match(mail.subject, /Ada Gadgets replied about "Aurora Watch"/);
  assert.match(mail.text, /Yes, it is in stock\./);
  assert.match(mail.text, /https:\/\/shop\.example\/messages\/abc/);
  assert.match(mail.html, /I can deliver tomorrow\./);
});

test("user text is HTML-escaped and subjects stay on one line", () => {
  const mail = buyerMessageEmail({
    buyerName: "Eve\r\nBcc: evil@x.com", productName: "Phone", body: '<script>alert("x")</script>', link: "https://x/y",
  });
  assert.ok(!/[\r\n]/.test(mail.subject));
  assert.ok(!mail.html.includes("<script>"));
  assert.match(mail.html, /&lt;script&gt;/);
});
