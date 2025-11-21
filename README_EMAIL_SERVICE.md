# 📧 Trading Credentials Email Service

Complete email service with **rate limit protection**, **automatic retry**, and **queue management** for sending trading credentials to users.

---

## 🎯 What's Included

✅ **Rate Limit Protection** - No more Gmail 429 errors  
✅ **Automatic Queue System** - Handles multiple emails seamlessly  
✅ **Retry Logic** - Exponential backoff on failures  
✅ **REST API Endpoints** - Ready to use HTTP APIs  
✅ **Testing Utilities** - CLI tools for testing  
✅ **Complete Documentation** - API docs, guides, and examples  

---

## 🚀 Quick Start (3 Steps)

### 1. Test the Service
```bash
node test-email-service.js status
```
**Expected:** "✅ Email service is fully configured"

### 2. Test Connection
```bash
node test-email-service.js test
```
**Expected:** "✅ Email service connection successful!"

### 3. Send Test Email
```bash
curl -X POST http://localhost:3000/http/trading-credentials \
  -H "Content-Type: application/json" \
  -d '{"emailID":"your.email@example.com","tradingID":"TEST123","tradingPassword":"TestPass123"}'
```
**Expected:** 200 OK with success message

---

## 📚 Documentation Files

| File | Purpose | Start Here |
|------|---------|------------|
| **`QUICK_START.md`** | Get started in 5 minutes | ⭐ **START HERE** |
| **`API_DOCUMENTATION.md`** | Complete API reference | For integration |
| **`API_QUICK_REFERENCE.md`** | Quick API cheat sheet | For quick lookup |
| **`EMAIL_SERVICE_GUIDE.md`** | Comprehensive guide | For deep understanding |
| **`CHANGES_SUMMARY.md`** | What changed and why | For developers |
| **`Trading_Credentials_API.postman_collection.json`** | Postman collection | Import & test |

---

## 🔌 API Endpoints

### 1. Send Trading Credentials
```bash
POST /http/trading-credentials

Body:
{
  "emailID": "user@example.com",
  "tradingID": "TRADE123456",
  "tradingPassword": "SecurePass123"
}
```

### 2. Check Service Status
```bash
GET /http/trading-credentials/status
```

### 3. Test Connection
```bash
POST /http/trading-credentials/test
```

**See `API_QUICK_REFERENCE.md` for complete examples**

---

## 🛠️ Testing Utility

The `test-email-service.js` utility helps you test and monitor the email service:

```bash
# Check service status and configuration
node test-email-service.js status

# Test SMTP connection
node test-email-service.js test

# Send single test email
node test-email-service.js send your.email@example.com

# Test queue with multiple emails
node test-email-service.js bulk 5
```

---

## ⚙️ Configuration

Edit `.env` to customize rate limiting:

```env
# Delay between emails (milliseconds)
EMAIL_MIN_DELAY=2000              # Default: 2 seconds

# Retry configuration
EMAIL_MAX_RETRIES=3               # Default: 3 attempts
EMAIL_INITIAL_RETRY_DELAY=5000    # Default: 5 seconds
EMAIL_MAX_RETRY_DELAY=60000       # Default: 60 seconds
```

**If you get 429 errors:** Increase `EMAIL_MIN_DELAY` to 5000 or higher

---

## 📊 How It Works

### Before (❌ Problem)
```
Send Email 1 → ✅ Success
Send Email 2 → ✅ Success
Send Email 3 → ✅ Success
Send Email 4 → ❌ Error 429 - Rate Limit!
```

### After (✅ Solution)
```
Send Email 1 → ✅ Success
⏳ Wait 2 seconds...
Send Email 2 → ✅ Success
⏳ Wait 2 seconds...
Send Email 3 → ✅ Success
⏳ Wait 2 seconds...
Send Email 4 → ✅ Success (No error!)
```

**Your code doesn't change!** The queue system handles everything automatically.

---

## 💻 Code Examples

### JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:3000/http/trading-credentials', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    emailID: 'user@example.com',
    tradingID: 'TRADE123',
    tradingPassword: 'SecurePass123'
  })
});

const data = await response.json();
if (data.success) {
  console.log('✅ Email sent!');
}
```

### Python
```python
import requests

response = requests.post('http://localhost:3000/http/trading-credentials', json={
    'emailID': 'user@example.com',
    'tradingID': 'TRADE123',
    'tradingPassword': 'SecurePass123'
})

print(response.json())
```

### cURL
```bash
curl -X POST http://localhost:3000/http/trading-credentials \
  -H "Content-Type: application/json" \
  -d '{"emailID":"user@example.com","tradingID":"TRADE123","tradingPassword":"Pass123"}'
