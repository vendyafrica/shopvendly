import type { CollectoPayoutMode } from "@shopvendly/db";

export const COLLECTO_COLLECTION_FEE_RATE = 0.03;
export const COLLECTO_PAYOUT_FEE_UGX = 1200;

export type CollectoStorePaymentSettings = {
  collectoPassTransactionFeeToCustomer: boolean;
  collectoPayoutMode: CollectoPayoutMode;
};

export type CollectoPricingBreakdown = {
  subtotalAmount: number;
  customerFeeAmount: number;
  customerPaidAmount: number;
  merchantReceivableAmount: number;
  passTransactionFeeToCustomer: boolean;
  payoutMode: CollectoPayoutMode;
};

export function normalizeCollectoPayoutMode(value: string | null | undefined): CollectoPayoutMode {
  return value === "manual_batch" ? "manual_batch" : "automatic_per_order";
}

export function calculateCollectoCollectionFee(amount: number) {
  return Math.round(Math.max(amount, 0) * COLLECTO_COLLECTION_FEE_RATE);
}

export function buildCollectoPricingBreakdown(params: {
  subtotalAmount: number;
  settings: CollectoStorePaymentSettings;
}) : CollectoPricingBreakdown {
  const subtotalAmount = Math.max(Math.round(params.subtotalAmount), 0);
  const customerFeeAmount = params.settings.collectoPassTransactionFeeToCustomer
    ? calculateCollectoCollectionFee(subtotalAmount)
    : 0;
  const customerPaidAmount = subtotalAmount + customerFeeAmount;
  const merchantReceivableAmount = Math.max(customerPaidAmount - calculateCollectoCollectionFee(customerPaidAmount), 0);

  return {
    subtotalAmount,
    customerFeeAmount,
    customerPaidAmount,
    merchantReceivableAmount,
    passTransactionFeeToCustomer: params.settings.collectoPassTransactionFeeToCustomer,
    payoutMode: normalizeCollectoPayoutMode(params.settings.collectoPayoutMode),
  };
}
