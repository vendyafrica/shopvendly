const API_URL = process.env.DGATEWAY_API_URL || "https://dgatewayapi.desispay.com";
const API_KEY = process.env.DGATEWAY_API_KEY || "";
const API_TIMEOUT_MS = 20000;

export interface CollectParams extends Record<string, unknown> {
  amount: number;
  currency: string;
  phone_number: string;
  provider?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

type DGatewayResponse = {
  data?: {
    reference?: string;
    provider?: string;
    status?: string;
    amount?: number;
    currency?: string;
  };
  error?: {
    code?: string;
    message?: string;
    status?: number;
  };
};

async function postDGateway(path: string, body: Record<string, unknown>): Promise<DGatewayResponse> {
  if (!API_KEY) {
    return {
      error: {
        code: "AUTHENTICATION_ERROR",
        message: "DGateway is not configured (DGATEWAY_API_KEY missing)",
      },
    };
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": API_KEY,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "TimeoutError";
    return {
      error: {
        code: isTimeout ? "UPSTREAM_TIMEOUT" : "NETWORK_ERROR",
        message: isTimeout
          ? "Payment provider request timed out. Please try again."
          : "Payment provider is unreachable. Please try again.",
        status: isTimeout ? 504 : 502,
      },
    };
  }

  const json = (await res.json().catch(() => ({
    error: {
      code: "PROVIDER_ERROR",
      message: "Invalid response from DGateway",
    },
  }))) as DGatewayResponse;

  if (!res.ok && json.error) {
    return {
      ...json,
      error: {
        ...json.error,
        status: json.error.status ?? res.status,
      },
    };
  }

  if (!res.ok && !json.error) {
    return {
      error: {
        code: "PROVIDER_ERROR",
        message: "Failed to process payment request",
        status: res.status,
      },
    };
  }

  return json;
}

export async function collectPayment(params: CollectParams) {
  return postDGateway("/v1/payments/collect", params);
}

export async function verifyTransaction(reference: string) {
  return postDGateway("/v1/webhooks/verify", { reference });
}
