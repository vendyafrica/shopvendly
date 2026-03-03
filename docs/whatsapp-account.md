# WhatsApp Business API Documentation

## Business Phone Numbers

**Updated: Dec 12, 2025**

This document describes WhatsApp business phone numbers, their requirements, management information, and unique features.

### Registering Business Phone Numbers

A valid business phone number must be registered before it can be used to send and receive messages via Cloud API. Registered numbers can still be used for everyday purposes, such as calling and text messages, but cannot be used with WhatsApp Messenger ("WhatsApp").

Numbers already in use with WhatsApp cannot be registered unless they are deleted first. If your number is banned on WhatsApp and you wish to register it, it must be unbanned via the appeal process first.

Note that when you complete the steps in our Get Started document, a test business phone number will be generated and registered for you automatically.

### Eligibility Requirements

Eligible phone numbers must be:
- owned by you
- have a country and area code (short codes are not supported)
- able to receive voice calls or SMS
- number should have scaled capabilities

If you are registering a 1-800 number, see 1-800 and toll free numbers for additional information.

### Registration Methods

- **App Dashboard**: Complete the steps in our Get Started document if you haven't already, then use the App Dashboard > WhatsApp > API Setup panel to add a phone number.
- **Meta Business Suite**: You can register a business phone number when using Meta Business Suite to create a WhatsApp Business Account.
- **WhatsApp Manager**: See our How to connect your phone number to your WhatsApp Business Account help center article.
- **Embedded Signup**: If you are working with a solution partner, they will provide you with a link to Embedded Signup, which you can use to register a number.

### Business Phone Number Types

This table categorizes phone number types and evaluates their suitability for receiving OTPs via SMS, international phone calls, and flash calls. It provides likelihood assessments for successful delivery based on number type and carrier characteristics. Additionally, it offers actionable recommendations for users to improve delivery success without changing their phone number type.

| Phone type | Description | SMS OTP | Voice OTP | Actions |
|------------|-------------|---------|-----------|---------|
| Mobile (recommended) | Assigned to mobile devices/SIMs | Standard | Standard | Enable International reception of SMS/Calls, ensure device is connected to Cellular Network, Grant App permissions |
| Fixed line | Assigned to physical locations (landline) | Not Recommended | Standard | Enable International reception of SMS/Calls, ensure line is ready for incoming calls and disable call forwarding or IVR features |
| Freephone | Toll-Free, recipient pays | Not Recommended | Standard | Ensure with Phone provider that the number is able to receive International SMS/Calls, check that line is ready for incoming calls and disable call forwarding or IVR features |
| Premium rate | Higher charges for special services | Not Recommended | Standard | Ensure with Phone provider that the number is able to receive International SMS/Calls, check that line is ready for incoming calls and disable call forwarding or IVR features |
| Shared cost | Cost shared between caller and recipient | Not Recommended | Not Recommended | Ensure with Phone provider that the number is able to receive International SMS/Calls, check that line is ready for incoming calls and disable call forwarding or IVR features |
| Universal access | Reachable globally for customer service | Not Recommended | Standard | Ensure with Phone provider that the number is able to receive International SMS/Calls, check that line is ready for incoming calls and disable call forwarding or IVR features |
| Personal number | Assigned to individuals, not tied to device | Not Recommended | Not Recommended | Ensure with Phone provider that the number is able to receive International SMS/Calls, check that line is ready for incoming calls and disable call forwarding or IVR features |
| VoIP | Internet telephony, not tied to physical line | Not Recommended | Standard | Confirm that the VoIP provider supports international SMS/calls for OTPs; check provisioning and account settings; keep app/service running and notifications enabled; ensure device is online and permissions granted |
| Inbound only | Only accept incoming calls/messages | Not Recommended | Standard | Ensure with Phone provider that the number is able to receive International SMS/Calls, check that line is ready for incoming calls and disable call forwarding or IVR features |
| Pager | Assigned to pagers (rare) | Not supported | Not supported | Not supported |
| M2M/IoT | Machine-to-machine, smart devices | Not Recommended | Not Recommended | Ensure device and SIM are allowed for incoming International SMS/calls |

### Status

Business phone numbers have a status, which reflects their quality rating and current messaging limit. Business phone numbers must have a status of "connected" in order to send and receive messages via the API.

#### Viewing status via WhatsApp Manager

Your business phone number's current status appears in the Status column in the WhatsApp Manager > Account tools > Phone numbers panel.

See our About your WhatsApp Business phone number's quality rating help center article to learn more about quality ratings and statuses as they appear in WhatsApp Manager.

#### Getting status via API

Request the status field on your WhatsApp Business Phone Number ID. See the GET /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID> reference for a list of returnable status values and their meanings.

