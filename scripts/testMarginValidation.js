/**
 * Test script for margin validation
 * This script tests the new comprehensive margin validation for market orders
 */

import fetch from 'node-fetch';
import { Logger } from '../utils/logger.js';

const logger = new Logger('MarginValidationTest');
const BASE_URL = 'http://localhost:3000'; // Adjust if your server runs on different port

/**
 * Test margin validation with insufficient margin
 */
async function testInsufficientMargin() {
  logger.info('Testing margin validation with insufficient margin...');
  
  try {
    const response = await fetch(`${BASE_URL}/orders/market`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: 'test-account-1', // Use an account with low free margin
        instrumentId: 1, // EURUSD
        side: 'buy',
        lotSize: 10.0, // Large lot size to exceed available margin
        sl: 1.0500,
        tp: 1.0600
      })
    });

    const result = await response.json();
    
    if (response.status === 400 && result.error === 'Insufficient free margin for this order') {
      logger.info('✅ Insufficient margin test passed - order correctly rejected');
      logger.info('Response details:', result.details);
    } else {
      logger.error('❌ Insufficient margin test failed - unexpected response');
      logger.error('Status:', response.status);
      logger.error('Response:', result);
    }
  } catch (error) {
    logger.error('Error testing insufficient margin:', error);
  }
}

/**
 * Test margin validation with sufficient margin
 */
async function testSufficientMargin() {
  logger.info('Testing margin validation with sufficient margin...');
  
  try {
    const response = await fetch(`${BASE_URL}/orders/market`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: 'test-account-2', // Use an account with sufficient free margin
        instrumentId: 1, // EURUSD
        side: 'buy',
        lotSize: 0.01, // Small lot size that should fit within available margin
        sl: 1.0500,
        tp: 1.0600
      })
    });

    const result = await response.json();
    
    if (response.status === 201) {
      logger.info('✅ Sufficient margin test passed - order successfully placed');
      logger.info('Order details:', {
        orderId: result.order?.id,
        executedPrice: result.executedPrice,
        marginUsed: result.position?.marginUsed
      });
    } else {
      logger.error('❌ Sufficient margin test failed - unexpected response');
      logger.error('Status:', response.status);
      logger.error('Response:', result);
    }
  } catch (error) {
    logger.error('Error testing sufficient margin:', error);
  }
}

/**
 * Test margin calculation details
 */
async function testMarginCalculation() {
  logger.info('Testing margin calculation details...');
  
  try {
    // First, get current price
    const priceResponse = await fetch(`${BASE_URL}/instruments/1/price`);
    const priceData = await priceResponse.json();
    
    logger.info('Current price for instrument 1:', priceData.currentPrice);
    
    // Test with a specific lot size and calculate expected margin
    const lotSize = 0.1;
    const currentPrice = priceData.currentPrice;
    const leverage = 100; // Default leverage
    const contractSize = 100000; // Default for forex
    
    const notionalValue = lotSize * contractSize * currentPrice;
    const expectedMargin = notionalValue / leverage;
    
    logger.info('Margin calculation test:');
    logger.info(`- Lot size: ${lotSize}`);
    logger.info(`- Current price: ${currentPrice}`);
    logger.info(`- Leverage: ${leverage}`);
    logger.info(`- Contract size: ${contractSize}`);
    logger.info(`- Notional value: ${notionalValue.toFixed(2)}`);
    logger.info(`- Expected required margin: ${expectedMargin.toFixed(2)}`);
    
  } catch (error) {
    logger.error('Error testing margin calculation:', error);
  }
}

/**
 * Main test function
 */
async function runTests() {
  logger.info('Starting margin validation tests...');
  
  // Test margin calculation first
  await testMarginCalculation();
  
  // Test insufficient margin
  await testInsufficientMargin();
  
  // Test sufficient margin
  await testSufficientMargin();
  
  logger.info('Margin validation tests completed!');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    logger.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { runTests, testInsufficientMargin, testSufficientMargin, testMarginCalculation };
