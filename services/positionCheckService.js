import { Logger } from '../utils/logger.js';
import priceCacheService from './priceCacheService.js';
import PositionRepository from '../repositories/PositionRepository.js';
import { PositionStatus } from '../enums/positionEnums.js';

const logger = new Logger('PositionCheckService');
const positionRepository = new PositionRepository();

/**
 * Service for monitoring and automatically closing positions based on SL/TP levels
 */
class PositionCheckService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
    this.checkIntervalMs = 100; // 0.1 seconds as requested
  }

  /**
   * Start the position monitoring service
   */
  start() {
    if (this.isRunning) {
      logger.warn('Position check service is already running');
      return;
    }

    logger.info('Starting position check service');
    this.isRunning = true;
    this.checkInterval = setInterval(() => {
      this.checkPositions();
    }, this.checkIntervalMs);
  }

  /**
   * Stop the position monitoring service
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Position check service is not running');
      return;
    }

    logger.info('Stopping position check service');
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check all open positions for SL/TP triggers
   */
  async checkPositions() {
    try {
      // Get all open positions
      const openPositions = await positionRepository.findOpenPositions();
      
      if (openPositions.length === 0) {
        return; // No open positions to check
      }

      logger.debug(`Checking ${openPositions.length} open positions for SL/TP triggers`);

      // Process each position
      for (const position of openPositions) {
        await this.checkPosition(position);
      }
    } catch (error) {
      logger.error('Error checking positions:', error);
    }
  }

  /**
   * Check a single position for SL/TP triggers
   */
  async checkPosition(position) {
    try {
      // Get current price for the instrument from WebSocket cache
      const currentPrice = await priceCacheService.getCurrentPriceByInstrumentId(position.instrumentId);
      
      if (!currentPrice) {
        logger.warn(`Could not get current price for instrument ${position.instrumentId} from WebSocket cache`);
        return;
      }

      logger.debug(`Position ${position.id}: Current price ${currentPrice}, Entry: ${position.entryPrice}, SL: ${position.slPrice}, TP: ${position.tpPrice}`);

      // Check if stop loss is hit
      if (position.slPrice && position.isStopLossHit(currentPrice)) {
        logger.info(`Stop loss triggered for position ${position.id} at price ${currentPrice}`);
        await this.closePosition(position, currentPrice, 'stop_loss');
        return;
      }

      // Check if take profit is hit
      if (position.tpPrice && position.isTakeProfitHit(currentPrice)) {
        logger.info(`Take profit triggered for position ${position.id} at price ${currentPrice}`);
        await this.closePosition(position, currentPrice, 'take_profit');
        return;
      }

    } catch (error) {
      logger.error(`Error checking position ${position.id}:`, error);
    }
  }

  /**
   * Close a position with the given exit price
   */
  async closePosition(position, exitPrice, triggerType) {
    try {
      logger.info(`Closing position ${position.id} at ${exitPrice} (triggered by ${triggerType})`);

      // Close the position using the repository
      const closedPosition = await positionRepository.closePosition({
        positionId: position.id,
        exitPrice: exitPrice
      });

      logger.info(`Successfully closed position ${position.id}. Final PnL: ${closedPosition.pnl}`);

      // You could add additional logic here like:
      // - Sending notifications
      // - Updating trading statistics
      // - Triggering webhooks
      // - Logging to audit trail

    } catch (error) {
      logger.error(`Error closing position ${position.id}:`, error);
    }
  }

  /**
   * Check positions for a specific account
   */
  async checkPositionsForAccount(accountId) {
    try {
      const openPositions = await positionRepository.findOpenPositionsByAccountId(accountId);
      
      if (openPositions.length === 0) {
        return;
      }

      logger.debug(`Checking ${openPositions.length} open positions for account ${accountId}`);

      for (const position of openPositions) {
        await this.checkPosition(position);
      }
    } catch (error) {
      logger.error(`Error checking positions for account ${accountId}:`, error);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkIntervalMs: this.checkIntervalMs,
      lastCheck: this.lastCheck
    };
  }

  /**
   * Update check interval
   */
  setCheckInterval(intervalMs) {
    if (this.isRunning) {
      this.stop();
      this.checkIntervalMs = intervalMs;
      this.start();
    } else {
      this.checkIntervalMs = intervalMs;
    }
    logger.info(`Position check interval updated to ${intervalMs}ms`);
  }
}

// Create a singleton instance
const positionCheckService = new PositionCheckService();

export default positionCheckService;
