#!/bin/bash

# Meta Graph API: List all WhatsApp Business Account templates
# Replace values from your .env if needed

WHATSAPP_BUSINESS_ACCOUNT_ID="4363407937225555"
ACCESS_TOKEN="EAAkdENTLlHoBQ15ZCoeAcK5Ua9FHDFGG9sCicumZC6an7RvZBJVy3ubG0otTiTc07XAmvEijLK9glU2J05fhx3N7tpgHPYTjWYUu2dOVbHXH18nq6wJAyMN10m4CUkePzbncsW6wPr6S0ZCaVoWrhF1QZA4gqsFsZCtrEawyedNBoAkFhRbsjpQZCLQItsSo1ShuWJSi3sUTTWpZAekc0hK7sng5tHLOVOTrCZBcyw2yV0oMAvz8xqLhRKaaRRrAJB9US3Tpqac90zZCA5KbRMLQW2XZBYI"
GRAPH_VERSION="v23.0"

echo "Fetching WhatsApp templates for WABA ID: $WHATSAPP_BUSINESS_ACCOUNT_ID"
echo "---------------------------------------------------"

# Basic request: all templates with default fields
curl -s -X GET "https://graph.facebook.com/$GRAPH_VERSION/$WHATSAPP_BUSINESS_ACCOUNT_ID/message_templates" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

echo ""
echo "---------------------------------------------------"
echo "Alternative: Filter to only APPROVED templates with specific fields"
echo ""

# Optional: Filtered request (uncomment to use)
# curl -s -X GET "https://graph.facebook.com/$GRAPH_VERSION/$WHATSAPP_BUSINESS_ACCOUNT_ID/message_templates?fields=name,status,language,components&status=APPROVED&limit=50" \
#   -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
