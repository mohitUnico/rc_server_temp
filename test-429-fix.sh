#!/bin/bash

# Test script for 429 error fix
# This tests the deduplication logic

BASE_URL="http://localhost:3000"
EMAIL="test@example.com"
TRADING_ID="TEST123"
PASSWORD="TestPass123"

echo "🧪 Testing 429 Error Fix"
echo "========================"
echo ""

# Test 1: Check can-send endpoint
echo "📋 Test 1: Check if we can send (should be true initially)"
curl -s "$BASE_URL/http/trading-credentials/can-send/$EMAIL/$TRADING_ID" | jq '.'
echo ""
echo ""

# Test 2: Send first request
echo "📧 Test 2: Sending first request (should succeed)"
RESPONSE1=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$BASE_URL/http/trading-credentials" \
  -H "Content-Type: application/json" \
  -d "{\"emailID\":\"$EMAIL\",\"tradingID\":\"$TRADING_ID\",\"tradingPassword\":\"$PASSWORD\"}")

HTTP_STATUS1=$(echo "$RESPONSE1" | grep "HTTP_STATUS" | cut -d: -f2)
BODY1=$(echo "$RESPONSE1" | sed -e 's/HTTP_STATUS:.*//g')

echo "Status Code: $HTTP_STATUS1"
echo "$BODY1" | jq '.'
echo ""
echo ""

# Test 3: Check can-send immediately after (should be false)
echo "📋 Test 3: Check can-send immediately after (should be false)"
curl -s "$BASE_URL/http/trading-credentials/can-send/$EMAIL/$TRADING_ID" | jq '.'
echo ""
echo ""

# Test 4: Send duplicate request immediately (should get 429)
echo "⚠️ Test 4: Sending duplicate request immediately (should get 429)"
RESPONSE2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$BASE_URL/http/trading-credentials" \
  -H "Content-Type: application/json" \
  -d "{\"emailID\":\"$EMAIL\",\"tradingID\":\"$TRADING_ID\",\"tradingPassword\":\"$PASSWORD\"}")

HTTP_STATUS2=$(echo "$RESPONSE2" | grep "HTTP_STATUS" | cut -d: -f2)
BODY2=$(echo "$RESPONSE2" | sed -e 's/HTTP_STATUS:.*//g')

echo "Status Code: $HTTP_STATUS2"
echo "$BODY2" | jq '.'
echo ""

# Analyze results
echo ""
echo "========================"
echo "📊 Test Results:"
echo "========================"

if [ "$HTTP_STATUS1" = "200" ]; then
  echo "✅ Test 2 PASSED: First request succeeded (200)"
else
  echo "❌ Test 2 FAILED: Expected 200, got $HTTP_STATUS1"
fi

if [ "$HTTP_STATUS2" = "429" ]; then
  echo "✅ Test 4 PASSED: Duplicate request blocked (429)"
else
  echo "❌ Test 4 FAILED: Expected 429, got $HTTP_STATUS2"
fi

echo ""
echo "⏳ Waiting 6 seconds for cooldown to expire..."
sleep 6
echo ""

# Test 5: Try again after cooldown
echo "📋 Test 5: Check can-send after cooldown (should be true again)"
curl -s "$BASE_URL/http/trading-credentials/can-send/$EMAIL/$TRADING_ID" | jq '.'
echo ""

echo ""
echo "========================"
echo "✅ Test Complete!"
echo "========================"
echo ""
echo "Summary:"
echo "- Deduplication is working if Test 4 returned 429"
echo "- Cooldown is working if Test 5 shows canSend: true"
echo ""
echo "📱 Mobile app should:"
echo "  1. Disable button after clicking"
echo "  2. Handle 429 errors with retryAfter"
echo "  3. Show cooldown timer to user"
echo ""
echo "📖 Read MOBILE_APP_429_FIX.md for complete guide"

