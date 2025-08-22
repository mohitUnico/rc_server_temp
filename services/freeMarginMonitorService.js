import { Logger } from '../utils/logger.js';
import TradingAccountRepository from '../repositories/TradingAccountRepository.js';
import PositionRepository from '../repositories/PositionRepository.js';
import priceCacheService from './priceCacheService.js';

const logger = new Logger('FreeMarginMonitorService');
const tradingAccountRepository = new TradingAccountRepository();
const positionRepository = new PositionRepository();

/**
 * Service for monitoring free margin and automatically closing positions when free margin reaches 0
 */
class FreeMarginMonitorService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
    this.checkIntervalMs = 5000; // Check every 5 seconds
    this.marginThreshold = 0; // Close positions when free margin reaches 0
  }

  /**
   * Start the free margin monitoring service
   */
  start() {
    if (this.isRunning) {
      logger.warn('Free margin monitor service is already running');
      return;
    }

    logger.info('Starting free margin monitor service');
    this.isRunning = true;
    this.checkInterval = setInterval(() => {
      this.checkFreeMargin();
    }, this.checkIntervalMs);
  }

  /**
   * Stop the free margin monitoring service
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Free margin monitor service is not running');
      return;
    }

    logger.info('Stopping free margin monitor service');
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check free margin for all trading accounts
   */
  async checkFreeMargin() {
    try {
      // Get all active trading accounts
      const tradingAccounts = await this.getAllActiveTradingAccounts();
      
      if (tradingAccounts.length === 0) {
        return; // No active trading accounts to check
      }

      logger.debug(`Checking free margin for ${tradingAccounts.length} trading accounts`);

      // Process each trading account
      for (const account of tradingAccounts) {
        await this.checkAccountFreeMargin(account);
      }
    } catch (error) {
      logger.error('Error checking free margin:', error);
    }
  }

  /**
   * Get all active trading accounts
   */
  async getAllActiveTradingAccounts() {
    try {
      // Get all trading accounts with active status
      const accounts = await tradingAccountRepository.findAll({ status: 'active' });
      return accounts.map(account => {
        // Create a simple object with the required properties
        return {
          id: account.id,
          accountUid: account.account_uid,
          freeMargin: account.free_margin || 0,
          balance: account.balance || 0,
          equity: account.equity || 0,
          margin: account.margin || 0,
          status: account.status
        };
      });
    } catch (error) {
      logger.error('Error getting active trading accounts:', error);
      return [];
    }
  }

  /**
   * Check free margin for a specific trading account
   */
  async checkAccountFreeMargin(account) {
    try {
      logger.debug(`Checking free margin for account ${account.accountUid}: ${account.freeMargin}`);

      // Check if free margin is at or below threshold
      if (account.freeMargin <= this.marginThreshold) {
        logger.warn(`Free margin threshold reached for account ${account.accountUid}: ${account.freeMargin}`);
        await this.closeAllPositionsForAccount(account);
      }
    } catch (error) {
      logger.error(`Error checking free margin for account ${account.accountUid}:`, error);
    }
  }

  /**
   * Close all open positions for a trading account
   */
  async closeAllPositionsForAccount(account) {
    try {
      logger.info(`Closing all positions for account ${account.accountUid} due to low free margin`);

      // Get all open positions for this account
      const openPositions = await positionRepository.findOpenPositionsByAccountId(account.accountUid);
      
      if (openPositions.length === 0) {
        logger.info(`No open positions found for account ${account.accountUid}`);
        // Set free margin to threshold value
        await this.updateAccountFreeMargin(account.accountUid, this.marginThreshold);
        return;
      }

      logger.info(`Found ${openPositions.length} open positions to close for account ${account.accountUid}`);

      // Close each position with current market price
      for (const position of openPositions) {
        await this.closePositionAtMarketPrice(position);
      }

      // After closing positions, set free margin to threshold value
      await this.updateAccountFreeMargin(account.accountUid, this.marginThreshold);

      logger.info(`Successfully closed all positions for account ${account.accountUid}`);
    } catch (error) {
      logger.error(`Error closing positions for account ${account.accountUid}:`, error);
    }
  }

  /**
   * Close a position at current market price
   */
  async closePositionAtMarketPrice(position) {
    try {
      // Get current price for the instrument
      const currentPrice = await priceCacheService.getCurrentPriceByInstrumentId(position.instrumentId);
      
      if (!currentPrice) {
        logger.warn(`Could not get current price for instrument ${position.instrumentId}, using entry price as fallback`);
        // Use entry price as fallback if current price is not available
        await positionRepository.closePosition({
          positionId: position.id,
          exitPrice: position.entryPrice,
          pnl: 0 // No PnL if we can't get current price
        });
        return;
      }

      logger.info(`Closing position ${position.id} at market price ${currentPrice}`);

      // Close the position at current market price
      await positionRepository.closePosition({
        positionId: position.id,
        exitPrice: currentPrice
        // PnL will be calculated automatically in the repository
      });

      logger.info(`Successfully closed position ${position.id} at price ${currentPrice}`);
    } catch (error) {
      logger.error(`Error closing position ${position.id}:`, error);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkIntervalMs: this.checkIntervalMs,
      marginThreshold: this.marginThreshold
    };
  }

  /**
   * Update check interval
   */
  setCheckInterval(intervalMs) {
    this.checkIntervalMs = intervalMs;
    if (this.isRunning) {
      // Restart the service with new interval
      this.stop();
      this.start();
    }
  }

  /**
   * Update margin threshold
   */
  setMarginThreshold(threshold) {
    this.marginThreshold = threshold;
    logger.info(`Updated margin threshold to: ${threshold}`);
  }

  /**
   * Update account free margin in database
   */
  async updateAccountFreeMargin(accountUid, newFreeMargin) {
    try {
      logger.info(`Updating free margin for account ${accountUid} to ${newFreeMargin}`);
      
      await tradingAccountRepository.updateFreeMargin({ 
        accountUid, 
        freeMargin: newFreeMargin 
      });
      
      logger.info(`Successfully updated free margin for account ${accountUid}`);
    } catch (error) {
      logger.error(`Error updating free margin for account ${accountUid}:`, error);
    }
  }
}

// Create singleton instance
const freeMarginMonitorService = new FreeMarginMonitorService();

export default freeMarginMonitorService;