**Example request:**
```bash
curl 'https://graph.facebook.com/v24.0/106540352242922?fields=status' \
-H 'Authorization: Bearer EAAJB...'
```

**Example response:**
```json
{
  "status": "CONNECTED",
  "id": "106540352242922"
}
```

### Display Names

You must provide display name information when registering a business phone number. The display name appears in your business phone number's WhatsApp profile, and can also appear at the top of individual chat threads and the chat list if certain conditions are met. See our Display names document to learn how display names work.

### Business Profiles

A business profile provides additional information about your business, such as its address, website, description, etc. You can supply this information when registering your business phone number. See our Business profiles document to learn how business profiles work.

### Official Business Account Status

Business phone numbers can gain Official Business Account ("OBA") status. OBA numbers have a blue checkmark beside their name in the contacts view.

See our Official Business Account document to learn how to request OBA status for a business phone number.

### Two-Step Verification

You must set a two-step verification PIN when registering a business phone number. Your PIN is required when changing your PIN or deleting your phone number from the platform.

#### Changing your PIN via WhatsApp Manager

You will need your current PIN to change your PIN via WhatsApp Manager. To change your PIN:

1. Navigate to WhatsApp Manager > Account tools > Phone numbers.
2. Select your business phone number.
3. Click the Two-step verification tab.
4. Click the Change PIN button and complete the flow.

If you don't have your PIN, you can change your PIN using the API.

#### Changing your PIN via API

Use the POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID> endpoint to set a new PIN.

**Example request:**
```bash
curl 'https://graph.facebook.com/v24.0/106540352242922/' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "pin": "150954"
}'
```

**Example response:**
Upon success:
```json
{
  "success": true
}
```

#### Disabling two-step verification

To disable two-step verification using WhatsApp Manager, follow the steps for changing your PIN, but click the Turn off two-step verification button as the final step instead. An email with a link will be sent to the email address associated with your business portfolio. Use the link to disable two-step verification. Once disabled, you can re-enable it by setting a new PIN.

Note that you cannot disable two-step verification using the API.

### 1-800 and Toll Free Numbers

You may want to register a 1-800 or other toll free number on the platform. These numbers are usually behind an Interactive Voice Response (IVR) system, however, which a WhatsApp registration call cannot navigate. Phone numbers behind an IVR system can be registered, but must be able to accept calls from international numbers and be able to redirect our SMS message or voice call to a real person.

To register a phone number that is behind an IVR system:

1. WhatsApp shares with you 1 or 2 phone numbers that the registration call will come from.
2. Create an allow list for these numbers. If you are unable to create an allow list for these numbers, add the phone number to your WABA and open a Direct Support ticket asking for the registration call phone numbers and include the phone number you are trying to register in the ticket.
3. Redirect the registration call to an employee or a mailbox to capture the registration code.

Phone numbers behind an IVR system that are unable to receive registration calls are not supported.

### Registered Number Cap

New business portfolios are initially capped at 2 registered business phone numbers.

If your business becomes verified, or if you have reached a messaging limit of 2,000, we will automatically increase your cap to 20. Upon increase, a Meta Business Suite notification will be sent, informing you of your new cap, and a business_capability_update webhook will be triggered with max_phone_numbers_per_business set to your new cap.

### Verify Phone Numbers

You need to verify the phone number you want to use to send messages to your customers. Phone numbers must be verified using a code sent via an SMS/voice call. The verification process can be done via Graph API calls specified below.

To verify a phone number using Graph API, make a POST request to PHONE_NUMBER_ID/request_code. In your call, include your chosen verification method and language.

**Endpoint:** `/PHONE_NUMBER_ID/request_code`

**Authentication:** Authenticate yourself with a system user access token. If you are requesting the code on behalf of another business, the access token needs to have Advanced Access to the whatsapp_business_management permission.

**Parameters:**

| Name | Description |
|------|-------------|
| code_method | string (Required). Chosen method for verification. Supported options: SMS, VOICE |
| language | string (Required). The language's two-character language code. For example: "en". |

**Example request:**
```bash
curl -X POST 'https://graph.facebook.com/v24.0/106540352242922/request_code?code_method=SMS&language=en_US' \
-H 'Authorization: Bearer EAAJB...'
```

After the API call, you will receive your verification code via the method you selected. To finish the verification process, include your code in a POST request to PHONE_NUMBER_ID/verify_code.

**Endpoint:** `/PHONE_NUMBER_ID/verify_code`

**Authentication:** Authenticate yourself with a system user access token. If you are requesting the code on behalf of another business, the access token needs to have Advanced Access to the whatsapp_business_management permission.

**Parameters:**

