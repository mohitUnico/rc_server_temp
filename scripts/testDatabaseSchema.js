import { Logger } from '../utils/logger.js';
import TradingAccountRepository from '../repositories/TradingAccountRepository.js';

const logger = new Logger('TestDatabaseSchema');

/**
 * Test script to verify database schema fixes
 */
async function testDatabaseSchema() {
  try {
    logger.info('Starting database schema test');

    const tradingAccountRepository = new TradingAccountRepository();

    // Test 1: Find active trading accounts
    logger.info('=== Test 1: Finding active trading accounts ===');
    try {
      const activeAccounts = await tradingAccountRepository.findActiveTradingAccounts();
      logger.info(`Found ${activeAccounts.length} active trading accounts`);
      
      if (activeAccounts.length > 0) {
        const sampleAccount = activeAccounts[0];
        logger.info('Sample account data:', {
          accountUid: sampleAccount.accountUid,
          balance: sampleAccount.balance,
          equity: sampleAccount.equity,
          margin: sampleAccount.margin,
          freeMargin: sampleAccount.freeMargin,
          status: sampleAccount.status,
          leverage: sampleAccount.leverage
        });
      }
    } catch (error) {
      logger.error('Error finding active accounts:', error.message);
    }

    // Test 2: Find trading accounts by status
    logger.info('=== Test 2: Finding trading accounts by status ===');
    try {
      const activeAccounts = await tradingAccountRepository.findTradingAccountsByStatus('active');
      logger.info(`Found ${activeAccounts.length} accounts with 'active' status`);
    } catch (error) {
      logger.error('Error finding accounts by status:', error.message);
    }

    // Test 3: Test account creation (if needed)
    logger.info('=== Test 3: Testing account creation ===');
    try {
      // This would create a test account - uncomment if needed
      // const testAccount = await tradingAccountRepository.createTradingAccount({
      //   userId: 'test-user-id',
      //   email: 'test@example.com'
      // });
      // logger.info('Test account created:', testAccount.accountUid);
      logger.info('Account creation test skipped (commented out)');
    } catch (error) {
      logger.error('Error creating test account:', error.message);
    }

    logger.info('Database schema test completed');

  } catch (error) {
    logger.error('Error during database schema test:', error);
  }
}

// Main execution
async function main() {
  await testDatabaseSchema();
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logger.error('Test failed:', error);
    process.exit(1);
  });
}

export { testDatabaseSchema };
