import fetch from 'node-fetch';
import { Logger } from '../utils/logger.js';

const logger = new Logger('MarketOrderTest');

const BASE_URL = 'http://localhost:3000'; // Adjust if your server runs on a different port

async function testMarketOrder() {
  try {
    logger.info('Testing Market Order Placement...');
    
    // Test 1: Place market order without price (should fetch automatically)
    const marketOrderData = {
      accountId: 1,
      instrumentId: 1, // EURUSD
      side: 'buy',
      lotSize: 0.1
    };
    
    logger.info('Placing market order without price...');
    logger.info('Order data:', JSON.stringify(marketOrderData, null, 2));
    
    const response = await fetch(`${BASE_URL}/orders/market`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(marketOrderData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      logger.info('✅ Market order placed successfully!');
      logger.info('Response:', JSON.stringify(result, null, 2));
    } else {
      logger.error('❌ Market order failed:');
      logger.error('Status:', response.status);
      logger.error('Response:', JSON.stringify(result, null, 2));
    }
    
    // Test 2: Get current price for an instrument
    logger.info('\n=== Testing Get Current Price ===');
    const priceResponse = await fetch(`${BASE_URL}/instruments/1/price`);
    const priceResult = await priceResponse.json();
    
    if (priceResponse.ok) {
      logger.info('✅ Current price fetched successfully!');
      logger.info('Price response:', JSON.stringify(priceResult, null, 2));
    } else {
      logger.error('❌ Price fetch failed:');
      logger.error('Status:', priceResponse.status);
      logger.error('Response:', JSON.stringify(priceResult, null, 2));
    }
    
  } catch (error) {
    logger.error('Test failed:', error);
  }
}

// Run the test
testMarketOrder();