| Name | Description |
|------|-------------|
| code | numeric string (Required). The code you received after calling FROM_PHONE_NUMBER_ID/request_code. |

**Example:**

Sample request:
```bash
curl -X POST \
  'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER_ID/verify_code' \
  -H 'Authorization: Bearer ACCESS_TOKEN' \
  -F 'code=000000'
```

A successful response looks like this:
```json
{
  "success": true
}
```

### WhatsApp User Phone Number Formats

Plus signs (+), hyphens (-), parenthesis ((,)), and spaces are supported in send message requests.

We highly recommend that you include both the plus sign and country calling code when sending a message to a customer. If the plus sign is omitted, your business phone number's country calling code is prepended to the customer's phone number. This can result in undelivered or misdelivered messages.

For example, if your business is in India (country calling code 91) and you send a message to the following customer phone number in various formats:

| Number In Send Message Request | Number Message Delivered To | Outcome |
|-------------------------------|----------------------------|---------|
| +16315551234 | +16315551234 | Correct number |
| +1 (631) 555-1234 | +16315551234 | Correct number |
| (631) 555-1234 | +916315551234 | Potentially wrong number |
| 1 (631) 555-1234 | +9116315551234 | Potentially wrong number |

**Note:** For Brazil and Mexico, the extra added prefix of the phone number may be modified by the Cloud API. This is a standard behavior of the system and is not considered a bug.

### Identity Change Check

You may want us to verify a customer's identity before we deliver your message to them. You can have us do this by enabling the identity change check setting on your business phone number.

If a customer performs an action in WhatsApp that we consider to be an identity change, we generate a new identity hash for the user. You can get this hash anytime you message the customer by enabling the identity change check setting on your business phone number. Once enabled, anytime the customer messages you, or you message the customer without an identity hash, we will include their hash in any incoming messages webhooks or status messages webhooks. You can then capture and store this hash for future use.

To use the hash, include it in a send message request. We will compare the hash in the request to the customer's current hash. If the hashes match, the message will be delivered. If there is a mismatch, it means the customer has changed their identity since you last messaged them and we will not deliver the message. Instead, we will send you a status messages webhook with error code 137000, notifying you of the failure and mismatch.

When you receive a mismatched hash webhook, assume the customer's phone number can no longer be trusted. To reestablish trust, verify the customer's identity again using other, non-WhatsApp channels. Once you have reestablished trust, resend the failed message to the new identity (if any), without a hash. Then store the customer's new hash included in the message status delivery webhook.

#### Request Syntax

Send a POST request to the WhatsApp Business Phone Number > Settings endpoint to enable or disable the identity change check setting.

**POST /<WHATSAPP_BUSINESS_PHONE_NUMBER>/settings**

**Post Body:**
```json
{
  "user_identity_change" : {
    "enable_identity_key_check": <ENABLE_IDENTITY_KEY_CHECK>
  }
}
```

Set `<ENABLE_IDENTITY_KEY_CHECK>` to `true` to enable identity check, or `false` to disable it.

**Example Enable Request:**
```bash
curl 'https://graph.facebook.com/v24.0/106850078877666/settings' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "user_identity_change": {
    "enable_identity_key_check": true
  }
}'
```

**Example Enable Response:**
```json
{
  "success": true
}
```

**Example Send Message With Check:**

This example message would only be delivered if the recipient_identity_key_hash hash value matches the customer's current hash.

```bash
curl 'https://graph.facebook.com/v24.0/106850078877666/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+16505551234",
  "recipient_identity_key_hash": "DF2lS5v2W6x=",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "Your latest statement is attached. See... "
  }
}'
```

#### Webhooks

In incoming messages webhooks with a contacts object, such as the text messages webhook, the customer's hash is assigned to the identity_key_hash property.

In outgoing messages webhooks (status messages webhooks), the customer's hash is assigned to the recipient_identity_key_hash property in the statuses object.

### Getting Throughput Level

Use the WhatsApp Business Phone Number endpoint to get a phone number's current throughput level:

**GET /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>?fields=throughput**

### Get All Phone Numbers

To get a list of all phone numbers associated with a WhatsApp Business Account, send a GET request to the WhatsApp Business Account > Phone Numbers endpoint.

In addition, phone numbers can be sorted in either ascending or descending order by last_onboarded_time, which is based on when the user completed onboarding for Embedded Signup. If not specified, the default order is descending.

**Request syntax:**
```bash
curl -X GET "https://graph.facebook.com/<API_VERSION>/<WABA_ID>/phone_numbers?access_token=<ACCESS_TOKEN>"
```

On success, a JSON object is returned with a list of all the business names, phone numbers, phone number IDs, and quality ratings associated with a business. Results are sorted by embedded signup completion date in descending order, with the most recently onboarded listed first.

