# 📧 Trading Credentials Email API Documentation

## Base URL
```
http://localhost:3000/http
```
*(Change to your production URL when deployed)*

---

## 📨 1. Send Trading Credentials

Send trading credentials via email to a user.

### Endpoint
```
POST /http/trading-credentials
```

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "emailID": "user@example.com",
  "tradingID": "TRADE123456",
  "tradingPassword": "SecurePass123"
}
```

### Request Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `emailID` | string | ✅ Yes | Recipient email address | Valid email format |
| `tradingID` | string | ✅ Yes | Trading account ID | Min 3 characters |
| `tradingPassword` | string | ✅ Yes | Trading account password | Min 6 characters |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Trading credentials sent successfully",
  "data": {
    "emailID": "user@example.com",
    "tradingID": "TRADE123456",
    "messageId": "<unique-message-id@gmail.com>",
    "sentAt": "2025-11-21T10:30:45.123Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "success": false,
  "error": "Missing required fields",
  "message": "emailID, tradingID, and tradingPassword are required",
  "required": ["emailID", "tradingID", "tradingPassword"]
}
```

#### 400 Bad Request - Invalid Email
```json
{
  "success": false,
  "error": "Invalid email format",
  "message": "Please provide a valid email address"
}
```

#### 400 Bad Request - Invalid Trading ID
```json
{
  "success": false,
  "error": "Invalid trading ID",
  "message": "Trading ID must be at least 3 characters long"
}
```

#### 400 Bad Request - Invalid Password
```json
{
  "success": false,
  "error": "Invalid trading password",
  "message": "Trading password must be at least 6 characters long"
}
```

#### 500 Internal Server Error - Email Failed
```json
{
  "success": false,
  "error": "Email sending failed",
  "message": "Failed to send trading credentials",
  "details": "Rate limit exceeded. Max retries reached."
}
```

### Examples

#### cURL
```bash
curl -X POST http://localhost:3000/http/trading-credentials \
  -H "Content-Type: application/json" \
  -d '{
    "emailID": "user@example.com",
    "tradingID": "TRADE123456",
    "tradingPassword": "SecurePass123"
  }'
```

#### JavaScript (Fetch)
```javascript
const response = await fetch('http://localhost:3000/http/trading-credentials', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    emailID: 'user@example.com',
    tradingID: 'TRADE123456',
    tradingPassword: 'SecurePass123'
  })
});

const data = await response.json();
console.log(data);
```

#### JavaScript (Axios)
```javascript
import axios from 'axios';

const response = await axios.post('http://localhost:3000/http/trading-credentials', {
  emailID: 'user@example.com',
  tradingID: 'TRADE123456',
  tradingPassword: 'SecurePass123'
});

console.log(response.data);
```

#### Python (requests)
```python
import requests

url = 'http://localhost:3000/http/trading-credentials'
data = {
    'emailID': 'user@example.com',
    'tradingID': 'TRADE123456',
    'tradingPassword': 'SecurePass123'
}

response = requests.post(url, json=data)
print(response.json())
```

#### Dart/Flutter
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

final response = await http.post(
  Uri.parse('http://localhost:3000/http/trading-credentials'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'emailID': 'user@example.com',
    'tradingID': 'TRADE123456',
    'tradingPassword': 'SecurePass123',
  }),
);

final data = jsonDecode(response.body);
print(data);
```

---

## 🔍 2. Check Email Service Status

Get the current status of the email service, including queue information.

### Endpoint
```
GET /http/trading-credentials/status
```

### Request Headers
```
None required
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Email service status retrieved",
  "data": {
    "service": "gmail",
    "user": "Configured",
    "appPassword": "Configured",
    "queueLength": 3,
    "isProcessing": true,
    "rateLimitConfig": {
      "minDelayBetweenEmails": "2000ms",
      "maxRetries": 3,
      "initialRetryDelay": "5000ms",
      "maxRetryDelay": "60000ms"
    }
  }
}
```

### Response Fields

| Field | Description |
|-------|-------------|
| `service` | Email service provider (gmail) |
| `user` | Email user configuration status |
| `appPassword` | App password configuration status |
| `queueLength` | Number of emails waiting in queue |
| `isProcessing` | Whether emails are currently being sent |
| `rateLimitConfig` | Current rate limiting configuration |

### Examples

#### cURL
```bash
curl http://localhost:3000/http/trading-credentials/status
```

#### JavaScript (Fetch)
```javascript
const response = await fetch('http://localhost:3000/http/trading-credentials/status');
const data = await response.json();
console.log(data);
```

#### Python
```python
import requests

response = requests.get('http://localhost:3000/http/trading-credentials/status')
print(response.json())
```

---

## 🧪 3. Test Email Service

Test the email service SMTP connection.

### Endpoint
```
POST /http/trading-credentials/test
```

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{}
```
*(No body required, but must be a POST request)*

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Email service test successful",
  "data": {
    "success": true,
    "message": "Email service is ready"
  }
}
```

### Error Response (500)
```json
{
  "success": false,
  "error": "Email service test failed",
  "message": "Email service is not ready",
  "details": "Invalid login credentials"
}
```

### Examples

#### cURL
```bash
curl -X POST http://localhost:3000/http/trading-credentials/test \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### JavaScript (Fetch)
```javascript
const response = await fetch('http://localhost:3000/http/trading-credentials/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: '{}'
});

const data = await response.json();
console.log(data);
```

