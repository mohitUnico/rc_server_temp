# 🚀 API Quick Reference - Trading Credentials Email

## 📬 Send Trading Credentials

```bash
POST /http/trading-credentials
```

**Request:**
```json
{
  "emailID": "user@example.com",
  "tradingID": "TRADE123456",
  "tradingPassword": "SecurePass123"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Trading credentials sent successfully",
  "data": {
    "emailID": "user@example.com",
    "tradingID": "TRADE123456",
    "messageId": "<id@gmail.com>",
    "sentAt": "2025-11-21T10:30:45.123Z"
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/http/trading-credentials \
  -H "Content-Type: application/json" \
  -d '{"emailID":"user@example.com","tradingID":"TRADE123","tradingPassword":"Pass123456"}'
```

---

## 📊 Check Status

```bash
GET /http/trading-credentials/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "service": "gmail",
    "queueLength": 0,
    "isProcessing": false,
    "rateLimitConfig": {
      "minDelayBetweenEmails": "2000ms",
      "maxRetries": 3
    }
  }
}
```

**cURL:**
```bash
curl http://localhost:3000/http/trading-credentials/status
```

---

## 🧪 Test Connection

```bash
POST /http/trading-credentials/test
```

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "message": "Email service test successful"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/http/trading-credentials/test \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📋 Validation Rules

| Field | Rule |
|-------|------|
| `emailID` | Valid email format required |
| `tradingID` | Min 3 characters |
| `tradingPassword` | Min 6 characters |

---

## ⚡ Rate Limiting

- **Delay:** 2 seconds between emails
- **Retries:** 3 attempts on failure
- **Queue:** Automatic for multiple requests

---

## 🔗 Quick Links

- **Full Documentation:** `API_DOCUMENTATION.md`
- **Postman Collection:** `Trading_Credentials_API.postman_collection.json`
- **Test Utility:** `node test-email-service.js`

---

## 💡 Quick Test

```bash
# 1. Test connection
curl -X POST http://localhost:3000/http/trading-credentials/test -H "Content-Type: application/json" -d '{}'

# 2. Check status
curl http://localhost:3000/http/trading-credentials/status

# 3. Send test email (replace with your email)
curl -X POST http://localhost:3000/http/trading-credentials \
  -H "Content-Type: application/json" \
  -d '{"emailID":"your.email@gmail.com","tradingID":"TEST123","tradingPassword":"TestPass123"}'
```

