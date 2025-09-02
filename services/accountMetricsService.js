import { Logger } from '../utils/logger.js';
import priceCacheService from './priceCacheService.js';
import TradingAccountRepository from '../repositories/TradingAccountRepository.js';
import PositionRepository from '../repositories/PositionRepository.js';
import InstrumentRepository from '../repositories/InstrumentRepository.js';
import TradingAccount from '../models/TradingAccount.js';

const logger = new Logger('AccountMetricsService');
const tradingAccountRepository = new TradingAccountRepository();
const positionRepository = new PositionRepository();
const instrumentRepository = new InstrumentRepository();

/**
 * Service for calculating and updating trading account metrics
 * (equity, margin, free margin, margin level) based on open positions
 */
class AccountMetricsService {
  constructor() {
    this.isRunning = false;
    this.updateInterval = null;
    this.updateIntervalMs = 1000; // 1 second interval
  }

  /**
   * Start the account metrics update service
   */
  start() {
    if (this.isRunning) {
      logger.warn('Account metrics service is already running');
      return;
    }

    logger.info('Starting account metrics service');
    this.isRunning = true;
    this.updateInterval = setInterval(() => {
      this.updateAllAccountMetrics();
    }, this.updateIntervalMs);
  }

  /**
   * Stop the account metrics update service
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Account metrics service is not running');
      return;
    }

    logger.info('Stopping account metrics service');
    this.isRunning = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update metrics for all active trading accounts
   */
  async updateAllAccountMetrics() {
    try {
      // Get all active trading accounts
      const activeAccounts = await tradingAccountRepository.findActiveTradingAccounts();
      
      if (activeAccounts.length === 0) {
        return; // No active accounts to update
      }

      logger.debug(`Updating metrics for ${activeAccounts.length} active trading accounts`);

      // Update metrics for each account
      for (const account of activeAccounts) {
        await this.updateAccountMetrics(account.accountUid);
      }
    } catch (error) {
      logger.error('Error updating all account metrics:', error);
    }
  }

  /**
   * Update metrics for a specific trading account
   */
  async updateAccountMetrics(accountUid) {
    try {
      // Get the trading account
      const account = await tradingAccountRepository.findTradingAccountByUid(accountUid);
      if (!account) {
        logger.warn(`Trading account not found for UID: ${accountUid}`);
        return;
      }

      // Get all open positions for this account
      const openPositions = await positionRepository.findOpenPositionsByAccountId(accountUid);
      
      // Calculate account metrics
      const metrics = await this.calculateAccountMetrics(account, openPositions);
      
      // Update the account with new metrics
      await this.updateAccountWithMetrics(accountUid, metrics);
      
      logger.debug(`Updated metrics for account ${accountUid}: Equity=${metrics.equity}, Margin=${metrics.margin}, FreeMargin=${metrics.freeMargin}`);

    } catch (error) {
      logger.error(`Error updating metrics for account ${accountUid}:`, error);
    }
  }

  /**
   * Calculate account metrics based on balance and open positions
   */
  async calculateAccountMetrics(account, openPositions) {
    try {
      const balance = account.balance;
      let totalUnrealizedPnL = 0;
      let totalMarginUsed = 0;

      // Calculate unrealized P&L and margin for each open position
      for (const position of openPositions) {
        const positionMetrics = await this.calculatePositionMetrics(position);
        totalUnrealizedPnL += positionMetrics.unrealizedPnL;
        totalMarginUsed += positionMetrics.marginUsed;
      }

      // Calculate equity (balance + unrealized P&L)
      const equity = balance + totalUnrealizedPnL;

      // Calculate margin (total margin used by open positions)
      const margin = totalMarginUsed;

      // Calculate free margin (equity - margin)
      const freeMargin = equity - margin;

      // Calculate margin level percentage
      const marginLevel = margin > 0 ? (equity / margin) * 100 : 0;

      return {
        equity: Math.max(0, equity), // Ensure equity doesn't go negative
        margin: Math.max(0, margin),
        freeMargin: Math.max(0, freeMargin), // Ensure free margin doesn't go negative
        marginLevel: Math.max(0, marginLevel),
        totalUnrealizedPnL,
        totalMarginUsed
      };

    } catch (error) {
      logger.error('Error calculating account metrics:', error);
      // Return safe defaults
      return {
        equity: account.balance,
        margin: 0,
        freeMargin: account.balance,
        marginLevel: 0,
        totalUnrealizedPnL: 0,
        totalMarginUsed: 0
      };
    }
  }

  /**
   * Calculate metrics for a single position
   */
  async calculatePositionMetrics(position) {
    try {
      // Get current price for the instrument
      const currentPrice = await priceCacheService.getCurrentPriceByInstrumentId(position.instrumentId);
      
      if (!currentPrice) {
        logger.warn(`No current price available for instrument ${position.instrumentId}, using entry price`);
        // If no current price, use entry price (no unrealized P&L)
        return {
          unrealizedPnL: 0,
          marginUsed: position.marginUsed || 0
        };
      }

      // Get instrument details for contract size
      const instrument = await instrumentRepository.findInstrumentById(position.instrumentId);
      const contractSize = instrument?.contractSize || 100000; // Default contract size

      // Calculate unrealized P&L
      const priceDifference = currentPrice - position.entryPrice;
      const multiplier = position.positionType === 'buy' ? 1 : -1;
      const unrealizedPnL = priceDifference * multiplier * position.lotSize * contractSize;

      // Use the margin used from the position, or calculate if not available
      const marginUsed = position.marginUsed || this.calculateMarginUsed(position, position.entryPrice);

      return {
        unrealizedPnL,
        marginUsed
      };

    } catch (error) {
      logger.error(`Error calculating position metrics for position ${position.id}:`, error);
      return {
        unrealizedPnL: 0,
        marginUsed: position.marginUsed || 0
      };
    }
  }

