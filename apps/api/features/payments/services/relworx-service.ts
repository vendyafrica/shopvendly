import { randomUUID } from "crypto";

const RELWORX_API_URL = process.env.RELWORX_API_URL || "https://payments.relworx.com/api";
const RELWORX_API_KEY = process.env.RELWORX_API_KEY ;
const RELWORX_ACCOUNT_NO = process.env.RELWORX_ACCOUNT_NO || "";

type RelworxBaseResponse = {
    success?: boolean;
    message?: string;
    error_code?: string;
};

export class RelworxApiError extends Error {
    readonly statusCode: number;
    readonly providerCode?: string;

    constructor(message: string, statusCode = 502, providerCode?: string) {
        super(message);
        this.name = "RelworxApiError";
        this.statusCode = statusCode;
        this.providerCode = providerCode;
    }
}

function mapProviderCodeToStatus(code?: string, fallback = 502) {
    switch (code) {
        case "API_DISABLED":
        case "ACCOUNT_DISABLED":
            return 403;
        case "UNAUTHORIZED":
        case "INVALID_TOKEN":
            return 401;
        case "NOT_FOUND":
            return 404;
        case "INVALID_PARAMETERS":
        case "VALIDATION_FAILED":
            return 422;
        case "SERVICE_UNAVAILABLE":
            return 503;
        default:
            return fallback;
    }
}

async function parseRelworxResponse<T>(response: Response): Promise<{ data: T | null; raw: RelworxBaseResponse | null }> {
    const text = await response.text();
    if (!text) {
        return { data: null, raw: null };
    }

    try {
        const json = JSON.parse(text) as T & RelworxBaseResponse;
        return { data: json as T, raw: json };
    } catch (err) {
        console.error("[Relworx] Failed to parse response", err, text);
        return { data: null, raw: null };
    }
}

function ensureRelworxSuccess(response: Response, payload: RelworxBaseResponse | null, fallbackMessage: string) {
    if (response.ok && payload?.success !== false) {
        return;
    }

    const statusCode = response.ok ? mapProviderCodeToStatus(payload?.error_code) : response.status;
    const message = payload?.message || fallbackMessage;
    throw new RelworxApiError(message, statusCode, payload?.error_code);
}

function relworxHeaders() {
    return {
        "Content-Type": "application/json",
        Accept: "application/vnd.relworx.v2",
        Authorization: `Bearer ${RELWORX_API_KEY}`,
    };
}

export type RelworxRequestPaymentParams = {
    msisdn: string;
    amount: number;
    currency: string;
    reference: string;
    description?: string;
};

export type RelworxSendPaymentParams = {
    msisdn: string;
    amount: number;
    currency: string;
    reference: string;
    description?: string;
};

export type RelworxPaymentResponse = {
    success: boolean;
    message: string;
    internal_reference: string;
};

export type RelworxStatusResponse = {
    success: boolean;
    status: string;
    message: string;
    customer_reference: string;
    internal_reference: string;
    msisdn: string;
    amount: number;
    currency: string;
    provider: string;
    charge?: number;
    request_status: string;
    completed_at?: string;
};

export type RelworxTransaction = {
    customer_reference: string;
    provider: string;
    msisdn: string;
    transaction_type: string;
    currency: string;
    amount: number;
    status: string;
    created_at: string;
};

/**
 * Request payment from a customer's mobile money account into Vendly's Relworx account.
 */
export async function requestPaymentFromCustomer(params: RelworxRequestPaymentParams): Promise<RelworxPaymentResponse> {
    const response = await fetch(`${RELWORX_API_URL}/mobile-money/request-payment`, {
        method: "POST",
        headers: relworxHeaders(),
        body: JSON.stringify({
            account_no: RELWORX_ACCOUNT_NO,
            reference: params.reference,
            msisdn: params.msisdn,
            currency: params.currency,
            amount: params.amount,
            description: params.description || "Payment to ShopVendly",
        }),
    });
    const { data, raw } = await parseRelworxResponse<RelworxPaymentResponse>(response);
    ensureRelworxSuccess(response, raw, `Relworx request-payment failed (${response.status})`);
    return data as RelworxPaymentResponse;
}

/**
 * Send payment from Vendly's account to a merchant's mobile money number.
 */
export async function sendPaymentToMerchant(params: RelworxSendPaymentParams): Promise<RelworxPaymentResponse> {
    const response = await fetch(`${RELWORX_API_URL}/mobile-money/send-payment`, {
        method: "POST",
        headers: relworxHeaders(),
        body: JSON.stringify({
            account_no: RELWORX_ACCOUNT_NO,
            reference: params.reference,
            msisdn: params.msisdn,
            currency: params.currency,
            amount: params.amount,
            description: params.description || "Merchant payout from ShopVendly",
        }),
    });

    const { data, raw } = await parseRelworxResponse<RelworxPaymentResponse>(response);
    ensureRelworxSuccess(response, raw, `Relworx send-payment failed (${response.status})`);
    return data as RelworxPaymentResponse;
}

/**
 * Check the status of a Relworx transaction.
 */
export async function checkPaymentStatus(internalReference: string): Promise<RelworxStatusResponse> {
    const url = new URL(`${RELWORX_API_URL}/mobile-money/check-request-status`);
    url.searchParams.set("internal_reference", internalReference);
    url.searchParams.set("account_no", RELWORX_ACCOUNT_NO);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: relworxHeaders(),
    });

    const { data, raw } = await parseRelworxResponse<RelworxStatusResponse>(response);
    ensureRelworxSuccess(response, raw, `Relworx check-status failed (${response.status})`);
    return data as RelworxStatusResponse;
}

/**
 * Fetch all transactions for Vendly's Relworx account (last 30 days, max 1000).
 */
export async function getTransactions(): Promise<RelworxTransaction[]> {
    const url = new URL(`${RELWORX_API_URL}/payment-requests/transactions`);
    url.searchParams.set("account_no", RELWORX_ACCOUNT_NO);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: relworxHeaders(),
    });

    const { data, raw } = await parseRelworxResponse<{ success: boolean; transactions: RelworxTransaction[] }>(response);
    ensureRelworxSuccess(response, raw, `Relworx get-transactions failed (${response.status})`);
    return (data?.transactions || []) as RelworxTransaction[];
}

/**
 * Generate a unique reference for a Relworx request (min 8, max 36 chars).
 */
export function generateRelworxReference(prefix = ""): string {
    const id = randomUUID().replace(/-/g, "").slice(0, 28);
    return `${prefix}${id}`.slice(0, 36);
}