---

## 📊 API Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/http/trading-credentials` | Send trading credentials email | No* |
| GET | `/http/trading-credentials/status` | Check email service status | No* |
| POST | `/http/trading-credentials/test` | Test email service connection | No* |

*Note: Consider adding authentication for production use*

---

## ⚡ Rate Limiting

The email service has built-in rate limiting to prevent Gmail 429 errors:

- **Default Delay:** 2 seconds between emails
- **Max Retries:** 3 attempts on failure
- **Exponential Backoff:** 5s, 10s, 20s, up to 60s

### Multiple Email Requests

If you send multiple requests, they will be automatically queued:

```javascript
// All these will be queued and sent with delays
const promises = [
  sendEmail('user1@example.com', 'ID1', 'Pass1'),
  sendEmail('user2@example.com', 'ID2', 'Pass2'),
  sendEmail('user3@example.com', 'ID3', 'Pass3')
];

const results = await Promise.all(promises);
```

**Expected behavior:**
- Email 1: Sent immediately
- Email 2: Sent after 2 seconds
- Email 3: Sent after 4 seconds (2+2)

---

## 🔐 Security Recommendations

### 1. Add Authentication
```javascript
// Add middleware to protect endpoints
import { authenticateUser } from './middleware/auth.js';

router.post('/trading-credentials', authenticateUser, async (req, res) => {
  // ... existing code
});
```

### 2. Rate Limiting per IP
```javascript
import rateLimit from 'express-rate-limit';

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many email requests, please try again later'
});

router.post('/trading-credentials', emailLimiter, async (req, res) => {
  // ... existing code
});
```

### 3. Validate Authorized Users
```javascript
// Only allow sending credentials to registered users
const user = await getUserByEmail(emailID);
if (!user) {
  return res.status(404).json({
    success: false,
    error: 'User not found',
    message: 'Email address not registered'
  });
}
```

### 4. Audit Logging
```javascript
// Log all credential sends
await logEmailSend({
  emailID,
  tradingID,
  sentBy: req.user.id,
  timestamp: new Date(),
  success: emailResult.success
});
```

---

## 🧪 Testing Workflow

### 1. Test Service Connection
```bash
curl -X POST http://localhost:3000/http/trading-credentials/test
```

### 2. Check Service Status
```bash
curl http://localhost:3000/http/trading-credentials/status
```

### 3. Send Test Email
```bash
curl -X POST http://localhost:3000/http/trading-credentials \
  -H "Content-Type: application/json" \
  -d '{
    "emailID": "your.email@example.com",
    "tradingID": "TEST123",
    "tradingPassword": "TestPass123"
  }'
```

### 4. Check Queue Status Again
```bash
curl http://localhost:3000/http/trading-credentials/status
# Should show queueLength and isProcessing
```

---

## 🐛 Common Issues & Solutions

### Issue: 429 Rate Limit Error
**Solution:** Increase `EMAIL_MIN_DELAY` in `.env` to 5000ms or higher

### Issue: Invalid Credentials
**Solution:** Verify `EMAIL_USER` and `EMAIL_APP_PASSWORD` in `.env`

### Issue: Emails Taking Too Long
**Solution:** This is normal with rate limiting. 10 emails = ~20 seconds

### Issue: Email Not Received
**Solution:** 
1. Check spam/junk folder
2. Verify email address is correct
3. Check Gmail sent folder
4. Test with `curl` command above

---

## 📈 Performance Metrics

With default configuration (2-second delays):

| Emails | Time Required | Gmail Limit OK? |
|--------|---------------|-----------------|
| 10 | ~20 seconds | ✅ Yes |
| 50 | ~100 seconds (~1.7 min) | ✅ Yes |
| 100 | ~200 seconds (~3.3 min) | ✅ Yes (hourly limit) |
| 500 | ~1000 seconds (~16.6 min) | ✅ Yes (daily limit) |
| 1000 | N/A | ❌ No (exceeds free tier) |

---

## 🚀 Production Checklist

- [ ] Add authentication middleware
- [ ] Add IP-based rate limiting
- [ ] Add audit logging
- [ ] Validate users before sending
- [ ] Use HTTPS only
- [ ] Set up monitoring/alerts
- [ ] Consider SendGrid for high volume
- [ ] Add email templates for different purposes
- [ ] Implement retry queue persistence
- [ ] Add metrics dashboard

---

## 📞 Support

For issues:
1. Check `EMAIL_SERVICE_GUIDE.md` for detailed troubleshooting
2. Test with `node test-email-service.js`
3. Check server logs for specific errors
4. Verify `.env` configuration

---

## 📝 Complete Example Application

```javascript
// example.js - Complete working example

async function sendCredentialsToUser(email, tradingId, password) {
  try {
    const response = await fetch('http://localhost:3000/http/trading-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emailID: email,
        tradingID: tradingId,
        tradingPassword: password
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Email sent successfully!');
      console.log(`📧 Message ID: ${data.data.messageId}`);
      console.log(`⏰ Sent at: ${data.data.sentAt}`);
      return true;
    } else {
      console.error('❌ Failed to send email:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    return false;
  }
}

// Usage
await sendCredentialsToUser('user@example.com', 'TRADE123', 'Pass123456');
```

---

**Last Updated:** November 21, 2025  
**API Version:** 1.0.0  
**Rate Limit Protection:** ✅ Enabled

