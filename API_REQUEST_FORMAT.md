# 📧 API Request Format - Send Trading Credentials

## ✅ Your API Endpoint is Ready!

```
POST http://localhost:3000/http/trading-credentials
```

---

## 📝 Request Format

### Headers
```
Content-Type: application/json
```

### Body (JSON)
```json
{
  "emailID": "user@example.com",
  "tradingID": "TRADE123456",
  "tradingPassword": "SecurePass123"
}
```

---

## 🧪 Test It Now (Copy & Paste)

### Using cURL
```bash
curl -X POST http://localhost:3000/http/trading-credentials \
  -H "Content-Type: application/json" \
  -d '{
    "emailID": "your.email@example.com",
    "tradingID": "TRADE123456",
    "tradingPassword": "SecurePass123"
  }'
```

### Using Postman
1. **Method:** POST
2. **URL:** `http://localhost:3000/http/trading-credentials`
3. **Headers:** 
   - Key: `Content-Type`
   - Value: `application/json`
4. **Body:** Select "raw" and "JSON"
```json
{
  "emailID": "user@example.com",
  "tradingID": "TRADE123456",
  "tradingPassword": "SecurePass123"
}
```

---

## ✅ Success Response (200 OK)

```json
{
  "success": true,
  "message": "Trading credentials sent successfully",
  "data": {
    "emailID": "user@example.com",
    "tradingID": "TRADE123456",
    "messageId": "<unique-id@gmail.com>",
    "sentAt": "2025-11-21T10:30:45.123Z"
  }
}
```

---

## ❌ Error Responses

### Missing Fields (400)
```json
{
  "success": false,
  "error": "Missing required fields",
  "message": "emailID, tradingID, and tradingPassword are required"
}
```

### Invalid Email (400)
```json
{
  "success": false,
  "error": "Invalid email format",
  "message": "Please provide a valid email address"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Email sending failed",
  "message": "Failed to send trading credentials"
}
```

---

## 💻 Code Examples

### JavaScript (Fetch)
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

const result = await response.json();
console.log(result);
```

### JavaScript (Axios)
```javascript
import axios from 'axios';

const response = await axios.post('http://localhost:3000/http/trading-credentials', {
  emailID: 'user@example.com',
  tradingID: 'TRADE123456',
  tradingPassword: 'SecurePass123'
});

console.log(response.data);
```

### Python
```python
import requests

response = requests.post(
    'http://localhost:3000/http/trading-credentials',
    json={
        'emailID': 'user@example.com',
        'tradingID': 'TRADE123456',
        'tradingPassword': 'SecurePass123'
    }
)

print(response.json())
```

### Dart/Flutter
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

final result = jsonDecode(response.body);
print(result);
```

### PHP
```php
<?php
$data = [
    'emailID' => 'user@example.com',
    'tradingID' => 'TRADE123456',
    'tradingPassword' => 'SecurePass123'
];

$ch = curl_init('http://localhost:3000/http/trading-credentials');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response));
?>
```

---

## 📋 Field Validation

| Field | Required | Type | Min Length | Format |
|-------|----------|------|------------|--------|
| `emailID` | ✅ Yes | string | - | Valid email (user@domain.com) |
| `tradingID` | ✅ Yes | string | 3 chars | Any alphanumeric |
| `tradingPassword` | ✅ Yes | string | 6 chars | Any characters |

---

## 🔗 Other Endpoints

### Check Service Status
```bash
GET http://localhost:3000/http/trading-credentials/status
```

### Test Connection
```bash
POST http://localhost:3000/http/trading-credentials/test
Body: {}
```

---

## 📊 Rate Limiting

- **Automatic:** Emails are queued automatically
- **Delay:** 2 seconds between emails
- **Retries:** 3 attempts on failure
- **No code changes needed!**

---

## 🚀 Quick Test Commands

```bash
# 1. Test connection
curl -X POST http://localhost:3000/http/trading-credentials/test \
  -H "Content-Type: application/json" \
  -d '{}'

# 2. Check status
curl http://localhost:3000/http/trading-credentials/status

# 3. Send email (change email to yours)
curl -X POST http://localhost:3000/http/trading-credentials \
  -H "Content-Type: application/json" \
  -d '{"emailID":"your.email@gmail.com","tradingID":"TEST123","tradingPassword":"TestPass123"}'
```

---

## 💡 Production URL

Change `localhost:3000` to your production domain:

```
https://your-domain.com/http/trading-credentials
```

---

## 📞 Need More Info?

- **Quick Start:** `QUICK_START.md`
- **Complete API Docs:** `API_DOCUMENTATION.md`
- **Quick Reference:** `API_QUICK_REFERENCE.md`
- **Postman Collection:** `Trading_Credentials_API.postman_collection.json`

---

**That's it! Your API is ready to use! 🎉**

