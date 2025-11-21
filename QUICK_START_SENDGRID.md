# ⚡ SendGrid Quick Start

## 🚀 3 Steps to Get Running

### 1️⃣ Verify Sender Email (5 minutes)
```
https://app.sendgrid.com/settings/sender_auth/senders
```
- Click "Create New Sender"
- Enter: `tanmay.unico@gmail.com`
- Check email → Click verification link
- **Wait for "Verified" status**

### 2️⃣ Start Server
```bash
node server.js
```

### 3️⃣ Test It
```bash
./test-sendgrid.sh
```

---

## ✅ Expected Results

### Status Check:
```json
{
  "service": "SendGrid",
  "apiKey": "Configured",
  "fromEmail": "tanmay.unico@gmail.com"
}
```

### Test Email:
```json
{
  "success": true,
  "message": "Trading credentials sent successfully"
}
```

---

## ⚠️ If Issues:

**"Unauthorized" Error:**
→ Verify sender email (Step 1)

**"Invalid API Key" Error:**
→ Create new key: https://app.sendgrid.com/settings/api_keys

**Email Not Received:**
→ Check spam folder

---

## 📊 What Changed

| Before | After |
|--------|-------|
| Gmail | SendGrid |
| 500/day | 100/day free, 40k/month paid |
| 429 errors | NO rate limits |
| Slow | Fast |

---

## 🎯 Next:

1. ✅ Test with `./test-sendgrid.sh`
2. ✅ Send email to yourself
3. ✅ Test from mobile app
4. ✅ Monitor: https://app.sendgrid.com/email_activity

**Full Guide:** `SENDGRID_SETUP_COMPLETE.md`

