import test from "node:test";
import assert from "node:assert/strict";
import { detectImageType, imageIdFromPath } from "./imageTypes.js";

const pad = (bytes) => Buffer.concat([Buffer.from(bytes), Buffer.alloc(20)]);

test("recognises real image headers", () => {
  assert.equal(detectImageType(pad([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(detectImageType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBPVP8 "), Buffer.alloc(8)]);
  assert.equal(detectImageType(webp), "image/webp");
});

test("rejects files that only pretend to be images", () => {
  assert.equal(detectImageType(Buffer.from("<svg onload=alert(1)></svg>................")), null);
  assert.equal(detectImageType(Buffer.from("<?php system($_GET['c']); ?>............")), null);
  assert.equal(detectImageType(Buffer.from("GIF89a....................")), null);
  assert.equal(detectImageType(Buffer.alloc(3)), null);
  assert.equal(detectImageType("not a buffer"), null);
});

test("image path parsing", () => {
  assert.equal(imageIdFromPath("/api/images/0123456789abcdef01234567"), "0123456789abcdef01234567");
  assert.equal(imageIdFromPath("https://images.unsplash.com/x.jpg"), null);
  assert.equal(imageIdFromPath("/api/images/../etc/passwd"), null);
});