```

**See `API_DOCUMENTATION.md` for more examples (Dart, Axios, etc.)**

---

## 📈 Performance

With default settings (2-second delays):

| Emails | Time | Gmail Limit |
|--------|------|-------------|
| 10 | ~20 sec | ✅ OK |
| 50 | ~1.7 min | ✅ OK |
| 100 | ~3.3 min | ✅ OK |
| 500 | ~16.6 min | ✅ OK (daily limit) |

**Gmail Limits:**
- Free: 500 emails/day, ~100/hour
- Workspace: 2,000 emails/day, ~200/hour

---

## 🧪 Testing Workflow

### Step 1: Verify Configuration
```bash
node test-email-service.js status
```

### Step 2: Test SMTP
```bash
node test-email-service.js test
```

### Step 3: Send Test Email
```bash
node test-email-service.js send your.email@example.com
```

### Step 4: Use API
```bash
curl -X POST http://localhost:3000/http/trading-credentials \
  -H "Content-Type: application/json" \
  -d '{"emailID":"test@example.com","tradingID":"TEST","tradingPassword":"Pass123456"}'
```

---

## 🐛 Troubleshooting

### Still Getting 429 Errors?
1. Increase `EMAIL_MIN_DELAY` to 5000 in `.env`
2. Check if you've exceeded Gmail's daily limit (500 for free)
3. Wait 24 hours for limit reset

### Email Not Received?
1. Check spam/junk folder
2. Verify email address is correct
3. Test connection: `node test-email-service.js test`
4. Check Gmail sent folder

### Emails Taking Too Long?
This is normal with rate limiting! Consider:
- Using SendGrid/AWS SES for high volume
- Increasing server capacity
- See `EMAIL_SERVICE_GUIDE.md` for alternatives

---

## 📦 Postman Collection

Import `Trading_Credentials_API.postman_collection.json` into Postman for easy testing:

1. Open Postman
2. Import → File → Select `Trading_Credentials_API.postman_collection.json`
3. Set `baseUrl` variable to your server URL
4. Test all endpoints with pre-filled examples

---

## 🔐 Security Recommendations

For production use:

1. **Add Authentication**
   ```javascript
   router.post('/trading-credentials', authenticateUser, async (req, res) => {
     // ... existing code
   });
   ```

2. **Add Rate Limiting per IP**
   ```javascript
   import rateLimit from 'express-rate-limit';
   const limiter = rateLimit({ windowMs: 15*60*1000, max: 10 });
   router.post('/trading-credentials', limiter, async (req, res) => {
     // ... existing code
   });
   ```

3. **Validate User Exists**
4. **Add Audit Logging**
5. **Use HTTPS Only**

**See `API_DOCUMENTATION.md` for complete security guide**

---

## 📊 Architecture

```
Client Request
     ↓
API Endpoint (/http/trading-credentials)
     ↓
Email Service (emailService.js)
     ↓
Queue System (with rate limiting)
     ↓
Process Queue (2-second delays)
     ↓
Gmail SMTP (send email)
     ↓
Retry on Failure (if needed)
     ↓
Success Response
```

---

## 🚀 For High Volume

If sending **>100 emails/hour** regularly:

### Option 1: Increase Delays
```env
EMAIL_MIN_DELAY=5000  # 5 seconds
```

### Option 2: Upgrade to Gmail Workspace
- 2,000 emails/day
- Better reliability

### Option 3: Use Dedicated Email Service (Recommended)
- **SendGrid:** 40,000 emails/month for $19.95
- **AWS SES:** $0.10 per 1,000 emails
- **Mailgun:** 5,000 emails/month free

**See `EMAIL_SERVICE_GUIDE.md` for migration guides**

---

## 📞 Need Help?

1. **Quick Start:** Read `QUICK_START.md`
2. **API Integration:** Read `API_DOCUMENTATION.md`
3. **Deep Dive:** Read `EMAIL_SERVICE_GUIDE.md`
4. **Test First:** Run `node test-email-service.js test`
5. **Check Logs:** Look for error messages in server logs

---

## 📋 File Structure

```
project/
├── services/
│   └── emailService.js              ← Email service with queue system
├── http/
│   └── tradingCredentials.js        ← API endpoints
├── .env                             ← Configuration
├── test-email-service.js            ← Testing utility
├── README_EMAIL_SERVICE.md          ← This file (overview)
├── QUICK_START.md                   ← Quick start guide
├── API_DOCUMENTATION.md             ← Complete API reference
├── API_QUICK_REFERENCE.md           ← Quick API cheat sheet
├── EMAIL_SERVICE_GUIDE.md           ← Comprehensive guide
├── CHANGES_SUMMARY.md               ← What changed
└── Trading_Credentials_API.postman_collection.json
```

---

## ✅ Checklist

- [x] Email service with rate limiting
- [x] Automatic retry logic
- [x] Queue management
- [x] REST API endpoints
- [x] Testing utilities
- [x] Complete documentation
- [x] Postman collection
- [x] Error handling
- [ ] Add authentication (recommended)
- [ ] Add audit logging (recommended)
- [ ] Add monitoring/alerts (recommended)

---

## 🎉 Ready to Use!

Your email service is configured and ready. No code changes needed!

**Next Steps:**
1. Read `QUICK_START.md` (5 minutes)
2. Test with `node test-email-service.js test`
3. Try the API with Postman or cURL
4. Integrate into your application

**Questions?** Check the documentation files listed above!

---

**Last Updated:** November 21, 2025  
**Status:** ✅ Production Ready  
**Rate Limit Protection:** ✅ Enabled  
**Testing:** ✅ Utilities Included  
**Documentation:** ✅ Complete

