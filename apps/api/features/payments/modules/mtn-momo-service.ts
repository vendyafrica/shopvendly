import crypto from "crypto";
import { z } from "zod";

const mtnEnvSchema = z.enum(["sandbox", "production"]);

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type FetchResponseLike = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (typeof v !== "object" || v === null) return null;
  return v as Record<string, unknown>;
}

function getStringField(v: unknown, key: string): string | undefined {
  const r = asRecord(v);
  const value = r ? r[key] : undefined;
  return typeof value === "string" ? value : undefined;
}

function getNumberField(v: unknown, key: string): number | undefined {
  const r = asRecord(v);
  const value = r ? r[key] : undefined;
  return typeof value === "number" ? value : undefined;
}

function pickErrorMessage(json: unknown, fallback: string): string {
  return (
    getStringField(json, "message") ||
    getStringField(json, "error") ||
    getStringField(json, "code") ||
    fallback
  );
}

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
});

function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function getBaseUrl(): string {
  const explicit = process.env.MTN_MOMO_BASE_URL;
  if (explicit) return explicit;

  const target = mtnEnvSchema.parse(process.env.MTN_MOMO_TARGET_ENV || "sandbox");
  return target === "sandbox" ? "https://sandbox.momodeveloper.mtn.com" : "https://proxy.momoapi.mtn.com";
}

function getTargetEnvironmentHeader(): string {
  return mtnEnvSchema.parse(process.env.MTN_MOMO_TARGET_ENV || "sandbox");
}

type TokenCache = {
  accessToken: string;
  expiresAtMs: number;
};

let tokenCache: TokenCache | null = null;

export const requestToPayInputSchema = z.object({
  amount: z.string().min(1),
  currency: z.string().min(1),
  externalId: z.string().min(1),
  payerMsisdn: z.string().min(1),
  payerMessage: z.string().optional(),
  payeeNote: z.string().optional(),
  callbackUrl: z.string().url().optional(),
  referenceId: z.string().uuid().optional(),
});

export type RequestToPayInput = z.infer<typeof requestToPayInputSchema>;

export type RequestToPayResult = {
  referenceId: string;
};

export type RequestToPayStatus = {
  amount: string;
  currency: string;
  financialTransactionId?: string;
  externalId: string;
  payer?: { partyIdType?: string; partyId?: string };
  status: "PENDING" | "SUCCESSFUL" | "FAILED" | string;
  reason?: unknown;
};

const requestToPayStatusSchema = z.object({
  amount: z.string().optional(),
  currency: z.string().optional(),
  financialTransactionId: z.string().optional(),
  externalId: z.string().optional(),
  payer: z
    .object({
      partyIdType: z.string().optional(),
      partyId: z.string().optional(),
    })
    .optional(),
  status: z.string().min(1),
  reason: z.unknown().optional(),
});

async function fetchJson(
  url: string,
  init: RequestInit
): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  const res = (await fetch(url, init)) as FetchResponseLike;
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? (JSON.parse(text) as JsonValue) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, text };
}