**Example response:**
```json
{
  "data": [
    {
      "verified_name": "Jasper's Market",
      "display_phone_number": "+1 631-555-5555",
      "id": "1906385232743451",
      "quality_rating": "GREEN"
    },
    {
      "verified_name": "Jasper's Ice Cream",
      "display_phone_number": "+1 631-555-5556",
      "id": "1913623884432103",
      "quality_rating": "NA"
    }
  ]
}
```

**Request syntax (with sorting):**
```bash
curl -X GET "https://graph.facebook.com/<API_VERSION>/<WABA_ID>/phone_numbers?access_token=<SYSTEM_USER_ACCESS_TOKEN>]&sort=['last_onboarded_time_ascending']"
```

**Example response:**

On success, a JSON object is returned with a list of all the business names, phone numbers, phone number IDs, and quality ratings associated with a business. It is sorted based on when the user has completed embedded signup in ascending order, with the most recently onboarded listed last.

```json
{
  "data": [
   {
      "verified_name": "Jasper's Ice Cream",
      "display_phone_number": "+1 631-555-5556",
      "id": "1913623884432103",
      "quality_rating": "NA"
    },
    {
      "verified_name": "Jasper's Market",
      "display_phone_number": "+1 631-555-5555",
      "id": "1906385232743451",
      "quality_rating": "GREEN"
    }
  ]
}
```

### Filter Phone Numbers

You can query phone numbers and filter them based on their account_mode. This filtering option is currently being tested in beta mode. Not all developers have access to it.

**Parameters:**

| Name | Description |
|------|-------------|
| field | Value: account_mode |
| operator | Value: EQUAL |
| value | Values: SANDBOX, LIVE |

**Request syntax:**
```bash
curl -i -X GET "https://graph.facebook.com/<API_VERSION>/<WABA_ID>/phone_numbers?filtering=[{"field":"account_mode","operator":"EQUAL","value":"SANDBOX"}]&access_token=<ACCESS_TOKEN>
```

**Example response:**
```json
{
  "data": [
    {
      "id": "1972385232742141",
      "display_phone_number": "+1 631-555-1111",
      "verified_name": "John's Cake Shop",
      "quality_rating": "UNKNOWN",
    }
  ],
  "paging": {
    "cursors": {
      "before": "abcdefghij",
      "after": "klmnopqr"
    }
  }
}
```

### Get a Single Phone Number

To get information about a phone number, send a GET request to the WhatsApp Business Phone Number endpoint:

**Request Syntax:**
```
GET https://graph.facebook.com/<API_VERSION>/<PHONE_NUMBER_ID>
```

**Sample Request:**
```bash
curl \
'https://graph.facebook.com/v15.0/105954558954427/' \
-H 'Authorization: Bearer EAAFl...'
```

On success, a JSON object is returned with the business name, phone number, phone number ID, and quality rating for the phone number queried.

```json
{
  "code_verification_status" : "VERIFIED",
  "display_phone_number" : "15555555555",
  "id" : "105954558954427",
  "quality_rating" : "GREEN",
  "verified_name" : "Support Number"
}
```

### Get Display Name Status (Beta)

Include fields=name_status as a query string parameter to get the status of a display name associated with a specific phone number. This field is currently in beta and not available to all developers.

**Sample Request:**
```bash
curl \
'https://graph.facebook.com/v15.0/105954558954427?fields=name_status' \
-H 'Authorization: Bearer EAAFl...'
```

**Sample Response:**
```json
{
  "id" : "105954558954427",
  "name_status" : "AVAILABLE_WITHOUT_REVIEW"
}
```

The name_status value can be one of the following:
- **APPROVED**: The name has been approved. You can download your certificate now.
- **AVAILABLE_WITHOUT_REVIEW**: The certificate for the phone is available and display name is ready to use without review.
- **DECLINED**: The name has not been approved. You cannot download your certificate.
- **EXPIRED**: Your certificate has expired and can no longer be downloaded.
- **PENDING_REVIEW**: Your name request is under review. You cannot download your certificate.
- **NONE**: No certificate is available.

Note that certificates are valid for 7 days.

### Deleting Business Phone Numbers

Only business portfolio admins can delete business phone numbers, and numbers can't be deleted if they have been used to send paid messages within the last 30 days.

#### Deleting business phone numbers via WhatsApp Manager

If your business phone number has a Connected status, you will need your two-step verification PIN to delete your number.

1. Load your business portfolio in the WhatsApp Manager.
2. If it doesn't automatically load the Phone numbers panel, navigate to Account tools (the toolbox icon) > Phone numbers.
3. Click the phone number's trash can icon and complete the flow.

If the number has been used to send paid messages within the last 30 days, you will be redirected to the Insights panel, showing the date of the last paid message. You can delete the number 30 days from this date.

