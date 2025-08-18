/**
 * Transaction repository for handling transaction data operations with retry logic
 */

const BaseRepository = require('./BaseRepository');
const Transaction = require('../models/Transaction');
const { TransactionStatus } = require('../enums/transactionEnums');

class TransactionRepository extends BaseRepository {
  constructor() {
    super('transactions');
  }

  /**
   * Create a new transaction with retry logic
   */
  async createTransaction(transactionData) {
    try {
      const transaction = new Transaction(transactionData);
      const validation = transaction.validate();
      
      if (!validation.isValid) {
        throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
      }

      const dbData = transaction.toDatabaseFormat();
      const result = await this.create(dbData);
      
      return Transaction.fromDatabase(result);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Find transaction by ID with retry logic
   */
  async findTransactionById(id) {
    try {
      const result = await this.findById(id);
      return result ? Transaction.fromDatabase(result) : null;
    } catch (error) {
      console.error('Error finding transaction by ID:', error);
      throw error;
    }
  }

  /**
   * Find transactions by account ID with retry logic
   */
  async findTransactionsByAccountId(accountId, options = {}) {
    try {
      const filters = { account_id: accountId };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      return result.map(transaction => Transaction.fromDatabase(transaction));
    } catch (error) {
      console.error('Error finding transactions by account ID:', error);
      throw error;
    }
  }

  /**
   * Find transactions by type with retry logic
   */
  async findTransactionsByType(type, options = {}) {
    try {
      const filters = { type };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      return result.map(transaction => Transaction.fromDatabase(transaction));
    } catch (error) {
      console.error('Error finding transactions by type:', error);
      throw error;
    }
  }

  /**
   * Find deposit transactions
   */
  async findDepositTransactions(options = {}) {
    return this.findTransactionsByType('deposit', options);
  }

  /**
   * Find withdrawal transactions
   */
  async findWithdrawalTransactions(options = {}) {
    return this.findTransactionsByType('withdrawal', options);
  }

  /**
   * Find transactions by status with retry logic
   */
  async findTransactionsByStatus(status, options = {}) {
    try {
      const filters = { status };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      return result.map(transaction => Transaction.fromDatabase(transaction));
    } catch (error) {
      console.error('Error finding transactions by status:', error);
      throw error;
    }
  }

  /**
   * Find pending transactions
   */
  async findPendingTransactions(options = {}) {
    return this.findTransactionsByStatus(TransactionStatus.PENDING, options);
  }

  /**
   * Find completed transactions
   */
  async findCompletedTransactions(options = {}) {
    return this.findTransactionsByStatus(TransactionStatus.COMPLETED, options);
  }

  /**
   * Find failed transactions
   */
  async findFailedTransactions(options = {}) {
    return this.findTransactionsByStatus(TransactionStatus.FAILED, options);
  }

  /**
   * Find transactions by currency with retry logic
   */
  async findTransactionsByCurrency(currency, options = {}) {
    try {
      const filters = { currency };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      return result.map(transaction => Transaction.fromDatabase(transaction));
    } catch (error) {
      console.error('Error finding transactions by currency:', error);
      throw error;
    }
  }

  /**
   * Find transactions by date range with retry logic
   */
  async findTransactionsByDateRange(startDate, endDate, options = {}) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 1000) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find transactions by date range: ${error.message}`);
      }

      return data.map(transaction => Transaction.fromDatabase(transaction));
    } catch (error) {
      console.error('Error finding transactions by date range:', error);
      throw error;
    }
  }

  /**
   * Update transaction status with retry logic
   */
  async updateTransactionStatus(id, status) {
    try {
      const result = await this.updateById(id, { status });
      return Transaction.fromDatabase(result);
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  /**
   * Mark transaction as completed
   */
  async markTransactionCompleted(id) {
    return this.updateTransactionStatus(id, TransactionStatus.COMPLETED);
  }

  /**
   * Mark transaction as failed
   */
  async markTransactionFailed(id) {
    return this.updateTransactionStatus(id, TransactionStatus.FAILED);
  }

  /**
   * Update transaction with new data with retry logic
   */
  async updateTransaction(id, transactionData) {
    try {
      const transaction = new Transaction(transactionData);
      const validation = transaction.validate();
      
      if (!validation.isValid) {
        throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
      }

      const dbData = transaction.toDatabaseFormat();
      delete dbData.id; // Remove ID from update data
      
      const result = await this.updateById(id, dbData);
      return Transaction.fromDatabase(result);
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  /**
   * Delete transaction with retry logic
   */
  async deleteTransaction(id) {
    try {
      return await this.deleteById(id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  /**
   * Get transactions with pagination
   */
  async getTransactionsWithPagination(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      const options = {
        limit,
        offset,
        orderBy: { column: 'created_at', ascending: false }
      };

      const result = await this.findAll(filters, options);
      const transactions = result.map(transaction => Transaction.fromDatabase(transaction));
      
      const totalCount = await this.count(filters);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        transactions,
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
      console.error('Error getting transactions with pagination:', error);
      throw error;
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStatistics(accountId = null) {
    try {
      const filters = accountId ? { account_id: accountId } : {};
      
      const allTransactions = await this.findAll(filters);
      const transactions = allTransactions.map(transaction => Transaction.fromDatabase(transaction));

      const deposits = transactions.filter(transaction => transaction.isDeposit());
      const withdrawals = transactions.filter(transaction => transaction.isWithdrawal());
      const completed = transactions.filter(transaction => transaction.isCompleted());
      const pending = transactions.filter(transaction => transaction.isPending());
      const failed = transactions.filter(transaction => transaction.isFailed());

      const totalDeposits = deposits.reduce((sum, transaction) => sum + transaction.amount, 0);
      const totalWithdrawals = withdrawals.reduce((sum, transaction) => sum + transaction.amount, 0);
      const totalCompleted = completed.reduce((sum, transaction) => sum + transaction.amount, 0);

      const stats = {
        total: transactions.length,
        deposits: deposits.length,
        withdrawals: withdrawals.length,
        completed: completed.length,
        pending: pending.length,
        failed: failed.length,
        totalDeposits,
        totalWithdrawals,
        totalCompleted,
        netFlow: totalDeposits - totalWithdrawals
      };

      return stats;
    } catch (error) {
      console.error('Error getting transaction statistics:', error);
      throw error;
    }
  }

  /**
   * Get transactions by currency
   */
  async getTransactionsByCurrency(accountId = null) {
    try {
      const filters = accountId ? { account_id: accountId } : {};
      
      const allTransactions = await this.findAll(filters);
      const transactions = allTransactions.map(transaction => Transaction.fromDatabase(transaction));

      const transactionsByCurrency = {};
      
      transactions.forEach(transaction => {
        if (!transactionsByCurrency[transaction.currency]) {
          transactionsByCurrency[transaction.currency] = {
            currency: transaction.currency,
            totalAmount: 0,
            depositAmount: 0,
            withdrawalAmount: 0,
            transactionCount: 0
          };
        }
        
        transactionsByCurrency[transaction.currency].totalAmount += transaction.amount;
        transactionsByCurrency[transaction.currency].transactionCount += 1;
        
        if (transaction.isDeposit()) {
          transactionsByCurrency[transaction.currency].depositAmount += transaction.amount;
        } else {
          transactionsByCurrency[transaction.currency].withdrawalAmount += transaction.amount;
        }
      });

      return Object.values(transactionsByCurrency);
    } catch (error) {
      console.error('Error getting transactions by currency:', error);
      throw error;
    }
  }
}

module.exports = TransactionRepository;

