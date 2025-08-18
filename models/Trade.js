/**
 * Trade model based on database schema
 */

import { OrderSide } from '../enums/orderEnums.js';

class Trade {
  constructor(data = {}) {
    this.id = data.id || null;
    this.createdAt = data.created_at || new Date();
    this.orderId = data.order_id || null;
    this.accountId = data.account_id || null;
    this.symbolId = data.symbol_id || null;
    this.side = data.side || null;
    this.quantity = data.quantity || 0;
    this.price = data.price || 0;
    this.fee = data.fee || 0;
    this.executedAt = data.executed_at || new Date();
  }

  /**
   * Convert model to database format
   */
  toDatabaseFormat() {
    return {
      id: this.id,
      created_at: this.createdAt,
      order_id: this.orderId,
      account_id: this.accountId,
      symbol_id: this.symbolId,
      side: this.side,
      quantity: this.quantity,
      price: this.price,
      fee: this.fee,
      executed_at: this.executedAt
    };
  }

  /**
   * Create Trade from database data
   */
  static fromDatabase(data) {
    return new Trade(data);
  }

  /**
   * Validate trade data
   */
  validate() {
    const errors = [];

    if (!this.orderId) {
      errors.push('Order ID is required');
    }

    if (!this.accountId) {
      errors.push('Account ID is required');
    }

    if (!this.symbolId) {
      errors.push('Symbol ID is required');
    }

    if (!this.side || !Object.values(OrderSide).includes(this.side)) {
      errors.push('Valid trade side is required');
    }

    if (this.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (this.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (this.fee < 0) {
      errors.push('Fee cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate total value of the trade
   */
  getTotalValue() {
    return this.quantity * this.price;
  }

  /**
   * Calculate net value after fees
   */
  getNetValue() {
    return this.getTotalValue() - this.fee;
  }

  /**
   * Check if trade is a buy
   */
  isBuy() {
    return this.side === OrderSide.BUY;
  }

  /**
   * Check if trade is a sell
   */
  isSell() {
    return this.side === OrderSide.SELL;
  }
}

export default Trade;