  /**
   * Calculate margin used for a position
   */
  calculateMarginUsed(position, price) {
    try {
      // Simplified margin calculation: lot size * price * leverage factor
      // You should implement proper margin calculation based on your trading rules
      const leverageFactor = 0.01; // 1% margin requirement (adjust as needed)
      return position.lotSize * price * leverageFactor;
    } catch (error) {
      logger.error('Error calculating margin used:', error);
      return 0;
    }
  }

  /**
   * Update account with calculated metrics
   */
  async updateAccountWithMetrics(accountUid, metrics) {
    try {
      const updateData = {
        equity: metrics.equity,
        margin: metrics.margin,
        free_margin: metrics.freeMargin
      };

      const result = await tradingAccountRepository.updateByField('account_uid', accountUid, updateData);
      
      if (result) {
        logger.debug(`Successfully updated metrics for account ${accountUid}`);
        return TradingAccount.fromDatabase(result);
      } else {
        logger.warn(`Failed to update metrics for account ${accountUid}`);
        return null;
      }

    } catch (error) {
      logger.error(`Error updating account metrics for ${accountUid}:`, error);
      throw error;
    }
  }

  /**
   * Get account metrics summary
   */
  async getAccountMetricsSummary(accountUid) {
    try {
      const account = await tradingAccountRepository.findTradingAccountByUid(accountUid);
      if (!account) {
        throw new Error(`Trading account not found for UID: ${accountUid}`);
      }

      const openPositions = await positionRepository.findOpenPositionsByAccountId(accountUid);
      const metrics = await this.calculateAccountMetrics(account, openPositions);

      return {
        accountUid,
        balance: account.balance,
        equity: metrics.equity,
        margin: metrics.margin,
        freeMargin: metrics.freeMargin,
        marginLevel: metrics.marginLevel, // Calculated on-the-fly
        totalUnrealizedPnL: metrics.totalUnrealizedPnL,
        totalMarginUsed: metrics.totalMarginUsed,
        openPositionsCount: openPositions.length,
        currency: account.currency,
        leverage: account.leverage,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Error getting account metrics summary for ${accountUid}:`, error);
      throw error;
    }
  }

  /**
   * Get metrics for all accounts
   */
  async getAllAccountsMetrics() {
    try {
      const activeAccounts = await tradingAccountRepository.findActiveTradingAccounts();
      const summaries = [];

      for (const account of activeAccounts) {
        try {
          const summary = await this.getAccountMetricsSummary(account.accountUid);
          summaries.push(summary);
        } catch (error) {
          logger.error(`Error getting metrics for account ${account.accountUid}:`, error);
          // Continue with other accounts
        }
      }

      return summaries;

    } catch (error) {
      logger.error('Error getting all accounts metrics:', error);
      throw error;
    }
  }

  /**
   * Check if account has sufficient margin for new position
   */
  async checkMarginSufficiency(accountUid, requiredMargin) {
    try {
      const account = await tradingAccountRepository.findTradingAccountByUid(accountUid);
      if (!account) {
        throw new Error(`Trading account not found for UID: ${accountUid}`);
      }

      // Update metrics first to get current free margin
      await this.updateAccountMetrics(accountUid);
      
      // Get updated account
      const updatedAccount = await tradingAccountRepository.findTradingAccountByUid(accountUid);
      
      return {
        hasSufficientMargin: updatedAccount.freeMargin >= requiredMargin,
        freeMargin: updatedAccount.freeMargin,
        requiredMargin: requiredMargin,
        marginDeficit: Math.max(0, requiredMargin - updatedAccount.freeMargin)
      };

    } catch (error) {
      logger.error(`Error checking margin sufficiency for account ${accountUid}:`, error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      updateIntervalMs: this.updateIntervalMs,
      lastUpdate: this.lastUpdate
    };
  }

  /**
   * Update update interval
   */
  setUpdateInterval(intervalMs) {
    if (this.isRunning) {
      this.stop();
      this.updateIntervalMs = intervalMs;
      this.start();
    } else {
      this.updateIntervalMs = intervalMs;
    }
    logger.info(`Account metrics update interval updated to ${intervalMs}ms`);
  }

  /**
   * Manually trigger metrics update for all accounts
   */
  async triggerUpdate() {
    if (!this.isRunning) {
      logger.warn('Service is not running, cannot trigger update');
      return;
    }
    
    logger.info('Manually triggering account metrics update');
    await this.updateAllAccountMetrics();
  }

  /**
   * Manually trigger metrics update for specific account
   */
  async triggerUpdateForAccount(accountUid) {
    if (!this.isRunning) {
      logger.warn('Service is not running, cannot trigger update');
      return;
    }
    
    logger.info(`Manually triggering account metrics update for account ${accountUid}`);
    await this.updateAccountMetrics(accountUid);
  }
}

// Create a singleton instance
const accountMetricsService = new AccountMetricsService();

export default accountMetricsService;
