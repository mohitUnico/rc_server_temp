# 📧 Trading Credentials Email Service

This service allows Flutter clients to send trading credentials via email using nodemailer.

## 🚀 Features

- **Secure Email Delivery**: Send trading ID and password via email
- **Professional Email Template**: Beautiful HTML email with security notices
- **Input Validation**: Email format, trading ID, and password validation
- **Multiple Email Providers**: Support for Gmail, Outlook, and custom SMTP
- **Rate Limiting**: Built-in protection against spam
- **Error Handling**: Comprehensive error handling and logging

## 🔧 Setup

### 1. Install Dependencies
```bash
npm install nodemailer
```

### 2. Environment Variables
Add these to your `.env` file:

#### For Gmail (Recommended)
```bash
# Gmail Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password

# Optional
SUPPORT_EMAIL=support@yourcompany.com
TEST_EMAIL=test@example.com
```

#### For Outlook/Hotmail
```bash
# Outlook Configuration
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-outlook-password
```

#### For Custom SMTP
```bash
# Custom SMTP Configuration
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
```

### 3. Gmail App Password Setup
If using Gmail, you need to create an App Password:

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Scroll down to **App passwords**
4. Generate a new app password for "Mail"
5. Use this password in `EMAIL_APP_PASSWORD`

## 📡 API Endpoints

### Send Trading Credentials
```http
POST /http/trading-credentials
Content-Type: application/json

{
  "emailID": "user@example.com",
  "tradingID": "TRADER123",
  "tradingPassword": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trading credentials sent successfully",
  "data": {
    "emailID": "user@example.com",
    "tradingID": "TRADER123",
    "messageId": "abc123@email.com",
    "sentAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### Check Email Service Status
```http
GET /http/trading-credentials/status
```

**Response:**
```json
{
  "success": true,
  "message": "Email service status retrieved",
  "data": {
    "service": "gmail",
    "user": "Configured",
    "appPassword": "Configured"
  }
}
```

### Test Email Service
```http
POST /http/trading-credentials/test
```

**Response:**
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

## 🧪 Testing

### Test Email Service
```bash
# Test the email service functionality
npm run test-email
```

### Test with cURL
```bash
# Test sending trading credentials
curl -X POST http://localhost:3000/http/trading-credentials \
  -H "Content-Type: application/json" \
  -d '{
    "emailID": "test@example.com",
    "tradingID": "TEST123",
    "tradingPassword": "testpass123"
  }'

# Check service status
curl http://localhost:3000/http/trading-credentials/status

# Test email service
curl -X POST http://localhost:3000/http/trading-credentials/test
```

## 📱 Flutter Client Usage

### Send Trading Credentials
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> sendTradingCredentials() async {
  final url = Uri.parse('http://localhost:3000/http/trading-credentials');
  
  final response = await http.post(
    url,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'emailID': 'user@example.com',
      'tradingID': 'TRADER123',
      'tradingPassword': 'securepassword123'
    }),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    print('Credentials sent: ${data['message']}');
  } else {
    print('Error: ${response.body}');
  }
}
```

## 🔒 Security Features

### Input Validation
- **Email Format**: Validates proper email format
- **Trading ID**: Minimum 3 characters, alphanumeric + underscore + hyphen
- **Password**: Minimum 6 characters
- **Required Fields**: All fields must be provided

### Rate Limiting
- **Per Hour**: Maximum 10 requests per hour
- **Per Day**: Maximum 50 requests per day
- **Delay**: 1 second between requests

### Email Security
- **App Passwords**: Uses Gmail App Passwords (more secure)
- **No Reply**: Emails are sent from noreply address
- **Security Notice**: Includes security best practices in email

## 📧 Email Template

The service sends a professional HTML email containing:

1. **Header**: Trading Credentials title
2. **Account Information**: Trading ID and Password in styled boxes
3. **Security Notice**: Important security reminders
4. **Footer**: Support information and disclaimers

## 🚨 Error Handling

### Common Errors
- **400**: Missing or invalid fields
- **500**: Email service failure
- **500**: Internal server error

### Error Response Format
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human readable message",
  "details": "Technical details (if available)"
}
```

## 🔧 Configuration Options

### Email Provider Selection
The service automatically detects your configuration:

1. **Gmail**: Uses `EMAIL_USER` + `EMAIL_APP_PASSWORD`
2. **Outlook**: Uses `EMAIL_USER` + `EMAIL_PASSWORD`
3. **Custom**: Uses `SMTP_HOST`, `SMTP_PORT`, etc.

### Customization
- **Email Template**: Modify `EmailTemplates` in `config/emailConfig.js`
- **Validation Rules**: Adjust `ValidationRules` in `config/emailConfig.js`
- **Rate Limiting**: Configure `RateLimitConfig` in `config/emailConfig.js`

## 📊 Monitoring

### Logs
- **Success**: Email sent successfully with message ID
- **Errors**: Failed email attempts with error details
- **Status**: Service status and configuration checks

### Health Checks
- **Service Status**: Check if email service is configured
- **Connection Test**: Verify SMTP connection
- **Send Test**: Test actual email delivery

## 🎯 Use Cases

1. **User Registration**: Send trading credentials after account creation
2. **Password Reset**: Send new credentials when password is reset
3. **Account Recovery**: Send credentials for account recovery
4. **Support Requests**: Send credentials when users request them
5. **Testing**: Send test credentials for development/testing

## 🚀 Production Deployment

### Environment Variables
Ensure all required environment variables are set in production.

### Email Provider
- **Gmail**: Recommended for development and small scale
- **Custom SMTP**: Recommended for production and large scale
- **Email Service**: Consider services like SendGrid, Mailgun for high volume

### Monitoring
- Monitor email delivery rates
- Set up alerts for email failures
- Track rate limiting violations
- Monitor SMTP connection health

---

**Your trading credentials email service is now ready!** 🎉

Set up your environment variables and start sending secure emails to your users.
