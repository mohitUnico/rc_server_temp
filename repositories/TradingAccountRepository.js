/**
 * TradingAccount repository for handling trading account data operations with retry logic
 */

import BaseRepository from './BaseRepository.js';
import TradingAccount from '../models/TradingAccount.js';
import { AccountStatus } from '../enums/accountEnums.js';

class TradingAccountRepository extends BaseRepository {
  constructor() {
    super('tradingAccounts');
  }

  /**
   * Generate a random trading ID (matching Flutter _generateTradingId)
   */
  generateTradingId() {
    const chars = '0123456789';
    const random = Math.random;
    return Array.from({ length: 8 }, () => chars[Math.floor(random() * chars.length)]).join('');
  }

  /**
   * Generate a random password (matching Flutter _generatePassword)
   */
  generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const random = Math.random;
    return Array.from({ length: 4 }, () => chars[Math.floor(random() * chars.length)]).join('');
  }

  /**
   * Create trading account for user after OTP verification (matching Flutter createTradingAccount)
   */
  async createTradingAccount({ userId, email }) {
    try {
      const tradingId = this.generateTradingId();
      const password = this.generatePassword();

      const data = {
        user_id: userId,
        account_uid: tradingId,
        account_password: password, // In production, this should be hashed
        levarage: 100.0, // Note: your schema has "levarage"
        balance: 10000.0, // Demo balance
        currency: 'USD',
        status: 'active',
        created_at: new Date().toISOString(),
        free_margin: 10000.0, // Same as balance initially
        equity: 10000.0, // Same as balance initially
        margin: 0.0, // Default margin value
        watchlist: [] // Initialize empty watchlist
      };

      const result = await this.create(data);
      return TradingAccount.fromDatabase(result);
    } catch (error) {
      console.error('Error creating trading account:', error);
      throw error;
    }
  }

  /**
   * Get trading accounts for a user (matching Flutter getTradingAccounts)
   */
  async findTradingAccountsByUserId(userId) {
    try {
      const filters = { 
        user_id: userId,
        status: 'active'
      };
      const result = await this.findAll(filters);
      return result.map(account => TradingAccount.fromDatabase(account));
    } catch (error) {
      console.error('Error finding trading accounts by user ID:', error);
      throw error;
    }
  }

  /**
   * Get a specific trading account (matching Flutter getTradingAccount)
   */
  async findTradingAccountById(accountId) {
    try {
      const result = await this.findById(accountId);
      return result ? TradingAccount.fromDatabase(result) : null;
    } catch (error) {
      console.error('Error finding trading account by ID:', error);
      return null;
    }
  }

  /**
   * Get trading account by account UID (matching Flutter getTradingAccountByUid)
   */
  async findTradingAccountByUid(accountUid) {
    try {
      const filters = { 
        account_uid: accountUid,
        status: 'active'
      };
      const result = await this.findOne(filters);
      return result ? TradingAccount.fromDatabase(result) : null;
    } catch (error) {
      console.error('Error finding trading account by UID:', error);
      return null;
    }
  }

  /**
   * Update trading account balance (matching Flutter updateBalance)
   */
  async updateBalance({ accountId, newBalance }) {
    try {
      const result = await this.updateById(accountId, { balance: newBalance });
      return TradingAccount.fromDatabase(result);
    } catch (error) {
      console.error('Error updating trading account balance:', error);
      throw error;
    }
  }

  /**
   * Update trading account balance by adding/subtracting amount (matching Flutter updateBalanceByAmount)
   */
  async updateBalanceByAmount({ accountId, amount }) {
    try {
      // First get current balance
      const currentAccount = await this.findTradingAccountById(accountId);
      if (!currentAccount) {
        throw new Error('Trading account not found');
      }

      const newBalance = currentAccount.balance + amount;

      // Ensure balance doesn't go below 0
      const finalBalance = newBalance < 0 ? 0.0 : newBalance;

      return await this.updateBalance({
        accountId: accountId,
        newBalance: finalBalance
      });
    } catch (error) {
      console.error('Error updating trading account balance by amount:', error);
      throw error;
    }
  }

  /**
   * Update trading account balance by adding/subtracting amount using account UID (matching Flutter updateBalanceByAmountWithUid)
   */
  async updateBalanceByAmountWithUid({ accountUid, amount }) {
    try {
      console.log(`Updating balance for account UID: ${accountUid} with amount: ${amount}`);

      // First get current balance using account UID
      const currentAccount = await this.findTradingAccountByUid(accountUid);
      if (!currentAccount) {
        throw new Error(`Trading account not found for UID: ${accountUid}`);
      }

      console.log(`Current balance: ${currentAccount.balance}`);
      const newBalance = currentAccount.balance + amount;
      console.log(`New balance will be: ${newBalance}`);

      // Ensure balance doesn't go below 0
      const finalBalance = newBalance < 0 ? 0.0 : newBalance;
      console.log(`Final balance (after clamping): ${finalBalance}`);

      // Update using account UID
      const result = await this.updateByField('account_uid', accountUid, { balance: finalBalance });
      const updatedAccount = TradingAccount.fromDatabase(result);
      console.log(`Successfully updated balance to: ${updatedAccount.balance}`);

      return updatedAccount;
    } catch (error) {
      console.error('Error updating balance by UID:', error);
      throw error;
    }
  }

  /**
   * Set trading account balance to a specific value using account UID (matching Flutter setBalanceWithUid)
   */
  async setBalanceWithUid({ accountUid, newBalance }) {
    try {
      console.log(`Setting balance for account UID: ${accountUid} to: ${newBalance}`);

      // Update using account UID
      const result = await this.updateByField('account_uid', accountUid, { balance: newBalance });
      const updatedAccount = TradingAccount.fromDatabase(result);
      console.log(`Successfully set balance to: ${updatedAccount.balance}`);

      return updatedAccount;
    } catch (error) {
      console.error('Error setting balance by UID:', error);
      throw error;
    }
  }

  /**
   * Add symbol to watchlist (matching Flutter addToWatchlist)
   */
  async addToWatchlist({ accountUid, symbol }) {
    try {
      // Get current trading account
      const currentAccount = await this.findTradingAccountByUid(accountUid);
      if (!currentAccount) {
        throw new Error('Trading account not found');
      }

      // Check if symbol is already in watchlist
      if (currentAccount.watchlist.includes(symbol)) {
        return currentAccount; // Already in watchlist
      }

      // Add symbol to watchlist
      const updatedWatchlist = [...currentAccount.watchlist, symbol];

      const result = await this.updateByField('account_uid', accountUid, { watchlist: updatedWatchlist });
      return TradingAccount.fromDatabase(result);
    } catch (error) {
      console.error('Error adding symbol to watchlist:', error);
      throw error;
    }
  }

  /**
   * Remove symbol from watchlist (matching Flutter removeFromWatchlist)
   */
  async removeFromWatchlist({ accountUid, symbol }) {
    try {
      // Get current trading account
      const currentAccount = await this.findTradingAccountByUid(accountUid);
      if (!currentAccount) {
        throw new Error('Trading account not found');
      }

      // Remove symbol from watchlist
      const updatedWatchlist = currentAccount.watchlist.filter(s => s !== symbol);

      const result = await this.updateByField('account_uid', accountUid, { watchlist: updatedWatchlist });
      return TradingAccount.fromDatabase(result);
    } catch (error) {
      console.error('Error removing symbol from watchlist:', error);
      throw error;
    }
  }

  /**
   * Get watchlist for a trading account (matching Flutter getWatchlist)
   */
  async getWatchlist(accountUid) {
    try {
      const account = await this.findTradingAccountByUid(accountUid);
      if (!account) {
        throw new Error('Trading account not found');
      }
      return account.watchlist;
    } catch (error) {
      console.error('Error getting watchlist:', error);
      throw error;
    }
  }

  /**
   * Get watchlist with categories by joining with instruments table (matching Flutter getWatchlistWithCategories)
   */
  async getWatchlistWithCategories(accountUid) {
    try {
      const account = await this.findTradingAccountByUid(accountUid);
      if (!account) {
        throw new Error('Trading account not found');
      }

      const watchlistSymbols = account.watchlist;
      if (watchlistSymbols.length === 0) {
        return {};
      }

      // Query instruments table to get categories for watchlist symbols
      const response = await this.supabase
        .from('instruments')
        .select('symbol, category')
        .in('symbol', watchlistSymbols);

      // Create a map of symbol -> category
      const symbolCategories = {};
      for (const instrument of response) {
        symbolCategories[instrument.symbol] = instrument.category;
      }

      return symbolCategories;
    } catch (error) {
      console.error('Error getting watchlist with categories:', error);
      throw error;
    }
  }

  /**
   * Update entire watchlist (matching Flutter updateWatchlist)
   */
  async updateWatchlist({ accountUid, watchlist }) {
    try {
      const result = await this.updateByField('account_uid', accountUid, { watchlist: watchlist });
      return TradingAccount.fromDatabase(result);
    } catch (error) {
      console.error('Error updating watchlist:', error);
      throw error;
    }
  }

  /**
   * Update free margin for a trading account (matching Flutter updateFreeMargin)
   */
  async updateFreeMargin({ accountUid, freeMargin }) {
    try {
      console.log(`Updating free margin for account UID: ${accountUid} to: ${freeMargin}`);

      const result = await this.updateByField('account_uid', accountUid, { free_margin: freeMargin });
      const updatedAccount = TradingAccount.fromDatabase(result);
      console.log(`Successfully updated free margin to: ${updatedAccount.freeMargin}`);

      return updatedAccount;
    } catch (error) {
      console.error('Error updating free margin by UID:', error);
      throw error;
    }
  }

  /**
   * Update multiple account metrics at once (matching Flutter updateAccountMetrics)
   */
  async updateAccountMetrics({ accountUid, balance, equity, margin, freeMargin }) {
    try {
      console.log(`Updating account metrics for UID: ${accountUid} - Balance: ${balance}, Equity: ${equity}, Margin: ${margin}, Free Margin: ${freeMargin}`);

      const result = await this.updateByField('account_uid', accountUid, {
        balance: balance,
        equity: equity,
        margin: margin,
        free_margin: freeMargin
      });

      const updatedAccount = TradingAccount.fromDatabase(result);
      console.log('Successfully updated account metrics');

      return updatedAccount;
    } catch (error) {
      console.error('Error updating account metrics by UID:', error);
      throw error;
    }
  }

  /**
   * Find trading accounts by status
   */
  async findTradingAccountsByStatus(status, options = {}) {
    try {
      const filters = { account_status: status };
      const result = await this.findAll(filters, options);
      return result.map(account => TradingAccount.fromDatabase(account));
    } catch (error) {
      console.error('Error finding trading accounts by status:', error);
      throw error;
    }
  }

  /**
   * Find active trading accounts
   */
  async findActiveTradingAccounts(options = {}) {
    return this.findTradingAccountsByStatus(AccountStatus.ACTIVE, options);
  }

  /**
   * Find suspended trading accounts
   */
  async findSuspendedTradingAccounts(options = {}) {
    return this.findTradingAccountsByStatus(AccountStatus.SUSPENDED, options);
  }

  /**
   * Find expired trading accounts
   */
  async findExpiredTradingAccounts(options = {}) {
    return this.findTradingAccountsByStatus(AccountStatus.EXPIRED, options);
  }

  /**
   * Find trading accounts by account type
   */
  async findTradingAccountsByType(accountType, options = {}) {
    try {
      const filters = { account_type: accountType };
      const result = await this.findAll(filters, options);
      return result.map(account => TradingAccount.fromDatabase(account));
    } catch (error) {
      console.error('Error finding trading accounts by type:', error);
      throw error;
    }
  }

  /**
   * Find trading accounts by currency
   */
  async findTradingAccountsByCurrency(currency, options = {}) {
    try {
      const filters = { currency };
      const result = await this.findAll(filters, options);
      return result.map(account => TradingAccount.fromDatabase(account));
    } catch (error) {
      console.error('Error finding trading accounts by currency:', error);
      throw error;
    }
  }

  /**
   * Update account equity
   */
  async updateAccountEquity(accountUid, newEquity) {
    try {
      const updateData = { 
        equity: newEquity,
        updated_at: new Date()
      };
      
      const result = await this.updateByField('account_uid', accountUid, updateData);
      return result ? TradingAccount.fromDatabase(result) : null;
    } catch (error) {
      console.error('Error updating account equity:', error);
      throw error;
    }
  }

  /**
   * Update account margin
   */
  async updateAccountMargin(accountUid, newMargin, newFreeMargin) {
    try {
      const updateData = { 
        margin: newMargin,
        free_margin: newFreeMargin,
        updated_at: new Date()
      };
      
      const result = await this.updateByField('account_uid', accountUid, updateData);
      return result ? TradingAccount.fromDatabase(result) : null;
    } catch (error) {
      console.error('Error updating account margin:', error);
      throw error;
    }
  }

  /**
   * Update account status
   */
  async updateAccountStatus(accountUid, status) {
    try {
      const updateData = { 
        account_status: status,
        updated_at: new Date()
      };
      
      const result = await this.updateByField('account_uid', accountUid, updateData);
      return result ? TradingAccount.fromDatabase(result) : null;
    } catch (error) {
      console.error('Error updating account status:', error);
      throw error;
    }
  }

  /**
   * Activate account
   */
  async activateAccount(accountUid) {
    return this.updateAccountStatus(accountUid, AccountStatus.ACTIVE);
  }

  /**
   * Suspend account
   */
  async suspendAccount(accountUid) {
    return this.updateAccountStatus(accountUid, AccountStatus.SUSPENDED);
  }

  /**
   * Expire account
   */
  async expireAccount(accountUid) {
    return this.updateAccountStatus(accountUid, AccountStatus.EXPIRED);
  }

  /**
   * Update trading account with new data
   */
  async updateTradingAccount(accountUid, accountData) {
    try {
      const account = new TradingAccount(accountData);
      const validation = account.validate();
      
      if (!validation.isValid) {
        throw new Error(`Trading account validation failed: ${validation.errors.join(', ')}`);
      }

      const dbData = account.toDatabaseFormat();
      delete dbData.account_uid; // Remove UID from update data
      dbData.updated_at = new Date();
      
      const result = await this.updateByField('account_uid', accountUid, dbData);
      return result ? TradingAccount.fromDatabase(result) : null;
    } catch (error) {
      console.error('Error updating trading account:', error);
      throw error;
    }
  }

  /**
   * Delete trading account
   */
  async deleteTradingAccount(accountUid) {
    try {
      return await this.deleteByField('account_uid', accountUid);
    } catch (error) {
      console.error('Error deleting trading account:', error);
      throw error;
    }
  }

  /**
   * Get trading accounts with pagination
   */
  async getTradingAccountsWithPagination(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      const options = {
        limit,
        offset,
        orderBy: { column: 'created_at', ascending: false }
      };

      const result = await this.findAll(filters, options);
      const accounts = result.map(account => TradingAccount.fromDatabase(account));
      
      const totalCount = await this.count(filters);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        accounts,
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
      console.error('Error getting trading accounts with pagination:', error);
      throw error;
    }
  }

  /**
   * Get trading account statistics
   */
  async getTradingAccountStatistics() {
    try {
      const allAccounts = await this.findAll();
      const accounts = allAccounts.map(account => TradingAccount.fromDatabase(account));

      const activeAccounts = accounts.filter(account => account.isActive());
      const suspendedAccounts = accounts.filter(account => account.isSuspended());
      const expiredAccounts = accounts.filter(account => account.isExpired());

      const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
      const totalEquity = accounts.reduce((sum, account) => sum + account.equity, 0);
      const totalMargin = accounts.reduce((sum, account) => sum + account.margin, 0);
      const totalFreeMargin = accounts.reduce((sum, account) => sum + account.freeMargin, 0);

      const stats = {
        total: accounts.length,
        active: activeAccounts.length,
        suspended: suspendedAccounts.length,
        expired: expiredAccounts.length,
        totalBalance,
        totalEquity,
        totalMargin,
        totalFreeMargin,
        averageBalance: accounts.length > 0 ? totalBalance / accounts.length : 0,
        averageEquity: accounts.length > 0 ? totalEquity / accounts.length : 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting trading account statistics:', error);
      throw error;
    }
  }
}

export default TradingAccountRepository;

