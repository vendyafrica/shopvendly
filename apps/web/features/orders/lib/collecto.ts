 import { z } from "zod";

const collectoPaymentModeSchema = z.enum(["disabled", "mock", "live"]);

export const collectoInitiateBodySchema = z.object({
  orderId: z.string().min(1),
  phone: z.string().min(1),
  amount: z.number().positive(),
  reference: z.string().min(1),
});

export const collectoStatusBodySchema = z.object({
  transactionId: z.string().min(1),
});

export type CollectoInitiateBody = z.infer<typeof collectoInitiateBodySchema>;
export type CollectoStatusBody = z.infer<typeof collectoStatusBodySchema>;

export type CollectoRequestToPayResponse = {
  ok: boolean;
  mode: "mock" | "live";
  transactionId: string;
  message?: string;
  raw?: unknown;
};

export type CollectoPaymentStatus = "pending" | "successful" | "failed";

export type CollectoStatusResponse = {
  ok: boolean;
  mode: "mock" | "live";
  transactionId: string;
  status: CollectoPaymentStatus;
  message?: string;
  raw?: unknown;
};

function normalizeEnvMode(value: string | undefined): "disabled" | "mock" | "live" {
  const parsed = collectoPaymentModeSchema.safeParse((value || "mock").toLowerCase());
  return parsed.success ? parsed.data : "mock";
}

export function getCollectoMode(): "disabled" | "mock" | "live" {
  return normalizeEnvMode(process.env.COLLECTO_PAYMENT_MODE);
}

export function isCollectoConfiguredForLive(): boolean {
  return Boolean(
    process.env.COLLECTO_USERNAME &&
      process.env.COLLECTO_API_KEY
  );
}

export function getCollectoBaseUrl() {
  return (process.env.COLLECTO_BASE_URL || "https://collecto.cissytech.com/api").replace(/\/$/, "");
}

export function getCollectoUsername() {
  return process.env.COLLECTO_USERNAME || "";
}

export function getCollectoHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": process.env.COLLECTO_API_KEY || "",
  };
}

export function normalizeCollectoPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("256")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `256${digits.slice(1)}`;
  return digits;
}

export function normalizeCollectoStatus(value: unknown): CollectoPaymentStatus {
  if (typeof value !== "string") return "pending";
  const normalized = value.trim().toLowerCase();
  if (["success", "successful", "completed", "paid"].includes(normalized)) return "successful";
  if (["failed", "error", "cancelled", "canceled", "rejected"].includes(normalized)) return "failed";
  return "pending";
}

export async function collectoFetch(method: string, body: unknown) {
  const username = getCollectoUsername();
  if (!username) {
    throw new Error("Missing COLLECTO_USERNAME");
  }

  const response = await fetch(`${getCollectoBaseUrl()}/${username}/${method}`, {
    method: "POST",
    headers: getCollectoHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text || null;
  }

  return {
    ok: response.ok,
    status: response.status,
    json,
    text,
  };
}

export function buildMockTransactionId(orderId: string) {
  return `collecto_mock_${orderId}_${Date.now()}`;
}

export function getMockStatus(transactionId: string): CollectoPaymentStatus {
  if (transactionId.includes("failed")) return "failed";
  if (transactionId.includes("paid") || transactionId.includes("success")) return "successful";
  return "pending";
}
