# 🔧 Mobile App - 429 Error Fix Guide

## 🔍 Problem

Mobile app is getting **429 "Too Many Requests"** errors when sending trading credentials, but Postman works fine.

## ✅ Root Cause

The mobile app is likely:
1. **Making multiple rapid requests** (user tapping button multiple times)
2. **Retrying too quickly** on failure
3. **Not handling queue properly**

The server now has **built-in protection** against this.

---

## 🛡️ Server-Side Fixes (Already Implemented)

### 1. Request Deduplication
- Same email + trading ID cannot be requested within **5 seconds**
- Prevents accidental double-taps or rapid retries

### 2. Better Error Responses
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Please wait 3 seconds before requesting credentials again",
  "retryAfter": 3,
  "details": "Duplicate request detected within cooldown period"
}
```

### 3. New "Can Send" Endpoint
Check if it's safe to send before making the request:
```
GET /http/trading-credentials/can-send/:emailID/:tradingID
```

---

## 📱 Mobile App Fixes Required

### Fix 1: Disable Button After Click

**Problem:** User tapping "Send Credentials" button multiple times

**Solution (Flutter/Dart):**
```dart
class SendCredentialsScreen extends StatefulWidget {
  @override
  _SendCredentialsScreenState createState() => _SendCredentialsScreenState();
}

class _SendCredentialsScreenState extends State<SendCredentialsScreen> {
  bool _isSending = false;
  
  Future<void> sendCredentials(String email, String tradingId, String password) async {
    // Prevent multiple clicks
    if (_isSending) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please wait, sending credentials...'))
      );
      return;
    }
    
    setState(() {
      _isSending = true;
    });
    
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/http/trading-credentials'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'emailID': email,
          'tradingID': tradingId,
          'tradingPassword': password,
        }),
      );
      
      final result = jsonDecode(response.body);
      
      if (response.statusCode == 200 && result['success']) {
        // Success
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Credentials sent successfully!'))
        );
      } else if (response.statusCode == 429) {
        // Rate limit error
        final retryAfter = result['retryAfter'] ?? 5;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Please wait $retryAfter seconds and try again'))
        );
      } else {
        // Other error
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message'] ?? 'Failed to send'))
        );
      }
      
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Network error: ${e.toString()}'))
      );
    } finally {
      setState(() {
        _isSending = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: _isSending ? null : () {
        sendCredentials(emailController.text, idController.text, passController.text);
      },
      child: _isSending 
        ? CircularProgressIndicator(color: Colors.white)
        : Text('Send Credentials'),
    );
  }
}
```

---

### Fix 2: Handle 429 Errors Properly

**Solution:**
```dart
Future<Map<String, dynamic>> sendCredentialsWithRetry(
  String email, 
  String tradingId, 
  String password
) async {
  int maxRetries = 3;
  int currentRetry = 0;
  
  while (currentRetry < maxRetries) {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/http/trading-credentials'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'emailID': email,
          'tradingID': tradingId,
          'tradingPassword': password,
        }),
      );
      
      final result = jsonDecode(response.body);
      
      if (response.statusCode == 200 && result['success']) {
        return {'success': true, 'data': result['data']};
      } else if (response.statusCode == 429) {
        // Rate limit - wait and retry
        final retryAfter = result['retryAfter'] ?? 5;
        print('Rate limited. Waiting $retryAfter seconds...');
        await Future.delayed(Duration(seconds: retryAfter));
        currentRetry++;
        continue;
      } else {
        // Other error - don't retry
        return {'success': false, 'error': result['message']};
      }
      
    } catch (e) {
      print('Network error: $e');
      currentRetry++;
      if (currentRetry < maxRetries) {
        await Future.delayed(Duration(seconds: 2));
      }
    }
  }
  
  return {'success': false, 'error': 'Max retries reached'};
}
```

---

### Fix 3: Check Before Sending (Recommended)

**Best Practice:** Check if you can send before making the request

```dart
Future<bool> canSendCredentials(String email, String tradingId) async {
  try {
    final response = await http.get(
      Uri.parse('$baseUrl/http/trading-credentials/can-send/$email/$tradingId'),
    );
    
    if (response.statusCode == 200) {
      final result = jsonDecode(response.body);
      
      if (!result['canSend']) {
        final reason = result['message'] ?? 'Please wait before trying again';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(reason))
        );
        return false;
      }
      
      return true;
    }
  } catch (e) {
    print('Error checking send status: $e');
  }
  
  return true; // Allow on error
}

