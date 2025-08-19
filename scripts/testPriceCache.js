import { Logger } from '../utils/logger.js';
import priceCacheService from '../services/priceCacheService.js';

const logger = new Logger('TestPriceCache');

/**
 * Test script for price cache service
 */
async function testPriceCache() {
  try {
    logger.info('Starting price cache test');

    // Test 1: Update prices
    logger.info('=== Test 1: Updating prices ===');
    priceCacheService.updatePrice('forex', 'EURUSD', 1.0850, { bid: 1.0848, ask: 1.0852 });
    priceCacheService.updatePrice('forex', 'GBPUSD', 1.2650, { bid: 1.2648, ask: 1.2652 });
    priceCacheService.updatePrice('crypto', 'BTCUSD', 65000.00, { bid: 64980, ask: 65020 });
    priceCacheService.updatePrice('crypto', 'ETHUSD', 3500.00, { bid: 3498, ask: 3502 });
    priceCacheService.updatePrice('indices', 'SPX500', 4500.00, { bid: 4498, ask: 4502 });

    // Test 2: Get current prices
    logger.info('=== Test 2: Getting current prices ===');
    const eurusdPrice = priceCacheService.getCurrentPrice('forex', 'EURUSD');
    const btcPrice = priceCacheService.getCurrentPrice('crypto', 'BTCUSD');
    const spxPrice = priceCacheService.getCurrentPrice('indices', 'SPX500');
    
    logger.info(`EURUSD price: ${eurusdPrice}`);
    logger.info(`BTCUSD price: ${btcPrice}`);
    logger.info(`SPX500 price: ${spxPrice}`);

    // Test 3: Get all prices
    logger.info('=== Test 3: Getting all prices ===');
    const allPrices = priceCacheService.getAllPricesAllTypes();
    logger.info('All prices:', JSON.stringify(allPrices, null, 2));

    // Test 4: Check price validity
    logger.info('=== Test 4: Checking price validity ===');
    const eurusdValid = priceCacheService.hasValidPrice('forex', 'EURUSD');
    const invalidSymbol = priceCacheService.hasValidPrice('forex', 'INVALID');
    
    logger.info(`EURUSD valid: ${eurusdValid}`);
    logger.info(`INVALID symbol valid: ${invalidSymbol}`);

    // Test 5: Get cache statistics
    logger.info('=== Test 5: Cache statistics ===');
    const stats = priceCacheService.getCacheStats();
    logger.info('Cache stats:', JSON.stringify(stats, null, 2));

    // Test 6: Test stale price detection
    logger.info('=== Test 6: Testing stale price detection ===');
    
    // Add a stale price (simulate old timestamp)
    const stalePriceData = {
      price: 1.0000,
      timestamp: Date.now() - 10000, // 10 seconds old
      data: {}
    };
    priceCacheService.priceCache.forex.set('STALE', stalePriceData);
    
    const stalePrice = priceCacheService.getCurrentPrice('forex', 'STALE');
    logger.info(`Stale price result: ${stalePrice}`);

    // Test 7: Clear stale prices
    logger.info('=== Test 7: Clearing stale prices ===');
    const beforeClear = priceCacheService.getCacheStats();
    priceCacheService.clearStalePrices();
    const afterClear = priceCacheService.getCacheStats();
    
    logger.info(`Before clear: ${beforeClear.forex} forex prices`);
    logger.info(`After clear: ${afterClear.forex} forex prices`);

    // Test 8: Test instrument ID lookup (this will fail without actual database)
    logger.info('=== Test 8: Testing instrument ID lookup ===');
    try {
      const instrumentPrice = await priceCacheService.getCurrentPriceByInstrumentId(1);
      logger.info(`Instrument 1 price: ${instrumentPrice}`);
    } catch (error) {
      logger.info(`Instrument lookup failed (expected without database): ${error.message}`);
    }

    logger.info('Price cache test completed successfully');

  } catch (error) {
    logger.error('Error during price cache test:', error);
  }
}

// Main execution
async function main() {
  await testPriceCache();
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logger.error('Test failed:', error);
    process.exit(1);
  });
}

export { testPriceCache };
