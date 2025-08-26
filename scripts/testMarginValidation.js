/**
 * Test script for margin validation
 * This script tests the new free margin validation logic
 */

import { validateFreeMarginPositive } from '../validators/orderValidators.js';
import TradingAccountRepository from '../repositories/TradingAccountRepository.js';
import { OrderType } from '../enums/orderEnums.js';

const tradingAccountRepository = new TradingAccountRepository();

// Mock request and response objects for testing
function createMockRequest(body) {
  return { body };
}

function createMockResponse() {
  const res = {
    status: (code) => {
      res.statusCode = code;
      return res;
    },
    json: (data) => {
      res.data = data;
      return res;
    }
  };
  return res;
}

// Mock next function
function createMockNext() {
  return () => {
    console.log('✅ Validation passed - next() called');
  };
}

async function testMarginValidation() {
  console.log('🧪 Testing Margin Validation Logic\n');

  // Test 1: Market order with sufficient margin
  console.log('Test 1: Market order with sufficient margin');
  const req1 = createMockRequest({
    accountId: '12345678',
    instrumentId: 1,
    orderType: OrderType.MARKET_BUY,
    lotSize: 0.1 // 0.1 lot = 10,000 units
  });
  const res1 = createMockResponse();
  const next1 = createMockNext();

  try {
    await validateFreeMarginPositive(req1, res1, next1);
    if (res1.statusCode === 400) {
      console.log('❌ Test 1 failed:', res1.data);
    } else {
      console.log('✅ Test 1 passed');
    }
  } catch (error) {
    console.log('❌ Test 1 error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Market order with insufficient margin
  console.log('Test 2: Market order with insufficient margin');
  const req2 = createMockRequest({
    accountId: '12345678',
    instrumentId: 1,
    orderType: OrderType.MARKET_BUY,
    lotSize: 10 // 10 lots = 1,000,000 units (very large order)
  });
  const res2 = createMockResponse();
  const next2 = createMockNext();

  try {
    await validateFreeMarginPositive(req2, res2, next2);
    if (res2.statusCode === 400) {
      console.log('✅ Test 2 passed - correctly rejected insufficient margin');
      console.log('Details:', res2.data);
    } else {
      console.log('❌ Test 2 failed - should have rejected insufficient margin');
    }
  } catch (error) {
    console.log('❌ Test 2 error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Non-market order
  console.log('Test 3: Non-market order (limit order)');
  const req3 = createMockRequest({
    accountId: '12345678',
    instrumentId: 1,
    orderType: OrderType.LIMIT_BUY,
    lotSize: 0.1
  });
  const res3 = createMockResponse();
  const next3 = createMockNext();

  try {
    await validateFreeMarginPositive(req3, res3, next3);
    if (res3.statusCode === 400) {
      console.log('❌ Test 3 failed:', res3.data);
    } else {
      console.log('✅ Test 3 passed');
    }
  } catch (error) {
    console.log('❌ Test 3 error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Invalid account
  console.log('Test 4: Invalid account ID');
  const req4 = createMockRequest({
    accountId: 'invalid_account',
    instrumentId: 1,
    orderType: OrderType.MARKET_BUY,
    lotSize: 0.1
  });
  const res4 = createMockResponse();
  const next4 = createMockNext();

  try {
    await validateFreeMarginPositive(req4, res4, next4);
    if (res4.statusCode === 404) {
      console.log('✅ Test 4 passed - correctly rejected invalid account');
    } else {
      console.log('❌ Test 4 failed - should have rejected invalid account');
    }
  } catch (error) {
    console.log('❌ Test 4 error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Missing required fields
  console.log('Test 5: Missing required fields');
  const req5 = createMockRequest({
    accountId: '12345678'
    // Missing instrumentId, orderType, lotSize
  });
  const res5 = createMockResponse();
  const next5 = createMockNext();

  try {
    await validateFreeMarginPositive(req5, res5, next5);
    if (res5.statusCode === 400) {
      console.log('✅ Test 5 passed - correctly handled missing fields');
    } else {
      console.log('❌ Test 5 failed - should have handled missing fields');
    }
  } catch (error) {
    console.log('❌ Test 5 error:', error.message);
  }

  console.log('\n🎯 Margin validation tests completed!');
}

// Run the tests
testMarginValidation().catch(console.error);
