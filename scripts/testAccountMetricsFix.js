import { Logger } from '../utils/logger.js';
import accountMetricsService from '../services/accountMetricsService.js';
import priceCacheService from '../services/priceCacheService.js';

const logger = new Logger('TestAccountMetricsFix');

/**
 * Test script to verify AccountMetricsService fix
 */
async function testAccountMetricsFix() {
  try {
    logger.info('Starting AccountMetricsService fix test');

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

    // Test 4: Trigger manual update (this should work without errors now)
    logger.info('=== Test 4: Triggering manual update ===');
    try {
      await accountMetricsService.triggerUpdate();
      logger.info('✅ Manual update triggered successfully - no errors!');
    } catch (error) {
      logger.error('❌ Manual update failed:', error.message);
    }

    // Test 5: Get all accounts metrics
    logger.info('=== Test 5: Getting all accounts metrics ===');
    try {
      const allMetrics = await accountMetricsService.getAllAccountsMetrics();
      logger.info(`✅ Found metrics for ${allMetrics.length} accounts`);
      
      if (allMetrics.length > 0) {
        logger.info('Sample account metrics:', JSON.stringify(allMetrics[0], null, 2));
      }
    } catch (error) {
      logger.error('❌ Error getting all accounts metrics:', error.message);
    }

    // Test 6: Stop the service
    logger.info('=== Test 6: Stopping account metrics service ===');
    accountMetricsService.stop();
    
    // Test 7: Check final status
    logger.info('=== Test 7: Final status check ===');
    const finalStatus = accountMetricsService.getStatus();
    logger.info('Final service status:', JSON.stringify(finalStatus, null, 2));

    logger.info('✅ AccountMetricsService fix test completed successfully');

  } catch (error) {
    logger.error('❌ Error during AccountMetricsService fix test:', error);
  }
}

// Main execution
async function main() {
  await testAccountMetricsFix();
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logger.error('Test failed:', error);
    process.exit(1);
  });
}

export { testAccountMetricsFix };