#### Deleting business phone numbers via API

You cannot delete a business phone number via API.

### Migrating Business Phone Numbers

You can migrate phone numbers from one WABA to another, as well as migrate a number from On-Premises API to Cloud API.

### Conversational Components

You can enable helpful message UI components to make it easier for WhatsApp users to interact with your business. See Conversational components.

---

## Registration

**Updated: Nov 4, 2025**

To use your business phone number with Cloud API you must register it. Register your business phone number in the following scenarios:

- **Account Creation**: When you implement this API, you need to register the business phone number you want to use to send messages. We enforce setting two-step verification during account creation to add an extra layer of security to your accounts.
- **Name Change**: In this case, your phone is already registered and you want to change your display name. To do that, you must first file for a name change on WhatsApp Manager. Once the name is approved, you need to register your phone again under the new name.
- **Migrating your number from On-Premises API to Cloud API**. See Migration Exception.

Before you can register your business phone number you must first verify its ownership.

### Migration Exception

If you are migrating a phone number from the On-Premises API to the Cloud API, there are extra steps you need to perform before registering a phone number with the Cloud API. See Migrate From On-Premises API to Cloud API for the full process.

### Register a Business Phone Number

To register your verified business phone number, make a POST call to PHONE_NUMBER_ID/register. Include the parameters listed below.

**Endpoint:** `PHONE_NUMBER_ID/register` (See Get Phone Number ID)

**Authentication:** Solution Partners must authenticate themselves with an access token with the whatsapp_business_management and whatsapp_business_messaging permissions.

#### Limitations

Requests to the registration endpoint are limited to 10 requests per business number in a 72 hour moving window.

When you make a registration request, we will check how many registration requests you have made to register that number in the last 72 hours. If you have already made 10 requests, the API will return error code 133016, and the number will be prevented from being registered for the next 72 hours.

#### Parameters

| Name | Description |
|------|-------------|
| messaging_product | Required. Messaging service used. Set this to "whatsapp". |
| pin | Required. If your verified business phone number already has two-step verification enabled, set this value to your number's 6-digit two-step verification PIN. If you cannot recall your PIN, you can change it. See Two-step verification. If your verified business phone number does not have two-step verification enabled, set this value to a 6-digit number. This will be the newly verified business phone number's two-step verification PIN. |
| data_localization_region | Optional. If included, enables local storage on the business phone number. Value must be a 2-letter ISO 3166 country code (e.g. IN) indicating the country where you want data-at-rest to be stored. Supported values: APAC (Australia: AU, Indonesia: ID, India: IN, Japan: JP, Singapore: SG, South Korea: KR), Europe (EU (Germany): DE, Switzerland: CH, United Kingdom: GB), LATAM (Brazil: BR), MEA (Bahrain: BH, South Africa: ZA, United Arab Emirates: AE), NORAM (Canada: CA). Once enabled, cannot be disabled or changed directly. Instead, you must deregister the number and register it again without this parameter (to disable), or include the parameter with the new country code (to change). To enable local storage on a number that has already been registered, you must deregister the number, then register it again and include this parameter. |

**Example Request without Local Storage:**
```bash
curl 'https://graph.facebook.com/v24.0/106540352242922/register ' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "messaging_product": "whatsapp",
  "pin": "212834"
}
```

**Example Request with Local Storage:**
```bash
curl 'https://graph.facebook.com/v24.0/106540352242922/register ' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "messaging_product": "whatsapp",
  "pin": "212834",
  "data_localization_region": "CH"
}
```

All API calls require authentication with access tokens.

Developers can authenticate their API calls with the access token generated in the App Dashboard > WhatsApp > API Setup.

Solution Partners must authenticate themselves with an access token with the whatsapp_business_messaging and whatsapp_business_management permissions. See System User Access Tokens for information.

### Deregister a Business Phone Number

Deregistering a business phone number makes it no longer usable with Cloud API and disables local storage on the number, if it had been enabled.

To deregister a business phone number, make a POST call to PHONE_NUMBER_ID/deregister:

**Endpoint:** `PHONE_NUMBER_ID/deregister` (See Get Phone Number ID)

**Authentication:** Solution Partners must authenticate themselves with an access token with the whatsapp_business_management and whatsapp_business_messaging permissions.

#### Limitations

- This endpoint cannot be used to deregister a business phone number that is in use with both Cloud API and the WhatsApp Business app.
- Deregistration does not delete a number or its message history. To delete a number and its history, see Delete Phone Number from a WABA.
- Requests to the deregistration endpoint are limited to 10 requests per business number in a 72-hour moving window. If you exceed this amount, the API will return error code 133016, and the business phone number will be prevented from being deregistered for the next 72 hours.

