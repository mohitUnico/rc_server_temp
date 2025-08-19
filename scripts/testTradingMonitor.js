import { Logger } from '../utils/logger.js';
import positionCheckService from '../services/positionCheckService.js';
import pendingOrderService from '../services/pendingOrderService.js';

const logger = new Logger('TestTradingMonitor');

/**
 * Test script for trading monitor services
 */
async function testTradingMonitor() {
  try {
    logger.info('Starting trading monitor test');

    // Test 1: Start both services
    logger.info('=== Test 1: Starting position check and pending order services ===');
    positionCheckService.start();
    pendingOrderService.start();
    
    // Wait a bit to see the services running
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Check service status
    logger.info('=== Test 2: Checking service status ===');
    const positionStatus = positionCheckService.getStatus();
    const orderStatus = pendingOrderService.getStatus();
    logger.info('Position check service status:', JSON.stringify(positionStatus, null, 2));
    logger.info('Pending order service status:', JSON.stringify(orderStatus, null, 2));

    // Test 3: Test manual triggers
    logger.info('=== Test 3: Testing manual triggers ===');
    await positionCheckService.checkPositions();
    await pendingOrderService.triggerCheck();

    // Test 4: Test account-specific checks
    logger.info('=== Test 4: Testing account-specific checks ===');
    const testAccountId = '12345'; // Replace with actual account ID for testing
    await positionCheckService.checkPositionsForAccount(testAccountId);
    await pendingOrderService.checkPendingOrdersForAccount(testAccountId);

    // Test 5: Test instrument-specific checks
    logger.info('=== Test 5: Testing instrument-specific checks ===');
    const testInstrumentId = 1; // Replace with actual instrument ID for testing
    await pendingOrderService.checkPendingOrdersForInstrument(testAccountId, testInstrumentId);

    // Test 6: Update check intervals
    logger.info('=== Test 6: Updating check intervals ===');
    positionCheckService.setCheckInterval(500); // Change to 0.5 seconds
    pendingOrderService.setCheckInterval(500); // Change to 0.5 seconds
    logger.info('Updated check intervals to 500ms');

    // Wait a bit more to see the updated interval in action
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 7: Stop the services
    logger.info('=== Test 7: Stopping services ===');
    positionCheckService.stop();
    pendingOrderService.stop();
    
    // Test 8: Check final status
    logger.info('=== Test 8: Final status check ===');
    const finalPositionStatus = positionCheckService.getStatus();
    const finalOrderStatus = pendingOrderService.getStatus();
    logger.info('Final position service status:', JSON.stringify(finalPositionStatus, null, 2));
    logger.info('Final order service status:', JSON.stringify(finalOrderStatus, null, 2));

    logger.info('Trading monitor test completed successfully');

  } catch (error) {
    logger.error('Error during trading monitor test:', error);
  }
}

/**
 * Test individual services separately
 */
async function testIndividualServices() {
  try {
    logger.info('=== Testing Individual Services ===');

    // Test position check service
    logger.info('Starting position check service...');
    positionCheckService.start();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info('Position check service status:', positionCheckService.getStatus());
    
    // Test pending order service
    logger.info('Starting pending order service...');
    pendingOrderService.start();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info('Pending order service status:', pendingOrderService.getStatus());

    // Stop individual services
    logger.info('Stopping individual services...');
    positionCheckService.stop();
    pendingOrderService.stop();

    logger.info('Individual services test completed');

  } catch (error) {
    logger.error('Error during individual services test:', error);
  }
}

/**
 * Test service with custom intervals
 */
async function testCustomIntervals() {
  try {
    logger.info('=== Testing Custom Intervals ===');

    // Start with 1 second interval
    positionCheckService.setCheckInterval(1000);
    pendingOrderService.setCheckInterval(1000);
    positionCheckService.start();
    pendingOrderService.start();
    
    logger.info('Started with 1 second interval');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Change to 0.2 seconds
    positionCheckService.setCheckInterval(200);
    pendingOrderService.setCheckInterval(200);
    logger.info('Changed to 0.2 second interval');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Change to 0.05 seconds (50ms)
    positionCheckService.setCheckInterval(50);
    pendingOrderService.setCheckInterval(50);
    logger.info('Changed to 0.05 second interval');
    await new Promise(resolve => setTimeout(resolve, 2000));

    positionCheckService.stop();
    pendingOrderService.stop();
    logger.info('Custom intervals test completed');

  } catch (error) {
    logger.error('Error during custom intervals test:', error);
  }
}

// Main execution
async function main() {
  const testType = process.argv[2] || 'combined';

  switch (testType) {
    case 'combined':
      await testTradingMonitor();
      break;
    case 'individual':
      await testIndividualServices();
      break;
    case 'intervals':
      await testCustomIntervals();
      break;
    case 'all':
      await testTradingMonitor();
      await testIndividualServices();
      await testCustomIntervals();
      break;
    default:
      logger.info('Usage: node testTradingMonitor.js [combined|individual|intervals|all]');
      logger.info('Default: combined');
      await testTradingMonitor();
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logger.error('Test failed:', error);
    process.exit(1);
  });
}

export { testTradingMonitor, testIndividualServices, testCustomIntervals };
