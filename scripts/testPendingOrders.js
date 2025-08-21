import fetch from 'node-fetch';
import { Logger } from '../utils/logger.js';

const logger = new Logger('PendingOrderTest');

const BASE_URL = 'http://localhost:3000'; // Adjust if your server runs on a different port

async function testPendingOrders() {
  try {
    logger.info('Testing Pending Order Placement...');
    
    // Test 1: Place limit order without price (should be pending)
    const limitOrderData = {
      accountId: 1,
      instrumentId: 1, // EURUSD
      orderType: 'buyLimit',
      lotSize: 0.1,
      limitValue: 1.1600, // Limit price
      sl: 1.1550,
      tp: 1.1650
    };
    
    logger.info('Placing limit order without price...');
    logger.info('Order data:', JSON.stringify(limitOrderData, null, 2));
    
    const limitResponse = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(limitOrderData)
    });
    
    const limitResult = await limitResponse.json();
    
    if (limitResponse.ok) {
      logger.info('✅ Limit order placed successfully!');
      logger.info('Response:', JSON.stringify(limitResult, null, 2));
    } else {
      logger.error('❌ Limit order failed:');
      logger.error('Status:', limitResponse.status);
      logger.error('Response:', JSON.stringify(limitResult, null, 2));
    }
    
    // Test 2: Place market order (should execute immediately with auto price)
    const marketOrderData = {
      accountId: 1,
      instrumentId: 1, // EURUSD
      orderType: 'marketBuy',
      lotSize: 0.05
    };
    
    logger.info('\n=== Testing Market Order ===');
    logger.info('Placing market order without price...');
    logger.info('Order data:', JSON.stringify(marketOrderData, null, 2));
    
    const marketResponse = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(marketOrderData)
    });
    
    const marketResult = await marketResponse.json();
    
    if (marketResponse.ok) {
      logger.info('✅ Market order executed successfully!');
      logger.info('Response:', JSON.stringify(marketResult, null, 2));
    } else {
      logger.error('❌ Market order failed:');
      logger.error('Status:', marketResponse.status);
      logger.error('Response:', JSON.stringify(marketResult, null, 2));
    }
    
    // Test 3: Place stop order without price (should be pending)
    const stopOrderData = {
      accountId: 1,
      instrumentId: 1, // EURUSD
      orderType: 'buyStop',
      lotSize: 0.1,
      limitValue: 1.1750, // Stop price
      sl: 1.1700,
      tp: 1.1800
    };
    
    logger.info('\n=== Testing Stop Order ===');
    logger.info('Placing stop order without price...');
    logger.info('Order data:', JSON.stringify(stopOrderData, null, 2));
    
    const stopResponse = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stopOrderData)
    });
    
    const stopResult = await stopResponse.json();
    
    if (stopResponse.ok) {
      logger.info('✅ Stop order placed successfully!');
      logger.info('Response:', JSON.stringify(stopResult, null, 2));
    } else {
      logger.error('❌ Stop order failed:');
      logger.error('Status:', stopResponse.status);
      logger.error('Response:', JSON.stringify(stopResult, null, 2));
    }
    
  } catch (error) {
    logger.error('Test failed:', error);
  }
}

// Run the test
testPendingOrders();