**Example:**

Sample Request:
```bash
curl -X POST \
 'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER_ID/deregister' \
 -H 'Authorization: Bearer ACCESS_TOKEN'
```

A successful response looks like:
```json
{
  "success": true
}
```

### See Also

- Resetting your PIN
- Cloud API Local Storage

---

## Business Profiles

**Updated: Oct 5, 2025**

Your business phone number's business profile provides additional information about your business, such as its address, website, description, etc. You can supply this information when registering your business phone number, or later, via WhatsApp Manager or API.

### Viewing or Updating Your Profile via WhatsApp Manager

To view or update your business profile via WhatsApp Manager:

1. Navigate to WhatsApp Manager > Account tools > Phone numbers.
2. Select your business phone number.
3. Click the Profile tab to view your current profile.
4. Use the form to set new profile values.

### Getting Your Profile via API

Use the GET /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/whatsapp_business_profile endpoint to request specific business profile fields:

**Example request:**
```bash
curl 'https://graph.facebook.com/v24.0/106540352242922/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical' \
-H 'Authorization: Bearer EAAJB...'
```

**Example response:**

Upon success:
```json
{
  "data": [
    {
      "about": "Succulent specialists!",
      "address": "1 Hacker Way, Menlo Park, CA 94025",
      "description": "At Lucky Shrub, we specialize in providing a...",
      "email": "lucky@luckyshrub.com",
      "profile_picture_url": "https://pps.whatsapp.net/v/t61.24...",
      "websites": [
        "https://www.luckyshrub.com/"
      ],
      "vertical": "RETAIL",
      "messaging_product": "whatsapp"
    }
  ]
}
```

### Updating Your Profile via API

Use the POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/whatsapp_business_profile endpoint to update specific business profile fields:

**Example request:**
```bash
curl 'https://graph.facebook.com/v24.0/106540352242922/whatsapp_business_profile' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
--data-raw '
{
  "about": "Succulent specialists!",
  "address": "1 Hacker Way, Menlo Park, CA 94025",
  "description": "At Lucky Shrub, we specialize in providing a diverse range of high-quality succulents to suit your needs. From rare and exotic varieties to timeless classics, our collection has something for everyone.",
  "email": "lucky@luckyshrub.com",
  "messaging_product": "whatsapp",
  "profile_picture_handle": "4::aW...",
  "vertical": "RETAIL",
  "websites": "[\n  \"https://www.luckyshrub.com\"\n]"
}'
```

**Example response:**

Upon success:
```json
{
  "success": true
}
```

---

## Official Business Accounts

**Updated: Dec 12, 2025**

An Official Business Account ("OBA") is a business phone number owned by a business that has been verified as an authentic and notable brand according to specific criteria. Official Business Account business phone numbers have a blue checkmark beside their name in the contacts view.

You can request OBA status for a business phone number using WhatsApp Manager or API. Once we've reviewed your request, you will receive a notification letting you know if your business phone has been granted OBA Number status or not. If your request is rejected, you can submit a new request after 30 days.

We do not grant OBA status to business employees, test accounts, and WhatsApp Business app phone numbers.

### Eligibility

To be eligible for OBA, the following criteria must be met:

- The business must comply with the WhatsApp Business Messaging Policy.
- The business must be registered on the WhatsApp Business Platform for at least 30 days.
- The business represents a notable, well-known, and frequently searched for business, brand, or entity.
- The business portfolio that owns the number has been verified through Business Verification.
- The business phone number has enabled two-step verification.
- The business phone number's display name has been approved.

If you meet the above criteria but do not see an option to apply for OBA in WhatsApp Manager, please reach out to your Meta point-of-contact, Solution Provider support, or Meta Support to check if you are eligible for the application process.

**Note:** If a business phone number is not an Official Business Account (OBA), it will not appear in search results when users search for it within the WhatsApp application. However, if a user adds the number to their contacts, the display name will appear in their search results. For improved discoverability, we recommend applying for OBA status.

### Notability

Notability requires a business to represent a well-known, often searched brand or entity. This should not be taken as a signal of the authenticity of the business.

Notability, on the other hand, reflects substantial presence in online news articles. Notability is assessed based on an account's presence in news articles from publications with sizable audiences. We do not consider paid or promotional content as sources for review, including business or app listings.

OBA Number status is issued at the business phone number and display name level. We assess notability for the display name of the business phone number that is requesting OBA status. If the display name is changed after receiving OBA Number status, we will need to re-assess the new display name for notability and display name compliance.

Additionally, previous OBA status approvals for other business phone numbers owned by a given Whatsapp Business Account do not guarantee approval for all business phone numbers owned by the WABA. If the WABA contains one main parent brand and the phone number associated with that brand meets notability requirements, we suggest updating the display names for the child brands as follows: {{sub-brand name}} by {{notable name}}

