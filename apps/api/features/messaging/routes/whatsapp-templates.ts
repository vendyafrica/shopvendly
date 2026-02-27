import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { TEMPLATE_NAMES } from "../services/whatsapp/template-registry";

export const whatsappTemplatesRouter: ExpressRouter = Router();

// GET /api/internal/whatsapp/templates
// Returns the list of template names used by the system (templates are created via Postman / Meta dashboard).
whatsappTemplatesRouter.get("/internal/whatsapp/templates", (req, res) => {
  const expected = process.env.INTERNAL_API_KEY;
  const provided = req.header("x-internal-api-key");

  if (!expected || !provided || provided !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.json({ ok: true, templates: TEMPLATE_NAMES });
});
