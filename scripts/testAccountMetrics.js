import { Logger } from '../utils/logger.js';
import accountMetricsService from '../services/accountMetricsService.js';
import priceCacheService from '../services/priceCacheService.js';

const logger = new Logger('TestAccountMetrics');

/**
 * Test script for account metrics service
 */
async function testAccountMetrics() {
  try {
    logger.info('Starting account metrics test');

    // Test 1: Start the service
    logger.info('=== Test 1: Starting account metrics service ===');
    accountMetricsService.start();
    
    // Wait a bit to see the service running
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Check service status
    logger.info('=== Test 2: Checking service status ===');
    const status = accountMetricsService.getStatus();
    logger.info('Service status:', JSON.stringify(status, null, 2));

    // Test 3: Add some test prices to cache
    logger.info('=== Test 3: Adding test prices to cache ===');
    priceCacheService.updatePrice('forex', 'EURUSD', 1.0850, { bid: 1.0848, ask: 1.0852 });
    priceCacheService.updatePrice('forex', 'GBPUSD', 1.2650, { bid: 1.2648, ask: 1.2652 });
    priceCacheService.updatePrice('crypto', 'BTCUSD', 65000.00, { bid: 64980, ask: 65020 });
    
    logger.info('Added test prices to cache');

    // Test 4: Trigger manual update
    logger.info('=== Test 4: Triggering manual update ===');
    await accountMetricsService.triggerUpdate();
    logger.info('Manual update triggered');

    // Test 5: Get all accounts metrics
    logger.info('=== Test 5: Getting all accounts metrics ===');
    try {
      const allMetrics = await accountMetricsService.getAllAccountsMetrics();
      logger.info(`Found metrics for ${allMetrics.length} accounts`);
      
      if (allMetrics.length > 0) {
        logger.info('Sample account metrics:', JSON.stringify(allMetrics[0], null, 2));
      }
    } catch (error) {
      logger.info(`No accounts found or error getting metrics: ${error.message}`);
    }

    // Test 6: Test margin sufficiency check
    logger.info('=== Test 6: Testing margin sufficiency check ===');
    try {
      // Use a test account UID (replace with actual UID if available)
      const testAccountUid = '12345678';
      const marginCheck = await accountMetricsService.checkMarginSufficiency(testAccountUid, 1000);
      logger.info('Margin sufficiency check result:', JSON.stringify(marginCheck, null, 2));
    } catch (error) {
      logger.info(`Margin sufficiency check failed (expected without test account): ${error.message}`);
    }

    // Test 7: Update interval
    logger.info('=== Test 7: Testing update interval change ===');
    accountMetricsService.setUpdateInterval(2000); // Change to 2 seconds
    logger.info('Updated interval to 2 seconds');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 8: Stop the service
    logger.info('=== Test 8: Stopping account metrics service ===');
    accountMetricsService.stop();
    
    // Test 9: Check final status
    logger.info('=== Test 9: Final status check ===');
    const finalStatus = accountMetricsService.getStatus();
    logger.info('Final service status:', JSON.stringify(finalStatus, null, 2));

    logger.info('Account metrics test completed successfully');

  } catch (error) {
    logger.error('Error during account metrics test:', error);
  }
}

/**
 * Test specific account metrics
 */
async function testSpecificAccount(accountUid) {
  try {
    logger.info(`=== Testing specific account: ${accountUid} ===`);

    // Start service
    accountMetricsService.start();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get metrics summary for specific account
    const summary = await accountMetricsService.getAccountMetricsSummary(accountUid);
    logger.info('Account metrics summary:', JSON.stringify(summary, null, 2));

    // Check margin sufficiency
    const marginCheck = await accountMetricsService.checkMarginSufficiency(accountUid, 1000);
    logger.info('Margin sufficiency check:', JSON.stringify(marginCheck, null, 2));

    // Stop service
    accountMetricsService.stop();

  } catch (error) {
    logger.error(`Error testing specific account ${accountUid}:`, error);
  }
}

/**
 * Test position metrics calculation
 */
async function testPositionMetrics() {
  try {
    logger.info('=== Testing position metrics calculation ===');

    // Mock position data
    const mockPosition = {
      id: 1,
      accountId: '12345678',
      instrumentId: 1,
      positionType: 'buy',
      lotSize: 0.1,
      entryPrice: 1.0800,
      marginUsed: 108.00
    };

    // Add test price to cache
    priceCacheService.updatePrice('forex', 'EURUSD', 1.0850, { bid: 1.0848, ask: 1.0852 });

    // Start service
    accountMetricsService.start();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test position metrics calculation
    const positionMetrics = await accountMetricsService.calculatePositionMetrics(mockPosition);
    logger.info('Position metrics:', JSON.stringify(positionMetrics, null, 2));

    // Stop service
    accountMetricsService.stop();

  } catch (error) {
    logger.error('Error testing position metrics:', error);
  }
}

// Main execution
async function main() {
  const testType = process.argv[2] || 'basic';
  const accountUid = process.argv[3];

  switch (testType) {
    case 'basic':
      await testAccountMetrics();
      break;
    case 'account':
      if (!accountUid) {
        logger.error('Please provide account UID for account-specific test');
        process.exit(1);
      }
      await testSpecificAccount(accountUid);
      break;
    case 'position':
      await testPositionMetrics();
      break;
    case 'all':
      await testAccountMetrics();
      if (accountUid) {
        await testSpecificAccount(accountUid);
      }
      await testPositionMetrics();
      break;
    default:
      logger.info('Usage: node testAccountMetrics.js [basic|account|position|all] [accountUid]');
      logger.info('Default: basic');
      await testAccountMetrics();
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logger.error('Test failed:', error);
    process.exit(1);
  });
}

export { testAccountMetrics, testSpecificAccount, testPositionMetrics };