### Denied Requests

If your request has been denied, it means our team has carefully reviewed your account and determined that it is not eligible for OBA Number status at that time. Currently, these decisions cannot be appealed. You can continue to grow their business presence and wait 30 days before submitting another request.

In the meantime, this decision does not limit your ability to share your business details. Each business phone number also has a business profile which includes the profile picture, email, website, and business description. These are fields that you can edit at any time.

### Requesting OBA Status via WhatsApp Manager

Access WhatsApp Manager > Overview, and click the business phone number:

1. Enable two-step verification if it isn't enabled already.
2. Click on the Submit Request button and fill out the form.

You can submit up to 5 supporting links especially from renowned publications (e.g., India Today, Economic times, Wall Street Journal, Reuters, Wikipedia, Business Insider) to show that the business is notable, which helps us determine notability.

Fields like Country(s) of operation, parent business or brand (esp. if it is a well known brand) and Primary language helps us to further understand your brand and eligibility for OBA.

### Requesting OBA Status via API

Use the POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/official_business_account endpoint to submit a request for OBA status for your business phone number.

**Example request:**
```bash
curl 'https://graph.facebook.com/v24.0/106540352242922/official_business_account' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "additional_supporting_information": "We are also featured in Planet Succulent and Prickly Digest",
  "business_website_url": "https://www.luckyshrub.com",
  "parent_business_or_brand": "Lucky Shrub LLC",
  "primary_country_of_operation": "United States of America",
  "primary_language": "English",
  "supporting_links": [
    "https://www.retailreview.com/gardening/2025/lucky-shrub",
    "https://www.faster-company.com/2025/online-nursies-are-making-green-waves",
    "https://www.succulentscene.com/2025/new-online-retailers",
    "https://www.pricklypages.com/2025/succullents/where-to-buy",
    "https://www.spinyliving.com/2025/latest-news"
  ]
}'
```

**Example response:**

Upon success:
```json
{
  "success": true
}
```

Note that true does not indicate approval, only successful submission.

### Getting OBA Status via API

Use the GET /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID> endpoint to request the official_business_account field on your business phone number to get the status of an OBA request.

**Example request:**
```bash
curl 'https://graph.facebook.com/v24.0/106540352242922?fields=official_business_account' \
-H 'Authorization: Bearer EAAJB...'
```

**Example response:**

Upon success:
```json
{
  "official_business_account": {
    "oba_status": "NOT_STARTED"
  },
  "id": "106540352242922"
}
```

---

## WhatsApp Business Accounts

**Updated: Oct 30, 2025**

WhatsApp Business Accounts ("WABAs") represent a business on the WhatsApp Business Platform. You must have a WABA to send and receive messages to and from WhatsApp users, and to create and manage templates.

There are several ways to create a WABA, which are described below. Once created, we recommend that you connect your phone number and set up a payment method.

### Limitations

- A WhatsApp Business Account (WABA) can have a maximum of 250 message templates.
- Meta Business Accounts are initially limited to 2 registered business phone numbers, but this limit can be increased to up to 20. See Registered Number Limits.
- Meta Business Accounts are initially limited to 20 WABAs.
- A WABA must belong to only one Business Manager. You cannot have two or more Business Managers owning one WABA.
- A WABA's time zone and currency cannot be edited once a line of credit has been attached to it. You cannot migrate a WABA from one business to another.

### Create a WABA via the App Dashboard

If you are going to be using Cloud API directly to send and receive messages, follow the steps in the Cloud API Get Started documentation. Once you have completed these steps, you will have a test WABA and test business number, and have access to the App Dashboard > WhatsApp > API Setup panel.

The API Setup panel allows you to add a production business phone number, which generates a new WABA, which is then associated with that number.

### Create a WABA via a Solution Provider

If you are working with a solution provider (a business that offers WhatsApp messaging services to other businesses) who offers WhatsApp messaging services for you via the API, the solution provider will provide you with instructions. Typically this involves you completing the Embedded Signup flow, which gathers information about your business and generates a WABA for you, then using the provider's app to access your newly created WABA and related assets.

See our Create your WhatsApp Business Account with WhatsApp Business solution providers Help Center article for more information.

### Create a WABA via Meta Business Suite

This feature is being released gradually over the next few weeks and may not be available to you immediately. Business portfolios with a Brazil or India address are currently unable to use this feature.

You can create a WABA using Meta Business Suite. Use this method if you are working with a solution provider who provides WhatsApp messaging-related services via Meta Business Suite instead of Cloud API.

To create a WABA using Meta Business Suite:

