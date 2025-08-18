/**
 * Transaction model based on database schema
 */

const { TransactionType, TransactionStatus } = require('../enums/transactionEnums');

class Transaction {
  constructor(data = {}) {
    this.id = data.id || null;
    this.type = data.type || null;
    this.amount = data.amount || 0;
    this.currency = data.currency || 'USD';
    this.status = data.status || TransactionStatus.PENDING;
    this.createdAt = data.created_at || new Date();
    this.accountId = data.account_id || null;
  }

  /**
   * Convert model to database format
   */
  toDatabaseFormat() {
    return {
      id: this.id,
      type: this.type,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      created_at: this.createdAt,
      account_id: this.accountId
    };
  }

  /**
   * Create Transaction from database data
   */
  static fromDatabase(data) {
    return new Transaction(data);
  }

  /**
   * Validate transaction data
   */
  validate() {
    const errors = [];

    if (!this.accountId) {
      errors.push('Account ID is required');
    }

    if (!this.type || !Object.values(TransactionType).includes(this.type)) {
      errors.push('Valid transaction type is required');
    }

    if (this.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!this.currency || this.currency.trim() === '') {
      errors.push('Currency is required');
    }

    if (!this.status || !Object.values(TransactionStatus).includes(this.status)) {
      errors.push('Valid transaction status is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if transaction is pending
   */
  isPending() {
    return this.status === TransactionStatus.PENDING;
  }

  /**
   * Check if transaction is completed
   */
  isCompleted() {
    return this.status === TransactionStatus.COMPLETED;
  }

  /**
   * Check if transaction is failed
   */
  isFailed() {
    return this.status === TransactionStatus.FAILED;
  }

  /**
   * Check if transaction is a deposit
   */
  isDeposit() {
    return this.type === TransactionType.DEPOSIT;
  }

  /**
   * Check if transaction is a withdrawal
   */
  isWithdrawal() {
    return this.type === TransactionType.WITHDRAWAL;
  }

  /**
   * Mark transaction as completed
   */
  markAsCompleted() {
    this.status = TransactionStatus.COMPLETED;
  }

  /**
   * Mark transaction as failed
   */
  markAsFailed() {
    this.status = TransactionStatus.FAILED;
  }

  /**
   * Get formatted amount with currency
   */
  getFormattedAmount() {
    return `${this.amount.toFixed(2)} ${this.currency}`;
  }

  /**
   * Get absolute amount (positive value)
   */
  getAbsoluteAmount() {
    return Math.abs(this.amount);
  }
}

module.exports = Transaction;

