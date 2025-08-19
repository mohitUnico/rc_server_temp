/**
 * TradingAccount model based on database schema
 */

import { AccountStatus } from '../enums/accountEnums.js';

class TradingAccount {
  constructor(data = {}) {
    this.accountUid = data.account_uid || null;
    this.userId = data.user_id || null;
    this.accountNumber = data.account_number || '';
    this.accountType = data.account_type || '';
    this.balance = data.balance || 0;
    this.equity = data.equity || 0;
    this.margin = data.margin || 0;
    this.freeMargin = data.free_margin || 0;
    // Note: margin_level is calculated on-the-fly, not stored in database
    this.status = data.status || AccountStatus.ACTIVE;
    this.currency = data.currency || 'USD';
    this.leverage = data.levarage || 100; // Note: database column is misspelled as 'levarage'
    this.createdAt = data.created_at || new Date();
    // Note: updated_at column doesn't exist in database schema
  }

  /**
   * Convert model to database format
   */
  toDatabaseFormat() {
    return {
      account_uid: this.accountUid,
      user_id: this.userId,
      account_number: this.accountNumber,
      account_type: this.accountType,
      balance: this.balance,
      equity: this.equity,
      margin: this.margin,
      free_margin: this.freeMargin,
      // margin_level is calculated on-the-fly, not stored
      status: this.status,
      currency: this.currency,
      levarage: this.leverage, // Note: database column is misspelled as 'levarage'
      created_at: this.createdAt,
      // updated_at column doesn't exist in database schema
    };
  }

  /**
   * Create TradingAccount from database data
   */
  static fromDatabase(data) {
    return new TradingAccount(data);
  }

  /**
   * Validate trading account data
   */
  validate() {
    const errors = [];

    if (!this.userId) {
      errors.push('User ID is required');
    }

    if (!this.accountNumber || this.accountNumber.trim() === '') {
      errors.push('Account number is required');
    }

    if (!this.accountType || this.accountType.trim() === '') {
      errors.push('Account type is required');
    }

    if (this.balance < 0) {
      errors.push('Balance cannot be negative');
    }

    if (this.equity < 0) {
      errors.push('Equity cannot be negative');
    }

    if (this.margin < 0) {
      errors.push('Margin cannot be negative');
    }

    if (this.freeMargin < 0) {
      errors.push('Free margin cannot be negative');
    }

    if (!this.status || !Object.values(AccountStatus).includes(this.status)) {
      errors.push('Valid account status is required');
    }

    if (!this.currency || this.currency.trim() === '') {
      errors.push('Currency is required');
    }

    if (this.leverage <= 0) {
      errors.push('Leverage must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if account is active
   */
  isActive() {
    return this.status === AccountStatus.ACTIVE;
  }

  /**
   * Check if account is suspended
   */
  isSuspended() {
    return this.status === AccountStatus.SUSPENDED;
  }

  /**
   * Check if account is expired
   */
  isExpired() {
    return this.status === AccountStatus.EXPIRED;
  }

  /**
   * Calculate margin level percentage
   */
  getMarginLevelPercentage() {
    if (this.margin === 0) return 0;
    return (this.equity / this.margin) * 100;
  }

  /**
   * Check if account has sufficient free margin
   */
  hasSufficientMargin(requiredMargin) {
    return this.freeMargin >= requiredMargin;
  }

  /**
   * Get formatted balance
   */
  getFormattedBalance() {
    return `${this.balance.toFixed(2)} ${this.currency}`;
  }

  /**
   * Get formatted equity
   */
  getFormattedEquity() {
    return `${this.equity.toFixed(2)} ${this.currency}`;
  }

  /**
   * Get formatted free margin
   */
  getFormattedFreeMargin() {
    return `${this.freeMargin.toFixed(2)} ${this.currency}`;
  }
}

export default TradingAccount;

