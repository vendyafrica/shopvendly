# Sents Holdings Strategy

## Company Structure

**Sents Holdings** is the parent company building two connected products to create a Rakuten-style ecosystem for African brands.

- **Vendly** — a shopping marketplace where African brands sell and customers discover, browse, and buy (ecommerce infrastructure)
- **Coinz** — a shared rewards and loyalty layer where customers earn and redeem points across all participating brands in the network

Together: Vendly powers the commerce, Coinz powers the retention.

## Core Idea

Customers shop across brands on Vendly and earn one universal reward currency (Coinz) that works across every partner — not trapped inside a single store.

**One-line:** Shop across brands, earn once, redeem anywhere in the network.

## 6-Step Roadmap

1. **Foundation** — company + product structure (Sents Holdings, Vendly, Coinz)
2. **Category focus** — fashion-first marketplace entry
3. **Merchant network formation** — first wave of partner brands joins Vendly + Coinz
4. **Consumer habit loop** — discover, shop, earn, redeem across brands
5. **Network expansion** — more brands, more reward partners, deeper engagement
6. **Scale and defensibility** — network effects compound, switching costs increase

## Coinz Economics

### Internal Value (Hidden from Customers)

- Internal clearing value: `10 Coinz = KES 1`
- Customers see only Coinz balances and reward prices, never currency conversion
- Higher Coinz numbers are psychologically better (small purchase earns 20–200 Coinz, good purchase earns 200–1,000)

### Point Classes

- **Standard Coinz** — main earned currency, broader redemption, longer expiry
- **Bonus Coinz** — promotional, shorter expiry, used first

### How Coinz Are Earned

- Customer shows personal QR code
- Merchant scans QR to identify customer
- Verified transaction triggers issuance based on active campaign rules
- Earn formula: `Coinz issued = (transaction amount × reward rate) / Coinz base value`

### Distribution Sources

- **Merchant-funded** — the main source; merchants create campaigns and fund rewards budgets
- **Platform-funded** — welcome bonuses, referral bonuses, seasonal boosts
- **Partner-funded** — sponsored campaigns from brands in the rewards marketplace

### Base Earn vs Campaign Earn

- **Base earn** — every participating merchant can issue standard Coinz from normal spend (not only campaigns)
- **Campaign earn** — merchants add promotional boosts on top (double Coinz weekend, product-specific bonuses, etc.)

## Campaign Funding

### Recommended Launch Model: Prepaid Budget

- Merchant deposits money first
- System converts budget into maximum Coinz liability
- Coinz are issued only when qualifying actions happen
- Campaign pauses automatically when budget is exhausted

### Campaign Definition

Each campaign specifies: goal, earn rule, budget, limits (per transaction/day/customer/total), duration, eligibility

## Redemption

### Rewards Marketplace

Customers redeem Coinz for: gift cards, discount coupons, free meals/drinks, fashion vouchers, partner experiences

### Redemption Flow

1. Customer opens rewards marketplace
2. Selects a reward
3. System burns required Coinz
4. System issues redeemable asset (voucher code, claim QR, coupon pass)
5. Merchant or partner validates and fulfills

### Future: Direct Merchant Checkout Redemption

Customers use Coinz directly at partner merchants to reduce price or unlock rewards.

## Cross-Brand Redemption (Clearing House Model)

This is the core economic engine.

- **Issuing merchant** funds the liability at earn time
- **Platform** holds funded value as central network liability
- **Redeeming merchant** fulfills the reward
- **Platform** reimburses redeemer from the network pool under predefined settlement rules

### 4 Internal Ledgers

1. **Customer wallet ledger** — Coinz balance per customer
2. **Issuer ledger** — Coinz issued per merchant + funded value
3. **Redeemer ledger** — Coinz redeemed per merchant/reward provider
4. **Settlement ledger** — reimbursements owed, funding received, payouts completed

### Settlement

- Redeeming merchants are reimbursed at agreed rates (fulfillment cost, not necessarily face value)
- Settlement happens on a regular cycle (daily/weekly/monthly)
- Reward face value ≠ fulfillment cost — the spread is a margin opportunity

## Platform Revenue

- **Issuance fees** — charge on merchant-funded Coinz issuance
- **Redemption spread** — difference between perceived reward value and actual fulfillment cost
- **Float / treasury** — prepaid balances held before redemption
- **Breakage** — Coinz that expire or go unredeemed
- **SaaS / participation fees** — merchant network membership

## Vendly + Coinz Flywheel

More brands → more places to earn → more reasons to redeem → more repeat shopping → more brands join

## USP

### For Brands

Join Vendly and become part of a shared rewards network that brings shoppers back across partner brands, not just your own store.

### For Shoppers

Shop your favorite brands in one place and earn rewards you can use across the brands you love.

## Sales Pitch Structure (Per Brand)

- **Slide 1** — their retention problem
- **Slide 2** — Coinz as the shared rewards solution
- **Slide 3** — how it works for their specific business
- **Slide 4** — pilot proposal with measurable outcomes

## Reference Models

- **Rakuten Points (Japan)** — simple 1:1 value, regular vs time-limited points, rank system, broad ecosystem, partner exchanges
- **Nectar (UK)** — coalition loyalty, cross-partner earn/redeem, data-driven personalization

## Two Merchant Roles

- **Issuer merchants** — fund Coinz earning (hotels, airlines, luxury retail, supermarkets)
- **Redeemer merchants** — fulfill rewards (restaurants, cafés, spas, experiences)
- Some merchants will be both — that is ideal long-term

## Anti-Abuse Rules

- Verified transaction required (scan alone does not create Coinz)
- One reward per receipt/order
- Daily earn caps + campaign budget caps
- Duplicate-scan prevention
- Manual review flags for suspicious activity
