/**
 * Position repository for handling position data operations with retry logic
 */

import BaseRepository from './BaseRepository.js';
import Position from '../models/Position.js';
import { PositionStatus } from '../enums/positionEnums.js';
import TradingAccountRepository from './TradingAccountRepository.js';
import InstrumentRepository from './InstrumentRepository.js';
import { InstrumentCategory } from '../enums/instrumentEnums.js';
import OrderRepository from './OrderRepository.js';
import TradeRepository from './TradeRepository.js';
import { OrderType, OrderStatus } from '../enums/orderEnums.js';
import { OrderSide } from '../enums/orderEnums.js';

const DEFAULT_PIP_SIZE = 0.0001;
const DEFAULT_PIP_VALUE = 10;

class PositionRepository extends BaseRepository {
  constructor() {
    super('positions');
    this.tradingAccountRepository = new TradingAccountRepository();
    this.instrumentRepository = new InstrumentRepository();
    this.orderRepository = new OrderRepository();
    this.tradeRepository = new TradeRepository();
  }

  /**
   * Create a new position with retry logic (matching Flutter createPosition)
   * Margin will be automatically calculated if not provided
   */
  async createPosition({
    accountId,
    instrumentId,
    positionType,
    lotSize,
    entryPrice,
    slPrice,
    tpPrice,
    marginUsed = null
  }) {
    try {
      // Generate a unique ID for the position (similar to Flutter's IdGenerator)
      const positionId = this.generatePositionId();

      // Calculate margin used if not provided
      let calculatedMarginUsed = await this.calculateRequiredMargin({
          accountId,
          instrumentId,
          lotSize,
          entryPrice
        });

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
        margin_used: calculatedMarginUsed,
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
   * Create order and trade entries for closing a position (opposite of opening)
   */
  async createCloseOrderAndTrade(position, closeLotSize, exitPrice) {
    try {
      // Determine the opposite order type and side for closing
      const isBuyPosition = position.positionType === 'buy';
      const orderType = isBuyPosition ? OrderType.MARKET_SELL : OrderType.MARKET_BUY;
      const side = isBuyPosition ? OrderSide.SELL : OrderSide.BUY;

      // Create a market order for closing the position
      const orderData = {
        account_id: position.accountId,
        instrument_id: position.instrumentId,
        position_id: position.id,
        order_type: orderType,
        lot_size: closeLotSize,
        status: OrderStatus.FILLED, // Market orders are filled immediately
        price: exitPrice,
        filled_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const closeOrder = await this.orderRepository.placeOrder(orderData);

      // Create trade entry for the closing transaction
      const trade = await this.tradeRepository.createTrade({
        orderId: closeOrder.id,
        positionId: position.id,
        accountId: position.accountId,
        symbolId: position.instrumentId,
        side: side,
        quantity: closeLotSize,
        price: exitPrice,
        fee: null
      });

      return { closeOrder, trade };
    } catch (error) {
      console.error('Error creating close order and trade:', error);
      throw error;
    }
  }

  /**
   * Calculate required margin for a position using the formula:
   * Margin = (Trade Size (lot size) × Contract Size × Price) / Leverage
   */
  async calculateRequiredMargin({ accountId, instrumentId, lotSize, entryPrice }) {
    try {
      // Get the trading account to get leverage - try both ID and UID approaches
      let account = await this.tradingAccountRepository.findTradingAccountById(accountId);
      
      // If not found by ID, try by UID (since accountId might actually be a UID)
      if (!account) {
        console.log(`Account not found by ID ${accountId}, trying by UID...`);
        account = await this.tradingAccountRepository.findTradingAccountByUid(accountId);
      }
      
      if (!account) {
        throw new Error(`Trading account not found by ID or UID: ${accountId}`);
      }

      console.log(`Found trading account:`, {
        id: account.id,
        uid: account.accountUid,
        leverage: account.leverage
      });

      // Get the instrument to get contract size
      const instrument = await this.instrumentRepository.findInstrumentById(instrumentId);
      if (!instrument) {
        throw new Error(`Instrument not found: ${instrumentId}`);
      }

      console.log(`Found instrument:`, {
        id: instrument.id,
        symbol: instrument.symbol,
        category: instrument.category,
        contractSize: instrument.contractSize
      });

      // Get leverage from account (fallback to 100x if missing)
      const leverage = Number(account.leverage) > 0 ? Number(account.leverage) : 100;

      // Get contract size from instrument (fallback to category-based defaults)
      let contractSize = 100000.0; // Default for Forex
      if (instrument.contractSize) {
        contractSize = instrument.contractSize;
      } else if (instrument.category) {
        switch (instrument.category) {
          case InstrumentCategory.FOREX:
            contractSize = 100000.0;
            break;
          case InstrumentCategory.METAL: // Gold
            contractSize = 100.0;
            break;
          case InstrumentCategory.CRYPTO:
            contractSize = 1.0;
            break;
          default:
            contractSize = 1.0;
            break;
        }
      }

      // Calculate margin using the formula: Margin = (Lot Size × Contract Size × Price) / Leverage
      const margin = (lotSize * contractSize * entryPrice) / leverage;

      console.log(`Calculated margin for position:`, {
        lotSize,
        contractSize,
        entryPrice,
        leverage,
        calculatedMargin: margin
      });

      return margin;
    } catch (error) {
      console.error('Error calculating required margin:', error);
      throw error; // Don't use fallback, let the error propagate
    }
  }

  /**
   * Get all positions for an account with retry logic and instrument details (matching Flutter getPositionsByAccount)
   */
  async findPositionsByAccountId(accountId, options = {}) {
    try {
      const filters = { account_id: accountId };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      const positions = result.map(position => Position.fromDatabase(position));
      return await this.enrichPositionsWithInstrumentDetails(positions);
    } catch (error) {
      console.error('Error finding positions by account ID:', error);
      throw error;
    }
  }

  /**
   * Get open positions for an account with retry logic and instrument details (matching Flutter getOpenPositionsByAccount)
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
      const positions = result.map(position => Position.fromDatabase(position));
      return await this.enrichPositionsWithInstrumentDetails(positions);
    } catch (error) {
      console.error('Error finding open positions by account ID:', error);
      throw error;
    }
  }

  /**
   * Get closed positions for an account with retry logic and instrument details (matching Flutter getClosedPositionsByAccount)
   */
  async findClosedPositionsByAccountId(accountId, options = {}) {
    try {
      const filters = { 
        account_id: accountId,
        status: PositionStatus.CLOSED
      };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'closed_at', ascending: false }
      });
      const positions = result.map(position => Position.fromDatabase(position));
      return await this.enrichPositionsWithInstrumentDetails(positions);
    } catch (error) {
      console.error('Error finding closed positions by account ID:', error);
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

      // If PnL is not provided, calculate it using the exit price as current price
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
        // Keep the original margin_used value to show how much margin was used in this position
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Updating position with data:', updates);

      const result = await this.updateById(positionId, updates);
      const closedPosition = Position.fromDatabase(result);
      console.log(`Position closed successfully. Saved PnL: ${closedPosition.pnl}, Margin used preserved: ${closedPosition.marginUsed}`);

      // Create order and trade entries for closing the position
      console.log(`Creating close order and trade for position ${positionId}`);
      try {
        const { closeOrder, trade } = await this.createCloseOrderAndTrade(position, position.lotSize, exitPrice);
        console.log(`Created close order ${closeOrder.id} and trade ${trade.id} for position ${positionId}`);
      } catch (orderTradeError) {
        console.error('Error creating close order and trade:', orderTradeError);
        // Don't throw here - the position is already closed, we don't want to rollback
        // Just log the error for debugging
      }

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
   * Calculate PnL for a position (matching Flutter _calculateRealtimePnL)
   */
  async calculatePnL(position, currentPrice) {
    try {
      // Return stored PnL if no current price
      if (!currentPrice) {
        return position.pnl;
      }

      // Get instrument pip configuration
      const instrument = await this.instrumentRepository.findInstrumentById(position.instrumentId);
      
      console.log(`Instrument details for ${position.instrumentId}:`, {
        id: instrument?.id,
        symbol: instrument?.symbol,
        category: instrument?.category,
        name: instrument?.name,
        pipSize: instrument?.pipSize,
        pipValue: instrument?.pipValue
      });
      
      const pipSize = Number(instrument?.pipSize);
      const pipValue = Number(instrument?.pipValue);

      console.log(`Calculating PnL for position ${position.id}:`);
      console.log(`  Entry price: ${position.entryPrice}`);
      console.log(`  Current price: ${currentPrice}`);
      console.log(`  Position type: ${position.positionType}`);
      console.log(`  Lot size: ${position.lotSize}`);
      console.log(`  Pip size: ${pipSize}`);
      console.log(`  Pip value: ${pipValue}`);

      const isValidPipData = Number.isFinite(pipSize) && pipSize > 0 && Number.isFinite(pipValue) && pipValue > 0;
      if (!isValidPipData) {
        console.warn(`Instrument ${position.instrumentId} missing pip data. Falling back to defaults (pip size=${DEFAULT_PIP_SIZE}, pip value=${DEFAULT_PIP_VALUE}).`);
      }

      const effectivePipSize = isValidPipData ? pipSize : DEFAULT_PIP_SIZE;
      const effectivePipValue = isValidPipData ? pipValue : DEFAULT_PIP_VALUE;

      let pnl;
      if (position.positionType === 'buy') {
        pnl = ((currentPrice - position.entryPrice) / effectivePipSize) * effectivePipValue * position.lotSize;
      } else {
        pnl = ((position.entryPrice - currentPrice) / effectivePipSize) * effectivePipValue * position.lotSize;
      }

      console.log(`  Calculated PnL: ${pnl}`);
      return pnl;
    } catch (error) {
      console.error('Error calculating PnL:', error);
      const priceDifference = position.positionType === 'buy'
        ? currentPrice - position.entryPrice
        : position.entryPrice - currentPrice;
      return (priceDifference / DEFAULT_PIP_SIZE) * DEFAULT_PIP_VALUE * position.lotSize;
    }
  }

  /**
   * Get position by ID with retry logic and instrument details
   */
  async findPositionById(id) {
    try {
      const result = await this.findById(id);
      if (!result) return null;
      
      const position = Position.fromDatabase(result);
      return await this.enrichPositionWithInstrumentDetails(position);
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

      // 3. Create order and trade entries for the partial close
      console.log(`Creating close order and trade for partial close of position ${originalPosition.id}`);
      try {
        const { closeOrder, trade } = await this.createCloseOrderAndTrade(originalPosition, closeLotSize, exitPrice);
        console.log(`Created close order ${closeOrder.id} and trade ${trade.id} for partial close of position ${originalPosition.id}`);
      } catch (orderTradeError) {
        console.error('Error creating close order and trade for partial close:', orderTradeError);
        // Don't throw here - the position is already updated, we don't want to rollback
        // Just log the error for debugging
      }

      // 4. Update account balance with the PnL from the closed portion
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
   * Find positions by status with retry logic and instrument details
   */
  async findPositionsByStatus(status, options = {}) {
    try {
      const filters = { status };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      const positions = result.map(position => Position.fromDatabase(position));
      return await this.enrichPositionsWithInstrumentDetails(positions);
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
   * Find positions by type (buy/sell) with instrument details
   */
  async findPositionsByType(positionType, options = {}) {
    try {
      const filters = { position_type: positionType };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      const positions = result.map(position => Position.fromDatabase(position));
      return await this.enrichPositionsWithInstrumentDetails(positions);
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
   * Get positions with pagination and instrument details
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
      const enrichedPositions = await this.enrichPositionsWithInstrumentDetails(positions);
      
      const totalCount = await this.count(filters);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        positions: enrichedPositions,
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

  /**
   * Find all positions with instrument details enrichment
   */
  async findAllWithInstrumentDetails(filters = {}, options = {}) {
    try {
      const result = await this.findAll(filters, options);
      const positions = result.map(position => Position.fromDatabase(position));
      return await this.enrichPositionsWithInstrumentDetails(positions);
    } catch (error) {
      console.error('Error finding all positions with instrument details:', error);
      throw error;
    }
  }

  /**
   * Enrich a single position with instrument details
   */
  async enrichPositionWithInstrumentDetails(position) {
    try {
      if (!position.instrumentId) {
        return position;
      }

      // Import InstrumentRepository dynamically to avoid circular dependencies
      const { default: InstrumentRepository } = await import('./InstrumentRepository.js');
      const instrumentRepo = new InstrumentRepository();
      
      const instrument = await instrumentRepo.findInstrumentById(position.instrumentId);
      
      if (instrument) {
        // Add instrument details to the position object while preserving the Position model instance
        position.instrument = {
          id: instrument.id,
          symbol: instrument.symbol,
          name: instrument.name,
          category: instrument.category,
          status: instrument.status
        };
      }
      
      return position;
    } catch (error) {
      console.error('Error enriching position with instrument details:', error);
      return position; // Return original position if enrichment fails
    }
  }

  /**
   * Enrich multiple positions with instrument details
   */
  async enrichPositionsWithInstrumentDetails(positions) {
    try {
      if (!positions || positions.length === 0) {
        return positions;
      }

      // Import InstrumentRepository dynamically to avoid circular dependencies
      const { default: InstrumentRepository } = await import('./InstrumentRepository.js');
      const instrumentRepo = new InstrumentRepository();
      
      // Get unique instrument IDs to minimize database queries
      const instrumentIds = [...new Set(positions.map(position => position.instrumentId).filter(id => id))];
      
      // Fetch all instruments in one query
      const instruments = {};
      for (const instrumentId of instrumentIds) {
        const instrument = await instrumentRepo.findInstrumentById(instrumentId);
        if (instrument) {
          instruments[instrumentId] = {
            id: instrument.id,
            symbol: instrument.symbol,
            name: instrument.name,
            category: instrument.category,
            status: instrument.status
          };
        }
      }
      
      // Enrich each position with instrument details while preserving Position model instances
      positions.forEach(position => {
        if (position.instrumentId && instruments[position.instrumentId]) {
          position.instrument = instruments[position.instrumentId];
        }
      });
      
      return positions;
    } catch (error) {
      console.error('Error enriching positions with instrument details:', error);
      return positions; // Return original positions if enrichment fails
    }
  }
}

export default PositionRepository;

