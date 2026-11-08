import { Router } from "express";
import { recommendFor } from "../lib/recommendations.js";
import { wrap } from "../lib/errors.js";
import { int } from "../lib/validate.js";

const router = Router();

// Works for guests too (they get retail picks)
router.get(
  "/",
  wrap(async (req, res) => {
    const limit = int(req.query.limit ?? 8, "limit", { min: 1, max: 24 });
    res.json(await recommendFor(req.user, { limit }));
  }),
);

export default router;
