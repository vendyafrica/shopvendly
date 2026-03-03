# WhatsApp Business API Integration Skill

## Overview
This skill provides comprehensive guidance for integrating with the WhatsApp Business Platform, including template creation, webhook setup, and message sending via Cloud API.

## Core Concepts

### Template Types
WhatsApp templates are pre-approved message formats categorized as:
- **Marketing**: Promotional content, brand awareness, sales offers
- **Utility**: Transaction updates, account alerts, non-promotional content
- **Authentication**: One-time passwords and identity verification

### Key Requirements
- Templates must be approved before use
- Messages outside customer service windows require templates
- Maximum 100 templates can be created per WABA per hour
- Template names: max 512 chars, lowercase alphanumeric + underscores

## Creating Templates

### Template Structure
Templates consist of up to 4 components:
1. **Header** (optional): Text, image, video, document, or location
2. **Body** (required): Main message text (max 1024 chars)
3. **Footer** (optional): Additional text (max 60 chars)
4. **Buttons** (optional): Up to 10 interactive buttons

### Parameter Formats

#### Named Parameters
```json
{
  "parameter_format": "named",
  "text": "Hello {{first_name}}, your order {{order_number}} is ready!",
  "example": {
    "body_text_named_params": [
      {"param_name": "first_name", "example": "Pablo"},
      {"param_name": "order_number", "example": "12345"}
    ]
  }
}
```

#### Positional Parameters
```json
{
  "parameter_format": "positional",
  "text": "Hello {{1}}, your order {{2}} is ready!",
  "example": {
    "body_text": [["Pablo", "12345"]]
  }
}
```

### Template Creation Request Pattern

```bash
curl 'https://graph.facebook.com/v23.0/<WABA_ID>/message_templates' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "template_name",
    "language": "en_US",
    "category": "marketing|utility|authentication",
    "parameter_format": "named|positional",
    "components": [
      {
        "type": "header",
        "format": "text|image|video|document|location",
        "text": "Header text {{param}}",
        "example": {...}
      },
      {
        "type": "body",
        "text": "Body text with {{variables}}",
        "example": {...}
      },
      {
        "type": "footer",
        "text": "Footer text"
      },
      {
        "type": "buttons",
        "buttons": [...]
      }
    ]
  }'
```

### Button Types

#### Quick Reply Button
```json
{
  "type": "quick_reply",
  "text": "Button Label"
}
```

#### URL Button
```json
{
  "type": "url",
  "text": "Visit Site",
  "url": "https://example.com/{{1}}",
  "example": ["promo-code"]
}
```

#### Phone Number Button
```json
{
  "type": "phone_number",
  "text": "Call Us",
  "phone_number": "15550051310"
}
```

#### Copy Code Button
```json
{
  "type": "copy_code",
  "example": "PROMO25"
}
```

### Media Headers
For image/video/document headers, use Resumable Upload API first:

```json
{
  "type": "header",
  "format": "image",
  "example": {
    "header_handle": ["4::aW1hZ2UvcG5n:ARYpf5zq..."]
  }
}
```

## Sending Template Messages

### Basic Send Request
```bash
curl 'https://graph.facebook.com/v23.0/<PHONE_NUMBER_ID>/messages' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "+16505551234",
    "type": "template",
    "template": {
      "name": "template_name",
      "language": {"code": "en_US"},
      "components": [...]
    }
  }'
```

### With Named Parameters
```json
{
  "type": "body",
  "parameters": [
    {
      "type": "text",
      "parameter_name": "first_name",
      "text": "Jessica"
    },
    {
      "type": "text",
      "parameter_name": "order_number",
      "text": "67890"
    }
  ]
}
```

### With Positional Parameters
```json
{
  "type": "body",
  "parameters": [
    {"type": "text", "text": "Jessica"},
    {"type": "text", "text": "67890"}
  ]
}
```

### With Media Header
```json
{
  "type": "header",
  "parameters": [
    {
      "type": "image",
      "image": {"id": "1339522734477770"}
    }
  ]
}
```

## Webhooks Setup

### Creating Webhook Endpoint

Your endpoint must:
- Have valid TLS/SSL certificate
- Accept GET requests for verification
- Accept POST requests for webhook events
- Respond with HTTP 200 for valid requests

### GET Request Validation
```javascript
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});
```

### POST Request Validation
```javascript
app.post('/webhook', (req, res) => {
  // Validate signature
  const signature = req.headers['x-hub-signature-256'];
  const hash = crypto
    .createHmac('sha256', APP_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (signature === `sha256=${hash}`) {
    // Process webhook
    console.log(JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
  } else {
    res.sendStatus(403);
  }
});
```

### Important Webhook Fields
- `messages`: Incoming/outgoing message events
- `message_template_status_update`: Template approval/rejection
- `message_template_quality_update`: Quality score changes
- `account_update`: Account changes
- `business_capability_update`: Messaging limit changes

