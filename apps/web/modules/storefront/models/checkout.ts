export type CheckoutPaymentMethod = "mobile_money";

export type PaymentFlowStatus =
  | "idle"
  | "initiating"
  | "pending"
  | "awaiting_confirmation"
  | "successful"
  | "failed";

export type PhoneVerificationStatus = "idle" | "verifying" | "verified" | "failed";

export interface CheckoutState {
    orderId: string;
    transactionId: string;
    reference: string | null;
    storeSlug: string;
    timestamp: number;
}
