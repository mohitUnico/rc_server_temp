/**
 * Position model based on database schema
 */

import { PositionType, PositionStatus } from '../enums/positionEnums.js';

class Position {
  constructor(data = {}) {
    this.id = data.id || null;
    this.accountId = data.account_id || null;
    this.instrumentId = data.instrument_id || null;
    this.positionType = data.position_type || null;
    this.lotSize = data.lot_size || 0;
    this.entryPrice = data.entry_price || 0;
    this.slPrice = data.sl_price || null; // Stop Loss Price
    this.tpPrice = data.tp_price || null; // Take Profit Price
    this.exitPrice = data.exit_price || null;
    this.pnl = data.pnl || 0; // Profit and Loss
    this.status = data.status || PositionStatus.OPEN;
    this.marginUsed = data.margin_used || 0;
    this.openedAt = data.opened_at || new Date();
    this.closedAt = data.closed_at || null;
    this.createdAt = data.created_at || new Date();
    this.updatedAt = data.updated_at || new Date();
  }

  /**
   * Convert model to database format
   */
  toDatabaseFormat() {
    return {
      id: this.id,
      account_id: this.accountId,
      instrument_id: this.instrumentId,
      position_type: this.positionType,
      lot_size: this.lotSize,
      entry_price: this.entryPrice,
      sl_price: this.slPrice,
      tp_price: this.tpPrice,
      exit_price: this.exitPrice,
      pnl: this.pnl,
      status: this.status,
      margin_used: this.marginUsed,
      opened_at: this.openedAt,
      closed_at: this.closedAt,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  /**
   * Create Position from database data
   */
  static fromDatabase(data) {
    return new Position(data);
  }

  /**
   * Validate position data
   */
  validate() {
    const errors = [];

    if (!this.accountId) {
      errors.push('Account ID is required');
    }

    if (!this.instrumentId) {
      errors.push('Instrument ID is required');
    }

    if (!this.positionType || !Object.values(PositionType).includes(this.positionType)) {
      errors.push('Valid position type is required');
    }

    if (this.lotSize <= 0) {
      errors.push('Lot size must be greater than 0');
    }

    if (this.entryPrice <= 0) {
      errors.push('Entry price must be greater than 0');
    }

    if (!this.status || !Object.values(PositionStatus).includes(this.status)) {
      errors.push('Valid position status is required');
    }

    if (this.marginUsed < 0) {
      errors.push('Margin used cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate current P&L based on current price
   */
  calculatePnL(currentPrice) {
    if (!currentPrice || currentPrice <= 0) {
      return this.pnl;
    }

    const priceDifference = currentPrice - this.entryPrice;
    const multiplier = this.positionType === PositionType.BUY ? 1 : -1;
    
    return (priceDifference * multiplier * this.lotSize);
  }

  /**
   * Check if position is open
   */
  isOpen() {
    return this.status === PositionStatus.OPEN;
  }

  /**
   * Check if position is closed
   */
  isClosed() {
    return this.status === PositionStatus.CLOSED;
  }

  /**
   * Check if position is a buy position
   */
  isBuy() {
    return this.positionType === PositionType.BUY;
  }

  /**
   * Check if position is a sell position
   */
  isSell() {
    return this.positionType === PositionType.SELL;
  }

  /**
   * Check if stop loss is hit
   */
  isStopLossHit(currentPrice) {
    if (!this.slPrice || !currentPrice) return false;
    
    if (this.isBuy()) {
      return currentPrice <= this.slPrice;
    } else {
      return currentPrice >= this.slPrice;
    }
  }

  /**
   * Check if take profit is hit
   */
  isTakeProfitHit(currentPrice) {
    if (!this.tpPrice || !currentPrice) return false;
    
    if (this.isBuy()) {
      return currentPrice >= this.tpPrice;
    } else {
      return currentPrice <= this.tpPrice;
    }
  }

  /**
   * Close position with exit price
   */
  closePosition(exitPrice) {
    this.exitPrice = exitPrice;
    this.status = PositionStatus.CLOSED;
    this.closedAt = new Date();
    this.updatedAt = new Date();
    
    // Calculate final P&L
    this.pnl = this.calculatePnL(exitPrice);
  }
}

export default Position;

