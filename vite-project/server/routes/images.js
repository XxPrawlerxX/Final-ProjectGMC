import { Router } from "express";
import mongoose from "mongoose";
import { Image } from "../models/Image.js";
import { HttpError, wrap } from "../lib/errors.js";

const router = Router();

router.get(
  "/:id",
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, "Not found.");
    const image = await Image.findById(req.params.id).select("data contentType");
    if (!image) throw new HttpError(404, "Not found.");

    res.set({
      "Content-Type": image.contentType,
      // A picture's id never changes content, so browsers can keep it for a year
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      // helmet blocks cross-origin use by default; pictures must load on the website's domain
      "Cross-Origin-Resource-Policy": "cross-origin",
    });
    res.send(Buffer.from(image.data));
  }),
);

export default router;