### Sample Incoming Message Webhook
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15550783881",
          "phone_number_id": "106540352242922"
        },
        "contacts": [{
          "profile": {"name": "Customer Name"},
          "wa_id": "16505551234"
        }],
        "messages": [{
          "from": "16505551234",
          "id": "wamid.HBgL...",
          "timestamp": "1749416383",
          "type": "text",
          "text": {"body": "Message content"}
        }]
      },
      "field": "messages"
    }]
  }]
}
```

## Template Categorization Guidelines

### Marketing Templates
Use for:
- Awareness campaigns
- Sales promotions and offers
- Cart abandonment reminders
- App downloads
- Customer relationship building
- Any mixed promotional content

**Must NOT** include one-time passwords or authentication codes.

### Utility Templates
Must be:
- Non-promotional (no offers, upsells, cross-sells)
- Specific to user's order/account/transaction OR
- Essential/critical for user safety

Use for:
- Order confirmations and updates
- Account alerts
- Feedback surveys (specific to recent interaction)
- Opt-in/opt-out confirmations
- Public safety alerts
- Service disruption notices

### Authentication Templates
Only for:
- One-time password delivery
- Identity verification codes
- Must use template library templates
- Maximum 15 characters for parameters
- No URLs, media, or emojis allowed

## Specialty Templates

### Limited-Time Offer Templates
```json
{
  "type": "limited_time_offer",
  "limited_time_offer": {
    "text": "Expiring offer!",
    "has_expiration": true
  }
}
```

When sending, include expiration:
```json
{
  "type": "limited_time_offer",
  "parameters": [{
    "type": "limited_time_offer",
    "limited_time_offer": {
      "expiration_time_ms": 1698562800000
    }
  }]
}
```

### Product Card Carousel Templates
For showcasing products from catalog:
```json
{
  "type": "carousel",
  "cards": [
    {
      "card_index": 0,
      "components": [
        {
          "type": "header",
          "parameters": [{
            "type": "product",
            "product": {
              "product_retailer_id": "SKU123",
              "catalog_id": "194836987003835"
            }
          }]
        }
      ]
    }
  ]
}
```

## Best Practices

### Template Design
1. Keep body text under 1024 characters
2. Use clear, concise language
3. Provide value in every message
4. Test with example data before submission
5. Include unsubscribe options for marketing

### Parameter Usage
1. Use named parameters for clarity and flexibility
2. Provide realistic example values
3. Keep parameter values appropriate length
4. Order matters for positional parameters

### Quality Management
1. Monitor template quality ratings
2. Address low-quality templates promptly
3. Avoid sending to uninterested users
4. Respect user marketing preferences
5. Don't mis-categorize templates

### Webhook Handling
1. Validate all incoming requests
2. Respond within reasonable time
3. Handle retries gracefully (deduplicate)
4. Store important webhook data
5. Use mTLS for enhanced security

## Common Patterns

### Welcome Message with Discount
```json
{
  "name": "welcome_discount",
  "category": "marketing",
  "components": [
    {
      "type": "header",
      "format": "image",
      "example": {"header_handle": ["..."]}
    },
    {
      "type": "body",
      "text": "Welcome {{first_name}}! Use code {{code}} for {{discount}} off!",
      "example": {
        "body_text_named_params": [
          {"param_name": "first_name", "example": "John"},
          {"param_name": "code", "example": "WELCOME20"},
          {"param_name": "discount", "example": "20%"}
        ]
      }
    },
    {
      "type": "buttons",
      "buttons": [
        {"type": "url", "text": "Shop Now", "url": "https://..."},
        {"type": "quick_reply", "text": "Unsubscribe"}
      ]
    }
  ]
}
```

### Order Confirmation
```json
{
  "name": "order_confirmation",
  "category": "utility",
  "components": [
    {
      "type": "body",
      "text": "Thanks {{name}}! Order #{{order_id}} confirmed. Estimated delivery: {{date}}",
      "example": {
        "body_text_named_params": [
          {"param_name": "name", "example": "Sarah"},
          {"param_name": "order_id", "example": "ORD-12345"},
          {"param_name": "date", "example": "Dec 15"}
        ]
      }
    },
    {
      "type": "buttons",
      "buttons": [
        {"type": "url", "text": "Track Order", "url": "https://track/{{1}}", "example": ["ORD-12345"]},
        {"type": "phone_number", "text": "Call Support", "phone_number": "15551234567"}
      ]
    }
  ]
}
```

## Troubleshooting

### Template Rejection
- **INCORRECT_CATEGORY**: Review categorization guidelines, request review if needed
- **INVALID_FORMAT**: Check component structure and limits
- **ABUSIVE_CONTENT**: Remove policy-violating content
- **SCAM**: Ensure legitimate business use

### Webhook Issues
- Verify endpoint SSL certificate
- Check verify_token matches
- Ensure proper signature validation
- Confirm app permissions (whatsapp_business_messaging)
- Test with App Dashboard test webhooks

### Sending Failures
- Verify template status is APPROVED
- Check recipient phone number format (+country_code)
- Ensure parameter count/order matches template
- Verify customer service window status
- Check messaging limits not exceeded

## Important Limits

- **Templates per WABA**: 250 (unverified) or 6,000 (verified)
- **Template creation rate**: 100 per hour
- **Template name**: 512 characters max
- **Body text**: 1024 characters max
- **Header text**: 60 characters max
- **Footer text**: 60 characters max
- **Button label**: 25 characters max
- **Buttons total**: 10 max
- **URL length**: 2,000 characters max
- **Copy code**: 15 characters max

## Resources

- API Version: v23.0 or later
- Base URL: `https://graph.facebook.com/v23.0/`
- Required permissions: 
  - `whatsapp_business_messaging` (messages)
  - `whatsapp_business_management` (management)
- Webhook payload limit: 3 MB
- Retry window: 7 days for failed webhooks
