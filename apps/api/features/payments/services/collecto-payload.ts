export type CollectoPayload = Record<string, unknown>;

export function getCollectoPayloadRecord(payload: CollectoPayload) {
  const nested = payload.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as CollectoPayload;
  }

  return null;
}

function readStringCandidate(payload: CollectoPayload, keys: string[]) {
  const nested = getCollectoPayloadRecord(payload);
  const candidates = [
    ...(nested ? keys.map((key) => nested[key]) : []),
    ...keys.map((key) => payload[key]),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return String(candidate);
    }
  }

  return null;
}

export function readCollectoMessage(payload: CollectoPayload) {
  return readStringCandidate(payload, ["message", "status_message", "responseMessage", "description"]);
}

export function readCollectoStatus(payload: CollectoPayload): unknown {
  const nested = getCollectoPayloadRecord(payload);

  return (
    nested?.status ??
    nested?.paymentStatus ??
    nested?.transactionStatus ??
    nested?.state ??
    payload.status ??
    payload.paymentStatus ??
    payload.transactionStatus ??
    payload.state ??
    nested?.message ??
    payload.message
  );
}

export function readCollectoName(payload: CollectoPayload) {
  return readStringCandidate(payload, ["name", "registeredName", "accountName", "customerName", "fullName"]);
}

export function readCollectoReference(payload: CollectoPayload) {
  return readStringCandidate(payload, ["reference"]);
}

export function readCollectoTransactionId(payload: CollectoPayload) {
  return readStringCandidate(payload, ["transactionId", "transactionID", "transaction_id", "id"]);
}

export function readCollectoBooleanFlag(payload: CollectoPayload, keys: string[]) {
  const nested = getCollectoPayloadRecord(payload);
  const candidates = [
    ...(nested ? keys.map((key) => nested[key]) : []),
    ...keys.map((key) => payload[key]),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "boolean") {
      return candidate;
    }
  }

  return null;
}

export function normalizeCollectoBusinessStatus(value: unknown): "pending" | "successful" | "failed" {
  if (typeof value !== "string") return "pending";
  const normalized = value.trim().toLowerCase();
  if (["success", "successful", "completed", "paid"].includes(normalized)) return "successful";
  if (
    normalized.includes("success") ||
    normalized.includes("successful") ||
    normalized.includes("complete") ||
    normalized.includes("completed") ||
    normalized.includes("paid")
  ) {
    return "successful";
  }
  if (
    ["failed", "error", "cancelled", "canceled", "rejected", "declined", "decline", "denied", "deny", "expired"].includes(
      normalized,
    )
  ) {
    return "failed";
  }
  if (
    normalized.includes("declin") ||
    normalized.includes("reject") ||
    normalized.includes("cancel") ||
    normalized.includes("deni") ||
    normalized.includes("invalid") ||
    normalized.includes("insufficient") ||
    normalized.includes("not enough") ||
    normalized.includes("not found") ||
    normalized.includes("inactive") ||
    normalized.includes("deleted") ||
    normalized.includes("mismatch") ||
    normalized.includes("could not verify") ||
    normalized.includes("couldnot verify") ||
    normalized.includes("unavailable")
  ) {
    return "failed";
  }
  return "pending";
}

export function isCollectoFailureMessage(message: string | null) {
  if (!message) {
    return false;
  }

  const normalized = message.trim().toLowerCase();
  return (
    normalized.includes("failed") ||
    normalized.includes("error") ||
    normalized.includes("declin") ||
    normalized.includes("reject") ||
    normalized.includes("cancel") ||
    normalized.includes("deni") ||
    normalized.includes("invalid") ||
    normalized.includes("unrecognized") ||
    normalized.includes("unrecogonized") ||
    normalized.includes("insufficient") ||
    normalized.includes("not enough") ||
    normalized.includes("user cancelled") ||
    normalized.includes("user canceled") ||
    normalized.includes("user rejected") ||
    normalized.includes("not found") ||
    normalized.includes("not registered") ||
    normalized.includes("unavailable") ||
    normalized.includes("inactive") ||
    normalized.includes("deleted") ||
    normalized.includes("mismatch") ||
    normalized.includes("could not verify") ||
    normalized.includes("couldnot verify")
  );
}