// Usage in your button handler
Future<void> onSendButtonPressed() async {
  final canSend = await canSendCredentials(email, tradingId);
  
  if (!canSend) {
    return; // Show message already displayed in canSendCredentials
  }
  
  // Proceed with sending
  await sendCredentials(email, tradingId, password);
}
```

---

### Fix 4: Add Cooldown Timer UI

**Show cooldown to user:**
```dart
class SendButton extends StatefulWidget {
  @override
  _SendButtonState createState() => _SendButtonState();
}

class _SendButtonState extends State<SendButton> {
  int _cooldownSeconds = 0;
  Timer? _cooldownTimer;
  
  void startCooldown(int seconds) {
    setState(() {
      _cooldownSeconds = seconds;
    });
    
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(Duration(seconds: 1), (timer) {
      setState(() {
        _cooldownSeconds--;
        if (_cooldownSeconds <= 0) {
          timer.cancel();
        }
      });
    });
  }
  
  @override
  void dispose() {
    _cooldownTimer?.cancel();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    final isDisabled = _cooldownSeconds > 0;
    
    return ElevatedButton(
      onPressed: isDisabled ? null : () async {
        final result = await sendCredentials(...);
        
        if (!result['success'] && result['retryAfter'] != null) {
          startCooldown(result['retryAfter']);
        }
      },
      child: Text(
        isDisabled 
          ? 'Wait ${_cooldownSeconds}s' 
          : 'Send Credentials'
      ),
    );
  }
}
```

---

## 📋 Complete Example

**Full implementation with all fixes:**

```dart
class SendCredentialsService {
  static const String baseUrl = 'http://your-server.com';
  
  // Check if we can send
  static Future<Map<String, dynamic>> canSend(String email, String tradingId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/http/trading-credentials/can-send/$email/$tradingId'),
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Error checking status: $e');
    }
    
    return {'canSend': true}; // Default to allowing
  }
  
  // Send credentials
  static Future<Map<String, dynamic>> send(
    String email,
    String tradingId,
    String password,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/http/trading-credentials'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'emailID': email,
          'tradingID': tradingId,
          'tradingPassword': password,
        }),
      );
      
      final result = jsonDecode(response.body);
      
      return {
        'success': response.statusCode == 200 && result['success'],
        'statusCode': response.statusCode,
        'data': result,
      };
      
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }
  
  // Complete flow with all checks
  static Future<Map<String, dynamic>> sendWithChecks(
    String email,
    String tradingId,
    String password,
  ) async {
    // Step 1: Check if we can send
    final canSendResult = await canSend(email, tradingId);
    
    if (!canSendResult['canSend']) {
      return {
        'success': false,
        'error': canSendResult['message'] ?? 'Cannot send at this time',
        'retryAfter': canSendResult['retryAfter'],
      };
    }
    
    // Step 2: Send the request
    final sendResult = await send(email, tradingId, password);
    
    return sendResult;
  }
}

// Usage in UI
class SendCredentialsButton extends StatefulWidget {
  final String email;
  final String tradingId;
  final String password;
  
  @override
  _SendCredentialsButtonState createState() => _SendCredentialsButtonState();
}

class _SendCredentialsButtonState extends State<SendCredentialsButton> {
  bool _isSending = false;
  int _cooldown = 0;
  