/**
 * Gets and caches an MTN MoMo collection access token.
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && now < tokenCache.expiresAtMs) {
    return tokenCache.accessToken;
  }

  const subscriptionKey = getRequiredEnv("MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY");
  const apiUser = getRequiredEnv("MTN_MOMO_COLLECTION_API_USER");
  const apiKey = getRequiredEnv("MTN_MOMO_COLLECTION_API_KEY");

  const auth = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");

  const baseUrl = getBaseUrl();
  const { ok, status, json, text } = await fetchJson(`${baseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
    },
  });

  if (!ok) {
    throw new Error(
      `MTN MoMo token request failed (${status}): ${pickErrorMessage(json, text || "Unknown error")}`
    );
  }

  const parsed = tokenResponseSchema.safeParse(json);
  if (!parsed.success) {
    const accessTokenMaybe = getStringField(json, "access_token");
    const expiresInMaybe = getNumberField(json, "expires_in");
    if (!accessTokenMaybe || !expiresInMaybe) {
      throw new Error("MTN MoMo token response missing access_token/expires_in");
    }
  }

  const accessToken = parsed.success ? parsed.data.access_token : (getStringField(json, "access_token") as string);
  const expiresIn = parsed.success ? parsed.data.expires_in : (getNumberField(json, "expires_in") as number);

  tokenCache = {
    accessToken,
    expiresAtMs: Date.now() + expiresIn * 1000 - 60_000,
  };

  return accessToken;
}

export const mtnMomoCollections = {
  getBaseUrl,
  getTargetEnvironmentHeader,

  async requestToPay(input: RequestToPayInput): Promise<RequestToPayResult> {
    const parsed = requestToPayInputSchema.parse(input);
    const referenceId = parsed.referenceId || crypto.randomUUID();

    const accessToken = await getAccessToken();
    const targetEnvironment = getTargetEnvironmentHeader();
    const subscriptionKey = getRequiredEnv("MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY");

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": targetEnvironment,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Content-Type": "application/json",
    };

    if (parsed.callbackUrl) {
      headers["X-Callback-Url"] = parsed.callbackUrl;
    }

    const { ok, status, json, text } = await fetchJson(`${getBaseUrl()}/collection/v1_0/requesttopay`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        amount: parsed.amount,
        currency: parsed.currency,
        externalId: parsed.externalId,
        payer: {
          partyIdType: "MSISDN",
          partyId: parsed.payerMsisdn,
        },
        payerMessage: parsed.payerMessage || "",
        payeeNote: parsed.payeeNote || "",
      }),
    });

    if (!ok) {
      throw new Error(
        `MTN MoMo request-to-pay failed (${status}): ${pickErrorMessage(json, text || "Unknown error")}`
      );
    }

    return { referenceId };
  },

  async getRequestToPayStatus(referenceId: string): Promise<RequestToPayStatus> {
    if (!referenceId) throw new Error("Missing referenceId");

    const accessToken = await getAccessToken();
    const targetEnvironment = getTargetEnvironmentHeader();
    const subscriptionKey = getRequiredEnv("MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY");

    const { ok, status, json, text } = await fetchJson(
      `${getBaseUrl()}/collection/v1_0/requesttopay/${encodeURIComponent(referenceId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Target-Environment": targetEnvironment,
          "Ocp-Apim-Subscription-Key": subscriptionKey,
        },
      }
    );

    if (!ok) {
      throw new Error(
        `MTN MoMo request-to-pay status failed (${status}): ${pickErrorMessage(json, text || "Unknown error")}`
      );
    }

    const parsed = requestToPayStatusSchema.safeParse(json);
    if (parsed.success) {
      return {
        amount: parsed.data.amount || "",
        currency: parsed.data.currency || "",
        financialTransactionId: parsed.data.financialTransactionId,
        externalId: parsed.data.externalId || referenceId,
        payer: parsed.data.payer,
        status: parsed.data.status,
        reason: parsed.data.reason,
      };
    }

    const jsonRecord = asRecord(json);
    const payerRecord = asRecord(jsonRecord?.payer);
    return {
      amount: getStringField(json, "amount") || "",
      currency: getStringField(json, "currency") || "",
      financialTransactionId: getStringField(json, "financialTransactionId"),
      externalId: getStringField(json, "externalId") || referenceId,
      payer: payerRecord
        ? {
            partyIdType: typeof payerRecord.partyIdType === "string" ? payerRecord.partyIdType : undefined,
            partyId: typeof payerRecord.partyId === "string" ? payerRecord.partyId : undefined,
          }
        : undefined,
      status: getStringField(json, "status") || "PENDING",
      reason: jsonRecord?.reason,
    };
  },

  async validateAccountHolderMsisdn(msisdn: string): Promise<boolean> {
    if (!msisdn) return false;

    const accessToken = await getAccessToken();
    const targetEnvironment = getTargetEnvironmentHeader();
    const subscriptionKey = getRequiredEnv("MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY");

    const { ok, status, json, text } = await fetchJson(
      `${getBaseUrl()}/collection/v1_0/accountholder/msisdn/${encodeURIComponent(msisdn)}/active`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Target-Environment": targetEnvironment,
          "Ocp-Apim-Subscription-Key": subscriptionKey,
        },
      }
    );

    if (ok) return true;
    if (status === 404) return false;

    throw new Error(
      `MTN MoMo account validation failed (${status}): ${pickErrorMessage(json, text || "Unknown error")}`
    );
  },
};
