# Vendly WhatsApp Meta Template Copy

Use this copy when submitting/updating Meta-approved templates for Vendly order notifications.

## 1) Seller — New Order (`seller_new_order_action_v5`)

👋 Hey {{seller_name}},

🛍 *NEW ORDER RECEIVED*

*Order ID:* {{order_id}}

*ORDER SUMMARY*
{{order_items}}

*CUSTOMER DETAILS*
• Name: {{buyer_name}}
• Phone: {{customer_phone}}
• Location: {{customer_location}}

*TOTAL*
{{total}}

Please *Accept* or *Decline* this order below.

---

## 2) Buyer — Order Received (`buyer_order_received_v1`)

👋 Hey {{buyer_name}},

✅ {{store_name}} has received your order!

Your order is being prepared.

📦 A rider will contact you shortly to:
• Confirm delivery
• Share the next update

Need help?
Message us here 👇
{{seller_whatsapp_link}}

---

## 3) Buyer — Order Accepted (`buyer_order_ready_v1`)

🎉 Good news {{buyer_name}}!

Your order from {{store_name}} has been *ACCEPTED* ✅

📦 Delivery is now being arranged.

The rider will contact you shortly with:
• Delivery timing
• Final coordination details

Thank you for shopping with us!

---

## 4) Buyer — Order Declined (`buyer_order_declined_v1`)

Hi {{buyer_name}},

Unfortunately, your order from {{store_name}} could not be fulfilled at this time.

This may be due to:
• Item being out of stock
• Delivery limitations

You can message the store directly here 👇
{{seller_whatsapp_link}}

We apologize for the inconvenience.

---

## 5) Buyer — Out for Delivery (`buyer_out_for_delivery_v1`)

🚚 Your order is on the way!

Hi {{buyer_name}},

Your order from {{store_name}} is now out for delivery.

Please keep your phone available 📱

The rider will contact you shortly.

---

## Variable mapping used in code

- `{{order_id}}` -> `order.orderNumber`
- `{{order_items}}` -> formatted from `order.items` (quantity + product name)
- `{{total}}` -> `order.totalAmount`
- `{{buyer_name}}` -> `order.customerName`
- `{{store_name}}` -> `order.store?.name || "the store"`
- `{{customer_phone}}` -> `order.customerPhone`
- `{{customer_location}}` -> `order.deliveryAddress`

Notes:
- Payment link is intentionally removed.
- Delivery completion flow marks order as both completed and paid in backend logic.
