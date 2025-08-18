/**
 * Order model based on database schema
 */

import { OrderType, OrderStatus } from '../enums/orderEnums.js';

class Order {
  constructor(data = {}) {
    this.id = data.id || null;
    this.accountId = data.account_id || null;
    this.instrumentId = data.instrument_id || null;
    this.orderType = data.order_type || null;
    this.lotSize = data.lot_size || 0;
    this.status = data.status || OrderStatus.PENDING;
    this.limitValue = data.limit_value || null;
    this.price = data.price || 0;
    this.slPrice = data.sl_price || null; // Stop Loss Price
    this.tpPrice = data.tp_price || null; // Take Profit Price
    this.filledAt = data.filled_at || null;
    this.createdAt = data.created_at || new Date();
  }

  /**
   * Convert model to database format
   */
  toDatabaseFormat() {
    return {
      id: this.id,
      account_id: this.accountId,
      instrument_id: this.instrumentId,
      order_type: this.orderType,
      lot_size: this.lotSize,
      status: this.status,
      limit_value: this.limitValue,
      price: this.price,
      sl_price: this.slPrice,
      tp_price: this.tpPrice,
      filled_at: this.filledAt,
      created_at: this.createdAt
    };
  }

  /**
   * Create Order from database data
   */
  static fromDatabase(data) {
    return new Order(data);
  }

  /**
   * Validate order data
   */
  validate() {
    const errors = [];

    if (!this.accountId) {
      errors.push('Account ID is required');
    }

    if (!this.instrumentId) {
      errors.push('Instrument ID is required');
    }

    if (!this.orderType || !Object.values(OrderType).includes(this.orderType)) {
      errors.push('Valid order type is required');
    }

    if (this.lotSize <= 0) {
      errors.push('Lot size must be greater than 0');
    }

    if (!this.status || !Object.values(OrderStatus).includes(this.status)) {
      errors.push('Valid order status is required');
    }

    if (this.price < 0) {
      errors.push('Price cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if order is filled
   */
  isFilled() {
    return this.status === OrderStatus.FILLED;
  }

  /**
   * Check if order is pending
   */
  isPending() {
    return this.status === OrderStatus.PENDING;
  }

  /**
   * Check if order is cancelled
   */
  isCancelled() {
    return this.status === OrderStatus.CANCELLED;
  }

  /**
   * Check if order is rejected
   */
  isRejected() {
    return this.status === OrderStatus.REJECTED;
  }
}

export default Order;

