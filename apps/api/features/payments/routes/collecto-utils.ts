import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { buildCollectoUtilityUrl, collectoDirectFetch } from "./collecto-http.js";

export const collectoUtilsRouter: ExpressRouter = Router();

collectoUtilsRouter.post("/internal/collecto/get-my-ip", async (req, res, next) => {
  try {
    const expected = process.env.INTERNAL_API_KEY;
    const provided = req.header("x-internal-api-key");

    if (!expected || !provided || provided !== expected) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const response = await collectoDirectFetch(buildCollectoUtilityUrl("get-my-ip"), {});

    return res.status(response.status).json({
      ok: response.ok,
      status: response.status,
      data: response.json,
    });
  } catch (err) {
    next(err);
  }
});
