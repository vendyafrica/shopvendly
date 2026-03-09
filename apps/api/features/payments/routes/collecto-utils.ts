import { Router } from "express";
import type { Router as ExpressRouter } from "express";

export const collectoUtilsRouter: ExpressRouter = Router();

collectoUtilsRouter.post("/internal/collecto/get-my-ip", async (req, res, next) => {
  try {
    const expected = process.env.INTERNAL_API_KEY;
    const provided = req.header("x-internal-api-key");

    if (!expected || !provided || provided !== expected) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const response = await fetch("https://collecto.cissytech.com/get-my-ip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const rawText = await response.text();
    let payload: unknown = null;

    try {
      payload = rawText ? JSON.parse(rawText) : null;
    } catch {
      payload = { raw: rawText };
    }

    return res.status(response.status).json({
      ok: response.ok,
      status: response.status,
      data: payload,
    });
  } catch (err) {
    next(err);
  }
});
