# Collecto API Reference

© 2025. All rights reserved | [www.collecto.cissytech.com](https://collecto.cissytech.com)

**Base Endpoint:** `https://collecto.cissytech.com/api/{username}/{method}`

> Get your `{username}` and `{x-api-key}` from the Collecto System's Settings.

---

## Endpoints

### POST `/requestToPay`

Initiates a payment request to a mobile money account. This endpoint allows you to request funds from a specified phone number, with a defined amount and reference.

**Headers**
```
Content-Type: application/json
x-api-key: your-x-api-key
```

**Request Body**
```json
{
  "paymentOption": "mobilemoney",
  "phone": "256705687760",
  "amount": 6000,
  "reference": "Samson"
}
```

---

### POST `/requestToPayStatus`

Checks the status of a previously initiated payment request. You can track whether a payment has been successful, is pending, or has failed by providing the transaction ID.

**Headers**
```
Content-Type: application/json
x-api-key: your-x-api-key
```

**Request Body**
```json
{
  "transactionId": "PMT12345"
}
```

---

### POST `/servicePayment`

Processes payments for various Collecto services. This endpoint allows you to top up/deposit for the various services using mobile money or other supported payment options.

**Headers**
```
Content-Type: application/json
x-api-key: your-x-api-key
```

**Supported Services:** `BULK`, `SMS`, `AIRTIME`, `EMAILS`, `ADS`

**Request Body**
```json
{
  "service": "SMS",
  "paymentOption": "mobilemoney",
  "phone": "256705687760",
  "amount": 6000,
  "message": "SMS Top up"
}
```

---

### POST `/servicePaymentStatus`

Retrieves the status of a service payment transaction. By providing the service type and transaction ID, you can check if your service payment was successful.

**Headers**
```
Content-Type: application/json
x-api-key: your-x-api-key
```

**Supported Services:** `BULK`, `SMS`, `AIRTIME`, `EMAILS`, `ADS`

**Request Body**
```json
{
  "service": "SMS",
  "transactionId": "PMT12345"
}
```

---

### POST `/initiatePayout`

Transfers funds from your BULK Collecto Account to recipients through various payment gateways (mobile money, FlexiPay, Stanbic Bank, other banks).

> Fund your BULK payments account via the `/servicePayment` endpoint, request admin assistance, or self-service at [https://bulk.cissytech.com](https://bulk.cissytech.com).

**Headers**
```
Content-Type: application/json
x-api-key: your-x-api-key
```

**Supported Gateways:** `mobilemoney` (MTN and Airtel only), `flexipay`, `stanbicBank`, `otherBanks` (swiftCode required)

**Request Body**
```json
{
  "gateway": "mobilemoney",
  "swiftCode": "",
  "reference": "12345MYREF206",
  "accountName": "Samson Kwiz",
  "accountNumber": 256705687760,
  "amount": "5000",
  "message": "Test Payout",
  "phone": 256705687760
}
```

---

### POST `/payoutStatus`

Checks the status of a previously initiated payout. By providing the gateway and reference, you can track whether your payout has been successful, is pending, or has failed.

**Headers**
```
Content-Type: application/json
x-api-key: your-x-api-key
```

**Request Body**
```json
{
  "gateway": "mobilemoney",
  "reference": "12345MYREF206"
}
```

---

### POST `/sendSingleSMS`

Delivers a text message to a specified phone number with a custom message and reference identifier.

> Ensure your SMS account is funded via the `/servicePayment` endpoint, request Collecto Admin to assist, or log into [https://bulk.cissytech.com](https://bulk.cissytech.com) for self-service before sending messages.

**Headers**
```
Content-Type: application/json
x-api-key: your-x-api-key
```

**Request Body**
```json
{
  "phone": 256705687760,
  "message": "SMS Message",
  "reference": 12345
}
```

---

### POST `/currentBalance`

Retrieves available funds for specified account types, allowing you to monitor balances across various Collecto services.

**Headers**
```
Content-Type: application/json
x-api-key: your-x-api-key
```

**Supported Types:** `Wallet`, `CASH`, `BULK`, `SMS`, `AIRTIME`, `EMAILS`, `ADS`

**Request Body**
```json
{
  "type": "Wallet"
}
```

---

### POST `/verifyPhoneNumber`

Validates phone number registration status on MTN MobileMoney, Airtel Money, or FlexiPay and returns the registered name.

**Headers**
```
Content-Type: application/json
x-api-key: your-x-api-key
```

**Supported Numbers:** MTN and Airtel Uganda

**Request Body**
```json
{
  "phone": "256705687760"
}
```