# Collecto API — Implementation Reference
> For Windsurf agents. Read this fully before implementing any payment flow.

---

## ⚠️ Critical Architecture Note — Read First

Collecto has **two separate products** that must be used together to avoid fees:

| Product | System | What It Does |
|---|---|---|
| **Collecto Wallet** | `collecto.cissytech.com` | Collects money FROM customers via mobile money |
| **Bulk Account** | `bulk.cissytech.com` | Pays OUT money TO sellers — MTN, Airtel, Stanbic, FlexiPay |

### The Fee Problem
Withdrawing from your Collecto Wallet directly to mobile money costs **UGX 5,000 per transaction**. At any volume, this destroys margins.

### The Correct Flow (Zero Payout Fees)
```
Customer pays → Collecto Wallet → Transfer to Bulk Account → Payout to Seller (FREE)
```

**Never** payout directly from the Wallet. Always route through Bulk first.

---

## Base URL & Auth

```
Base URL:  https://collecto.cissytech.com/api/{username}/{method}
Auth:      x-api-key: your-x-api-key   (get from Collecto Settings)
Content:   Content-Type: application/json
```

> Get `{username}` and `{x-api-key}` from the Collecto dashboard under Settings.

---

## Full Payment Flow — Collect → Bulk → Payout

### Step 1 — Collect Money from Customer

**`POST /requestToPay`**

Initiates a mobile money payment request to the customer's phone. The customer receives a prompt on their phone to confirm payment.

```json
{
  "paymentOption": "mobilemoney",
  "phone": "256705687760",
  "amount": 85000,
  "reference": "ORDER-001"
}
```

---

### Step 2 — Poll Until Payment Confirmed

**`POST /requestToPayStatus`**

Poll this endpoint until `status` is `SUCCESSFUL` before proceeding. Do not assume payment succeeded.

```json
{
  "transactionId": "PMT12345"
}
```

> Poll every 5–10 seconds. Timeout after 2–3 minutes. Mark order as `payment_pending` until confirmed.

---

### Step 3 — Transfer Wallet Balance to Bulk Account

**`POST /withdrawFromWallet`**

Move collected funds from your Collecto Wallet into your Bulk Account. This is the step that enables free payouts. Do this in batches (e.g. end of day, or once per order batch) to minimise the one-time transfer overhead.

```json
{
  "amount": "500000",
  "reference": "BATCH-2026-03-10",
  "withDrawTo": "mobilemoney"
}
```

> **Note:** `withDrawTo` here means the Bulk system's mobile money gateway, not a personal number. This funds your Bulk Account, not a seller.

---

### Step 3b — Check Wallet Transfer Status

**`POST /withdrawFromWalletStatus`**

```json
{
  "transactionId": "P2134534"
}
```

Confirm the Bulk Account is funded before triggering payouts.

---

### Step 4 — Payout to Seller (FREE via Bulk)

**`POST /initiatePayout`**

Once funds are in the Bulk Account, pay out to any seller. **No per-transaction fee** for MTN, Airtel, or Stanbic Bank payouts via Bulk.

```json
{
  "gateway": "mobilemoney",
  "swiftCode": "",
  "reference": "SELLER-PAYOUT-001",
  "accountName": "Jane Nakato",
  "accountNumber": 256772123456,
  "amount": "72500",
  "message": "Vendly order payout – March 10",
  "phone": 256772123456
}
```

**Supported Gateways:**
| Gateway | Notes |
|---|---|
| `mobilemoney` | MTN and Airtel Uganda only |
| `flexipay` | FlexiPay wallets |
| `stanbicBank` | Stanbic bank accounts |
| `otherBanks` | Other banks — requires `swiftCode` |

---

### Step 5 — Confirm Payout Status

**`POST /payoutStatus`**

```json
{
  "gateway": "mobilemoney",
  "reference": "SELLER-PAYOUT-001"
}
```

Only mark the seller's order as `settled` once this returns `SUCCESSFUL`.

---

## Supporting Endpoints

### Verify a Phone Number Before Charging

**`POST /verifyPhoneNumber`**

Always verify before sending a payment request. Returns the registered name — use this to confirm the right person is paying/receiving.

```json
{
  "phone": "256705687760"
}
```

Supports: MTN Uganda, Airtel Uganda, FlexiPay.

---

### Check Wallet & Bulk Balances

**`POST /currentBalance`**

```json
{
  "type": "Wallet"
}
```

**Available types:** `Wallet`, `CASH`, `BULK`, `SMS`, `AIRTIME`, `EMAILS`, `ADS`

> Check `BULK` balance before triggering payouts. Check `Wallet` balance to know when to transfer to Bulk.

---

### Send SMS Notification to Seller/Buyer

**`POST /sendSingleSMS`**

Use this to notify buyers of order confirmation and sellers of incoming payouts. Requires SMS credit — fund via `/servicePayment`.

```json
{
  "phone": 256705687760,
  "message": "Your Vendly order has been confirmed. We'll notify you when it ships.",
  "reference": 12345
}
```

---

### Fund SMS / Service Credits

**`POST /servicePayment`**

Top up SMS, Airtime, Email, or Ads credits.

```json
{
  "service": "SMS",
  "paymentOption": "mobilemoney",
  "phone": "256705687760",
  "amount": 6000,
  "message": "SMS Top up"
}
```

**Supported services:** `BULK`, `SMS`, `AIRTIME`, `EMAILS`, `ADS`

---

## Complete Endpoint Reference

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/requestToPay` | Request payment from customer |
| POST | `/requestToPayStatus` | Check if customer payment succeeded |
| POST | `/initiatePayout` | Pay out to seller via Bulk (free) |
| POST | `/payoutStatus` | Check payout status |
| POST | `/withdrawFromWallet` | Move Wallet funds → Bulk Account |
| POST | `/withdrawFromWalletStatus` | Check wallet→bulk transfer status |
| POST | `/currentBalance` | Check any account balance |
| POST | `/verifyPhoneNumber` | Validate phone + get registered name |
| POST | `/sendSingleSMS` | Send SMS to buyer or seller |
| POST | `/servicePayment` | Top up SMS/Airtime/Bulk credits |
| POST | `/servicePaymentStatus` | Check service top-up status |

---

## Implementation Rules for Agents

1. **Always verify phone numbers** before initiating any payment or payout.
2. **Always poll status endpoints** — never assume a payment succeeded from the initial response.
3. **Never payout directly from Wallet** — always transfer to Bulk first. The fee is UGX 5,000 per direct withdrawal.
4. **Batch Wallet→Bulk transfers** where possible (e.g. once per hour or end of day) to minimise overhead.
5. **Store all `transactionId` and `reference` values** immediately after initiating any request — you'll need them to poll status.
6. **Handle all three states:** `SUCCESSFUL`, `PENDING`, `FAILED`. Never leave a transaction in unknown state.
7. **Check Bulk balance** before triggering seller payouts. If balance is insufficient, trigger a Wallet→Bulk transfer first.