1. Go to https://business.facebook.com/ and create a business portfolio, or sign into your existing account and select your existing portfolio if you already have one.
2. Navigate to the Settings (gear icon) > Accounts > WhatsApp accounts panel.
3. Click the blue +Add button and in the dropdown menu select Create a new WhatsApp Business account.
4. In the Create a WhatsApp Business account window that appears (pictured below), complete the flow.

### Share Your WABA with a Solution Provider

You can share your WABA (or any of your business assets) with any business-verified solution provider (aka "partner") using Meta Business Suite. Once shared, the partner can then use the Meta Business Suite to access your WABA and provide services.

**Notes:**
- If you are sharing your WABA with a Solution Provider (a type of partner who has a credit line), they must share their credit line with you before you will be able to use their app to send messages.
- You can share a WABA with up to two partners.

#### If you have not shared an asset with the partner before

1. Ask the partner for their business portfolio ID. You will need this ID to complete the remaining steps.
2. Sign into Meta Business Suite. Use the top-left dropdown menu to select the business portfolio if you have multiple portfolios.
3. Navigate to the Settings (gear icon) > Accounts > WhatsApp accounts panel.
4. In the list of WABAs, select your WABA, or click its Details link.
5. In the details overlay that appears to the right (pictured below), click the Assign partner button.
6. In the Share this WhatsApp Account with a partner overlay that appears, enter the partner's business portfolio ID and use the toggles to define which permissions to grant to the partner, then click the Assign button.
7. If your WABA is shared with the partner successfully, a Partner added message will appear. Click the Done button to dismiss it.
8. Back in the details overlay, click the Partners tab.
9. In the Partners tab, confirm that the partner's name appears as a partner with appropriate permissions.
10. Inform the partner that you have successfully shared your WABA with them (and ask them to share their credit line if appropriate; see note above).

#### If you have already shared an asset with the partner

1. Sign into Meta Business Suite. Use the top-left dropdown menu to select the business portfolio if you have multiple portfolios.
2. Navigate to the Settings (gear icon) > Users > Partners panel.
3. In the list of partners, click the name of the partner, or its Details link.
4. In the details overlay that appears to the right (pictured below), click the Assign assets button.
5. In the Assign assets and permissions window that appears, click the WhatsApp accounts asset type.
6. Check the checkbox next to your WABA, then use the toggles to define which permissions to grant to the partner and click the Assign button.
7. If successful, an Assets assigned message will appear. Click the Done button to dismiss the window.
8. Confirm that your WABA appears in the Assets you assigned tab with appropriate permissions.
9. Inform the partner that you have successfully shared your WABA with them (and to share their credit line if appropriate; see note above).

### Get WABA Data via API

Use the GET /<WHATSAPP_BUSINESS_ACCOUNT_ID> endpoint to get data on a WABA. Use the fields parameter to request specific fields on a WABA, or omit it to get default fields returned by the endpoint.

**Example request:**
```bash
curl 'https://graph.facebook.com/v24.0/102290129340398?fields=name,status,currency,country,business_verification_status' \
-H 'Authorization: Bearer EAAJB...'
```

**Example response:**
```json
{
  "name": "Lucky Shrub",
  "status": "ACTIVE",
  "currency": "USD",
  "country": "US",
  "business_verification_status": "verified",
  "id": "102290129340398"
}
```

### Access Your WABA with WhatsApp Manager

You can access your WABA in WhatsApp Manager to see basic information like business phone number status, messaging metrics, and to perform basic tasks like template creation and editing.

To access your WABA in WhatsApp Manager:

1. Sign into Meta Business Suite. Use the top-left dropdown menu to select the business portfolio if you have multiple portfolios.
2. Navigate to the Settings (gear icon) > Accounts > WhatsApp accounts panel.
3. In the list of WABAs, select your WABA, or click its Details link.
4. In the Summary tab, click the WhatsApp Manager button.

### Webhooks

Subscribe to the account_update webhook to be notified of changes to a WhatsApp Business Account's status, including changes due to policy and terms violations.

Every time your WABA has violated a policy, you will get a notification looking like this:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "whatsapp-business-account-id",
      "time": 1604703058,
      "changes": [
        {
          "field": "account_update",
          "value": {
            "phone_number": "16505551111",
            "event": "ACCOUNT_VIOLATION",
            "violation_info": {
              "violation_type": "ALCOHOL",
            }
          }
        }
      ]
    }
  ]
}
```

See our WhatsApp Business Platform Policy Violations document for a list of policy violations. If a restriction has been imposed, an account_update webhook will be triggered, describing the violation.

### Messaging On-Behalf-Of

The On-Behalf-Of WABA ownership model is deprecated is no longer possible. See OBO model deprecation for details.