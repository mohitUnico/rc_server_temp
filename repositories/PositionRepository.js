/**
 * Position repository for handling position data operations with retry logic
 */

import BaseRepository from './BaseRepository.js';
import Position from '../models/Position.js';
import { PositionStatus } from '../enums/positionEnums.js';
import TradingAccountRepository from './TradingAccountRepository.js';
import InstrumentRepository from './InstrumentRepository.js';

class PositionRepository extends BaseRepository {
  constructor() {
    super('positions');
    this.tradingAccountRepository = new TradingAccountRepository();
    this.instrumentRepository = new InstrumentRepository();
  }

  /**
   * Create a new position with retry logic (matching Flutter createPosition)
   */
  async createPosition({
    accountId,
    instrumentId,
    positionType,
    lotSize,
    entryPrice,
    slPrice,
    tpPrice,
    marginUsed
  }) {
    try {
      // Generate a unique ID for the position (similar to Flutter's IdGenerator)
      const positionId = this.generatePositionId();

      const data = {
        id: positionId,
        account_id: accountId,
        instrument_id: instrumentId,
        position_type: positionType,
        lot_size: lotSize,
        entry_price: entryPrice,
        sl_price: slPrice,
        tp_price: tpPrice,
        status: PositionStatus.OPEN,
        margin_used: marginUsed,
        opened_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await this.create(data);
      return Position.fromDatabase(result);
    } catch (error) {
      console.error('Error creating position:', error);
      throw error;
    }
  }

  /**
   * Generate a unique position ID (similar to Flutter's IdGenerator)
   */
  generatePositionId() {
    return Math.floor(Math.random() * 9000000000) + 1000000000; // 10-digit number
  }

  /**
   * Get all positions for an account with retry logic (matching Flutter getPositionsByAccount)
   */
  async findPositionsByAccountId(accountId, options = {}) {
    try {
      const filters = { account_id: accountId };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      return result.map(position => Position.fromDatabase(position));
    } catch (error) {
      console.error('Error finding positions by account ID:', error);
      throw error;
    }
  }

  /**
   * Get open positions for an account with retry logic (matching Flutter getOpenPositionsByAccount)
   */
  async findOpenPositionsByAccountId(accountId, options = {}) {
    try {
      const filters = { 
        account_id: accountId,
        status: PositionStatus.OPEN
      };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      return result.map(position => Position.fromDatabase(position));
    } catch (error) {
      console.error('Error finding open positions by account ID:', error);
      throw error;
    }
  }

  /**
   * Update position with retry logic (matching Flutter updatePosition)
   */
  async updatePosition(id, updates) {
    try {
      updates.updated_at = new Date().toISOString();
      const result = await this.updateById(id, updates);
      return Position.fromDatabase(result);
    } catch (error) {
      console.error('Error updating position:', error);
      throw error;
    }
  }

  /**
   * Close position with retry logic (matching Flutter closePosition)
   */
  async closePosition({ positionId, exitPrice, pnl }) {
    try {
      console.log(`Closing position ${positionId} with exit price ${exitPrice} and PnL ${pnl}`);

      // Get the position first to get account ID and calculate balance update
      const position = await this.findPositionById(positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      console.log(`Found position for account: ${position.accountId}`);
      console.log('Position details:');
      console.log(`  Entry price: ${position.entryPrice}`);
      console.log(`  Exit price: ${exitPrice}`);
      console.log(`  Position type: ${position.positionType}`);
      console.log(`  Lot size: ${position.lotSize}`);

      // If PnL is not provided, calculate it
      if (pnl === undefined) {
        pnl = await this.calculatePnL(position, exitPrice);
        console.log(`Calculated PnL: ${pnl}`);
      } else {
        console.log(`Using provided PnL: ${pnl}`);
      }

      const updates = {
        exit_price: exitPrice,
        pnl: pnl,
        status: PositionStatus.CLOSED,
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Updating position with data:', updates);

      const result = await this.updateById(positionId, updates);
      const closedPosition = Position.fromDatabase(result);
      console.log(`Position closed successfully. Saved PnL: ${closedPosition.pnl}`);

      // Update account balance with the PnL
      console.log(`Updating balance for account ${position.accountId} with PnL ${pnl}`);
      try {
        await this.tradingAccountRepository.updateBalanceByAmountWithUid({
          accountUid: position.accountId,
          amount: pnl
        });
        console.log(`Successfully updated balance for account ${position.accountId}`);
      } catch (balanceError) {
        console.error('Error updating balance:', balanceError);
        // Don't throw here - the position is already closed, we don't want to rollback
        // Just log the error for debugging
      }

      return closedPosition;
    } catch (error) {
      console.error('Error closing position:', error);
      throw error;
    }
  }

  /**
   * Close all open positions for an account (matching Flutter closeAllOpenPositions)
   */
  async closeAllOpenPositions({ accountId, exitPrices }) {
    try {
      console.log(`Closing all open positions for account: ${accountId}`);

      // Get all open positions for the account
      const openPositions = await this.findOpenPositionsByAccountId(accountId);

      if (openPositions.length === 0) {
        console.log(`No open positions found for account: ${accountId}`);
        return [];
      }

      console.log(`Found ${openPositions.length} open positions to close`);

      const closedPositions = [];
      let totalPnL = 0.0;

      // Close each position
      for (const position of openPositions) {
        const positionId = position.id;
        if (!positionId) {
          console.log('Skipping position with null ID');
          continue;
        }

        const exitPrice = exitPrices[positionId];
        if (exitPrice === undefined) {
          console.log(`No exit price provided for position ${positionId}, skipping`);
          continue;
        }

        try {
          // Calculate PnL for this position
          const pnl = await this.calculatePnL(position, exitPrice);
          totalPnL += pnl;

          // Close the position
          const closedPosition = await this.closePosition({
            positionId: positionId,
            exitPrice: exitPrice,
            pnl: pnl
          });

          closedPositions.push(closedPosition);
          console.log(`Successfully closed position ${positionId} with PnL: ${pnl}`);
        } catch (error) {
          console.error(`Error closing position ${positionId}:`, error);
          // Continue with other positions even if one fails
        }
      }

      // Update account balance with total PnL from all closed positions
      if (totalPnL !== 0.0) {
        try {
          await this.tradingAccountRepository.updateBalanceByAmountWithUid({
            accountUid: accountId,
            amount: totalPnL
          });
          console.log(`Successfully updated balance for account ${accountId} with total PnL: ${totalPnL}`);
        } catch (balanceError) {
          console.error(`Error updating balance for account ${accountId}:`, balanceError);
          // Don't throw here - positions are already closed
        }
      }

      console.log(`Successfully closed ${closedPositions.length} positions for account: ${accountId}`);
      return closedPositions;
    } catch (error) {
      console.error('Error closing all open positions:', error);
      throw error;
    }
  }

  /**
   * Calculate PnL for a position (matching Flutter _calculatePnL)
   */
  async calculatePnL(position, exitPrice) {
    try {
      // Get the instrument to get the actual contract size
      const instrument = await this.instrumentRepository.findInstrumentById(position.instrumentId);
      const contractSize = instrument?.contractSize || 100000.0; // Default fallback

      console.log(`Calculating PnL for position ${position.id}:`);
      console.log(`  Entry price: ${position.entryPrice}`);
      console.log(`  Exit price: ${exitPrice}`);
      console.log(`  Position type: ${position.positionType}`);
      console.log(`  Lot size: ${position.lotSize}`);
      console.log(`  Contract size: ${contractSize}`);

      let pnl;
      if (position.positionType === 'buy') {
        pnl = (exitPrice - position.entryPrice) * position.lotSize * contractSize;
      } else {
        pnl = (position.entryPrice - exitPrice) * position.lotSize * contractSize;
      }

      console.log(`  Calculated PnL: ${pnl}`);
      return pnl;
    } catch (error) {
      console.error('Error calculating PnL:', error);
      // Fallback to simplified calculation
      const contractSize = 100000.0; // Default contract size

      if (position.positionType === 'buy') {
        return (exitPrice - position.entryPrice) * position.lotSize * contractSize;
      } else {
        return (position.entryPrice - exitPrice) * position.lotSize * contractSize;
      }
    }
  }

  /**
   * Get position by ID with retry logic
   */
  async findPositionById(id) {
    try {
      const result = await this.findById(id);
      return result ? Position.fromDatabase(result) : null;
    } catch (error) {
      console.error('Error finding position by ID:', error);
      throw error;
    }
  }

  /**
   * Delete position with retry logic (matching Flutter deletePosition)
   */
  async deletePosition(id) {
    try {
      return await this.deleteById(id);
    } catch (error) {
      console.error('Error deleting position:', error);
      throw error;
    }
  }

  /**
   * Partial close position - creates a new closed position entry and updates the original position
   */
  async partialClosePosition({ originalPosition, closeLotSize, exitPrice, pnl }) {
    try {
      const remainingLotSize = originalPosition.lotSize - closeLotSize;

      if (remainingLotSize <= 0) {
        throw new Error('Close lot size must be less than original lot size');
      }

      // Calculate margin for remaining position (proportional)
      const originalMargin = originalPosition.marginUsed || 0.0;
      const closeMargin = (originalMargin * closeLotSize) / originalPosition.lotSize;
      const remainingMargin = originalMargin - closeMargin;

      // Calculate PnL for the closed portion if not provided
      if (pnl === undefined) {
        pnl = await this.calculatePnL(originalPosition, exitPrice);
        // Adjust PnL for partial close
        pnl = (pnl * closeLotSize) / originalPosition.lotSize;
      }

      // 1. Create a new closed position entry (the part being closed)
      const closedPositionData = {
        id: this.generatePositionId(),
        account_id: originalPosition.accountId,
        instrument_id: originalPosition.instrumentId,
        position_type: originalPosition.positionType,
        lot_size: closeLotSize,
        entry_price: originalPosition.entryPrice,
        sl_price: originalPosition.slPrice,
        tp_price: originalPosition.tpPrice,
        exit_price: exitPrice,
        pnl: pnl,
        status: PositionStatus.CLOSED,
        margin_used: closeMargin,
        opened_at: originalPosition.openedAt,
        closed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const closedPosition = await this.create(closedPositionData);

      // 2. Update the original position (reduce lot size, keep status as open)
      const updates = {
        lot_size: remainingLotSize,
        margin_used: remainingMargin,
        updated_at: new Date().toISOString()
      };

      const updatedPosition = await this.updateById(originalPosition.id, updates);

      // 3. Update account balance with the PnL from the closed portion
      try {
        await this.tradingAccountRepository.updateBalanceByAmountWithUid({
          accountUid: originalPosition.accountId,
          amount: pnl
        });
        console.log(`Successfully updated balance for account ${originalPosition.accountId} with PnL ${pnl}`);
      } catch (balanceError) {
        console.error('Error updating balance:', balanceError);
        // Don't throw here - the position is already updated, we don't want to rollback
        // Just log the error for debugging
      }

      return { 
        closedPosition: Position.fromDatabase(closedPosition), 
        openPosition: Position.fromDatabase(updatedPosition) 
      };
    } catch (error) {
      console.error('Error partially closing position:', error);
      throw error;
    }
  }

  /**
   * Find positions by status with retry logic
   */
  async findPositionsByStatus(status, options = {}) {
    try {
      const filters = { status };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      return result.map(position => Position.fromDatabase(position));
    } catch (error) {
      console.error('Error finding positions by status:', error);
      throw error;
    }
  }

  /**
   * Find open positions
   */
  async findOpenPositions(options = {}) {
    return this.findPositionsByStatus(PositionStatus.OPEN, options);
  }

  /**
   * Find closed positions
   */
  async findClosedPositions(options = {}) {
    return this.findPositionsByStatus(PositionStatus.CLOSED, options);
  }

  /**
   * Find positions by type (buy/sell)
   */
  async findPositionsByType(positionType, options = {}) {
    try {
      const filters = { position_type: positionType };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      return result.map(position => Position.fromDatabase(position));
    } catch (error) {
      console.error('Error finding positions by type:', error);
      throw error;
    }
  }

  /**
   * Find buy positions
   */
  async findBuyPositions(options = {}) {
    return this.findPositionsByType('buy', options);
  }

  /**
   * Find sell positions
   */
  async findSellPositions(options = {}) {
    return this.findPositionsByType('sell', options);
  }

  /**
   * Get positions with pagination
   */
  async getPositionsWithPagination(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      const options = {
        limit,
        offset,
        orderBy: { column: 'created_at', ascending: false }
      };

      const result = await this.findAll(filters, options);
      const positions = result.map(position => Position.fromDatabase(position));
      
      const totalCount = await this.count(filters);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        positions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting positions with pagination:', error);
      throw error;
    }
  }

  /**
   * Get position statistics
   */
  async getPositionStatistics(accountId = null) {
    try {
      const filters = accountId ? { account_id: accountId } : {};
      
      const allPositions = await this.findAll(filters);
      const positions = allPositions.map(position => Position.fromDatabase(position));

      const openPositions = positions.filter(position => position.isOpen());
      const closedPositions = positions.filter(position => position.isClosed());

      const totalPnL = positions.reduce((sum, position) => sum + position.pnl, 0);
      const openPnL = openPositions.reduce((sum, position) => sum + position.pnl, 0);
      const closedPnL = closedPositions.reduce((sum, position) => sum + position.pnl, 0);

      const stats = {
        total: positions.length,
        open: openPositions.length,
        closed: closedPositions.length,
        totalPnL,
        openPnL,
        closedPnL,
        averagePnL: positions.length > 0 ? totalPnL / positions.length : 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting position statistics:', error);
      throw error;
    }
  }
}

export default PositionRepository;

