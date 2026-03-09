import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { collectoDirectFetch, getCollectoProxyUrl } from "./collecto-http.js";

export const collectoUtilsRouter: ExpressRouter = Router();

collectoUtilsRouter.post("/internal/collecto/get-my-ip", async (req, res, next) => {
  try {
    const expected = process.env.INTERNAL_API_KEY;
    const provided = req.header("x-internal-api-key");

    if (!expected || !provided || provided !== expected) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.info("[CollectoUtils] get-my-ip:request", {
      hasFixieUrl: Boolean(getCollectoProxyUrl()),
    });

    const response = await collectoDirectFetch("https://collecto.cissytech.com/get-my-ip", {});

    console.info("[CollectoUtils] get-my-ip:response", {
      hasFixieUrl: Boolean(getCollectoProxyUrl()),
      status: response.status,
      ok: response.ok,
      body: response.json,
    });

    return res.status(response.status).json({
      ok: response.ok,
      status: response.status,
      data: response.json,
    });
  } catch (err) {
    next(err);
  }
});