  Future<void> _handleSend() async {
    if (_isSending || _cooldown > 0) return;
    
    setState(() {
      _isSending = true;
    });
    
    final result = await SendCredentialsService.sendWithChecks(
      widget.email,
      widget.tradingId,
      widget.password,
    );
    
    setState(() {
      _isSending = false;
    });
    
    if (result['success']) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✅ Credentials sent successfully!'),
          backgroundColor: Colors.green,
        ),
      );
      
      // Start 5-second cooldown
      _startCooldown(5);
      
    } else {
      final retryAfter = result['retryAfter'];
      
      if (retryAfter != null) {
        _startCooldown(retryAfter);
      }
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ ${result['error'] ?? 'Failed to send'}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  void _startCooldown(int seconds) {
    setState(() {
      _cooldown = seconds;
    });
    
    Timer.periodic(Duration(seconds: 1), (timer) {
      if (_cooldown > 0) {
        setState(() {
          _cooldown--;
        });
      } else {
        timer.cancel();
      }
    });
  }
  
  @override
  Widget build(BuildContext context) {
    final isDisabled = _isSending || _cooldown > 0;
    
    return ElevatedButton(
      onPressed: isDisabled ? null : _handleSend,
      child: _isSending
        ? CircularProgressIndicator(color: Colors.white)
        : Text(_cooldown > 0 ? 'Wait ${_cooldown}s' : 'Send Credentials'),
    );
  }
}
```

---

## 🧪 Testing Guide

### Test 1: Single Request
```bash
# Should work fine
curl -X POST http://localhost:3000/http/trading-credentials \
  -H "Content-Type: application/json" \
  -d '{"emailID":"test@example.com","tradingID":"TEST123","tradingPassword":"Pass123456"}'
```

### Test 2: Duplicate Request (Should Get 429)
```bash
# Run this twice quickly (< 5 seconds apart)
curl -X POST http://localhost:3000/http/trading-credentials \
  -H "Content-Type: application/json" \
  -d '{"emailID":"test@example.com","tradingID":"TEST123","tradingPassword":"Pass123456"}'
```

**Expected:** Second request gets 429 with `retryAfter` field

### Test 3: Check Can Send
```bash
# Check if you can send
curl http://localhost:3000/http/trading-credentials/can-send/test@example.com/TEST123
```

**Expected:** `{"canSend": false, "retryAfter": X}` if within cooldown

---

## 📊 Error Response Reference

### 429 - Duplicate Request
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Please wait 3 seconds before requesting credentials again",
  "retryAfter": 3,
  "details": "Duplicate request detected within cooldown period"
}
```

### 429 - Rate Limit
```json
{
  "success": false,
  "error": "Email service rate limit",
  "message": "Too many emails sent recently. Please try again in a few minutes.",
  "retryAfter": 60,
  "details": "Rate limit exceeded. Max retries reached."
}
```

---

## ✅ Checklist for Mobile App Team

- [ ] Add `_isSending` state to prevent double-clicks
- [ ] Disable button while request is in progress
- [ ] Handle 429 status code properly
- [ ] Show `retryAfter` countdown to user
- [ ] Implement cooldown timer UI
- [ ] Use `can-send` endpoint before sending (optional but recommended)
- [ ] Add proper error messages to user
- [ ] Remove any aggressive retry logic
- [ ] Test with rapid button clicks
- [ ] Test with poor network conditions

---

## 🚀 Quick Fix (Minimum Required)

**If you only have time for one fix, do this:**

```dart
bool _isSending = false;

Future<void> sendCredentials() async {
  if (_isSending) return; // ← Add this line
  
  setState(() { _isSending = true; });
  
  // ... your existing code ...
  
  setState(() { _isSending = false; });
}

// In your button
ElevatedButton(
  onPressed: _isSending ? null : sendCredentials, // ← Disable when sending
  child: Text('Send'),
)
```

This alone will prevent most 429 errors!

---

## 📞 Need Help?

1. Check server logs for detailed error messages
2. Test with Postman first to verify server is working
3. Add debug prints to see how many requests are being made
4. Monitor network tab in Flutter DevTools

---

**Summary:** The server now protects against rapid requests. Update your mobile app to:
1. Disable button while sending
2. Handle 429 errors with proper waiting
3. Show cooldown timer to users

