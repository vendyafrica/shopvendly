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

export interface CheckoutBuyNowSelectedOption {
  name: string;
  value: string;
}

export interface CheckoutBuyNowItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    currency: string;
    image?: string | null;
    slug: string;
    selectedOptions: CheckoutBuyNowSelectedOption[];
  };
  store: {
    id: string;
    name: string;
    slug: string;
  };
}
