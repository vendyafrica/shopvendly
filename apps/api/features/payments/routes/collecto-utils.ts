import { Router } from "express";
import type { Router as ExpressRouter } from "express";

export const collectoUtilsRouter: ExpressRouter = Router();

collectoUtilsRouter.post("/internal/collecto/get-my-ip", async (_req, res, next) => {
  try {
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
