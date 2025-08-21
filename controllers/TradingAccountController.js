/**
 * TradingAccount controller for handling HTTP requests related to trading accounts
 */

import TradingAccountRepository from '../repositories/TradingAccountRepository.js';
import { AccountStatus } from '../enums/accountEnums.js';

const tradingAccountRepository = new TradingAccountRepository();

class TradingAccountController {
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const account = await tradingAccountRepository.findById(id);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Trading account not found',
          message: `No trading account found with ID: ${id}`
        });
      }

      res.json({
        success: true,
        data: account,
        message: 'Trading account retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting trading account by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve trading account'
      });
    }
  }

  static async getByUid(req, res) {
    try {
      const { uid } = req.params;
      const account = await tradingAccountRepository.findTradingAccountByUid(uid);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Trading account not found',
          message: `No trading account found with UID: ${uid}`
        });
      }

      res.json({
        success: true,
        data: account,
        message: 'Trading account retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting trading account by UID:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve trading account'
      });
    }
  }

  static async getByUser(req, res) {
    try {
      const { userId } = req.params;
      const accounts = await tradingAccountRepository.findTradingAccountsByUserId(userId);
      
      res.json({
        success: true,
        data: accounts,
        count: accounts.length,
        message: 'Trading accounts retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting trading accounts by user:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve trading accounts'
      });
    }
  }

  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, status, accountType, currency } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (accountType) filters.account_type = accountType;
      if (currency) filters.currency = currency;

      const result = await tradingAccountRepository.getTradingAccountsWithPagination(
        parseInt(page),
        parseInt(limit),
        filters
      );

      res.json({
        success: true,
        data: result.accounts,
        pagination: result.pagination,
        message: 'Trading accounts retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting all trading accounts:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve trading accounts'
      });
    }
  }

  static async create(req, res) {
    try {
      const { userId, email } = req.body;
      
      if (!userId || !email) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'userId and email are required'
        });
      }

      const account = await tradingAccountRepository.createTradingAccount({ userId, email });
      
      res.status(201).json({
        success: true,
        data: account,
        message: 'Trading account created successfully'
      });
    } catch (error) {
      console.error('Error creating trading account:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create trading account'
      });
    }
  }

  static async update(req, res) {
    try {
      const { uid } = req.params;
      const updateData = req.body;

      const account = await tradingAccountRepository.updateTradingAccount(uid, updateData);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Trading account not found',
          message: `No trading account found with UID: ${uid}`
        });
      }

      res.json({
        success: true,
        data: account,
        message: 'Trading account updated successfully'
      });
    } catch (error) {
      console.error('Error updating trading account:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update trading account'
      });
    }
  }

  static async delete(req, res) {
    try {
      const { uid } = req.params;
      const deleted = await tradingAccountRepository.deleteTradingAccount(uid);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Trading account not found',
          message: `No trading account found with UID: ${uid}`
        });
      }

      res.json({
        success: true,
        message: 'Trading account deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting trading account:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete trading account'
      });
    }
  }

  // Balance management
  static async updateBalance(req, res) {
    try {
      const { uid } = req.params;
      const { balance } = req.body;
      
      if (balance === undefined || balance < 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid balance',
          message: 'Balance must be a non-negative number'
        });
      }

      const account = await tradingAccountRepository.setBalanceWithUid({ accountUid: uid, newBalance: balance });
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Trading account not found',
          message: `No trading account found with UID: ${uid}`
        });
      }

      res.json({
        success: true,
        data: account,
        message: 'Balance updated successfully'
      });
    } catch (error) {
      console.error('Error updating balance:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update balance'
      });
    }
  }

  static async updateBalanceByAmount(req, res) {
    try {
      const { uid } = req.params;
      const { amount } = req.body;
      
      if (amount === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing amount',
          message: 'Amount is required'
        });
      }

      const account = await tradingAccountRepository.updateBalanceByAmountWithUid({ accountUid: uid, amount });
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Trading account not found',
          message: `No trading account found with UID: ${uid}`
        });
      }

      res.json({
        success: true,
        data: account,
        message: 'Balance updated successfully'
      });
    } catch (error) {
      console.error('Error updating balance by amount:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update balance'
      });
    }
  }

  // Account metrics
  static async updateMetrics(req, res) {
    try {
      const { uid } = req.params;
      const { balance, equity, margin, freeMargin } = req.body;
      
      if (balance === undefined || equity === undefined || margin === undefined || freeMargin === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'balance, equity, margin, and freeMargin are required'
        });
      }

      const account = await tradingAccountRepository.updateAccountMetrics({ 
        accountUid: uid, 
        balance, 
        equity, 
        margin, 
        freeMargin 
      });
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Trading account not found',
          message: `No trading account found with UID: ${uid}`
        });
      }

      res.json({
        success: true,
        data: account,
        message: 'Account metrics updated successfully'
      });
    } catch (error) {
      console.error('Error updating account metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update account metrics'
      });
    }
  }

  // Status management
  static async updateStatus(req, res) {
    try {
      const { uid } = req.params;
      const { status } = req.body;
      
      if (!status || !Object.values(AccountStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
          message: `Status must be one of: ${Object.values(AccountStatus).join(', ')}`
        });
      }

      const account = await tradingAccountRepository.updateAccountStatus(uid, status);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Trading account not found',
          message: `No trading account found with UID: ${uid}`
        });
      }

      res.json({
        success: true,
        data: account,
        message: 'Account status updated successfully'
      });
    } catch (error) {
      console.error('Error updating account status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update account status'
      });
    }
  }

  static async activate(req, res) {
    try {
      const { uid } = req.params;
      const account = await tradingAccountRepository.activateAccount(uid);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Trading account not found',
          message: `No trading account found with UID: ${uid}`
        });
      }

      res.json({
        success: true,
        data: account,
        message: 'Account activated successfully'
      });
    } catch (error) {
      console.error('Error activating account:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to activate account'
      });
    }
  }

  static async suspend(req, res) {
    try {
      const { uid } = req.params;
      const account = await tradingAccountRepository.suspendAccount(uid);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Trading account not found',
          message: `No trading account found with UID: ${uid}`
        });
      }

      res.json({
        success: true,
        data: account,
        message: 'Account suspended successfully'
      });
    } catch (error) {
      console.error('Error suspending account:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to suspend account'
      });
    }
  }

  // Watchlist management
  static async getWatchlist(req, res) {
    try {
      const { uid } = req.params;
      const watchlist = await tradingAccountRepository.getWatchlist(uid);
      
      res.json({
        success: true,
        data: watchlist,
        count: watchlist.length,
        message: 'Watchlist retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting watchlist:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve watchlist'
      });
    }
  }

  static async getWatchlistWithCategories(req, res) {
    try {
      const { uid } = req.params;
      const watchlist = await tradingAccountRepository.getWatchlistWithCategories(uid);
      
      res.json({
        success: true,
        data: watchlist,
        count: Object.keys(watchlist).length,
        message: 'Watchlist with categories retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting watchlist with categories:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve watchlist with categories'
      });
    }
  }

  static async addToWatchlist(req, res) {
    try {
      const { uid } = req.params;
      const { symbol } = req.body;
      
      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Missing symbol',
          message: 'Symbol is required'
        });
      }

      const account = await tradingAccountRepository.addToWatchlist({ accountUid: uid, symbol });
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Trading account not found',
          message: `No trading account found with UID: ${uid}`
        });
      }

      res.json({
        success: true,
        data: account,
        message: 'Symbol added to watchlist successfully'
      });
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to add symbol to watchlist'
      });
    }
  }

  static async removeFromWatchlist(req, res) {
    try {
      const { uid, symbol } = req.params;
      
      const account = await tradingAccountRepository.removeFromWatchlist({ accountUid: uid, symbol });
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Trading account not found',
          message: `No trading account found with UID: ${uid}`
        });
      }

      res.json({
        success: true,
        data: account,
        message: 'Symbol removed from watchlist successfully'
      });
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to remove symbol from watchlist'
      });
    }
  }

  static async updateWatchlist(req, res) {
    try {
      const { uid } = req.params;
      const { watchlist } = req.body;
      
      if (!Array.isArray(watchlist)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid watchlist',
          message: 'Watchlist must be an array'
        });
      }

      const account = await tradingAccountRepository.updateWatchlist({ accountUid: uid, watchlist });
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Trading account not found',
          message: `No trading account found with UID: ${uid}`
        });
      }

      res.json({
        success: true,
        data: account,
        message: 'Watchlist updated successfully'
      });
    } catch (error) {
      console.error('Error updating watchlist:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update watchlist'
      });
    }
  }

  // Filtering and statistics
  static async getByStatus(req, res) {
    try {
      const { status } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      if (!Object.values(AccountStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
          message: `Status must be one of: ${Object.values(AccountStatus).join(', ')}`
        });
      }

      const result = await tradingAccountRepository.getTradingAccountsWithPagination(
        parseInt(page),
        parseInt(limit),
        { status }
      );

      res.json({
        success: true,
        data: result.accounts,
        pagination: result.pagination,
        message: `Trading accounts with status '${status}' retrieved successfully`
      });
    } catch (error) {
      console.error('Error getting trading accounts by status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve trading accounts by status'
      });
    }
  }

  static async getByType(req, res) {
    try {
      const { type } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const result = await tradingAccountRepository.getTradingAccountsWithPagination(
        parseInt(page),
        parseInt(limit),
        { account_type: type }
      );

      res.json({
        success: true,
        data: result.accounts,
        pagination: result.pagination,
        message: `Trading accounts with type '${type}' retrieved successfully`
      });
    } catch (error) {
      console.error('Error getting trading accounts by type:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve trading accounts by type'
      });
    }
  }

  static async getByCurrency(req, res) {
    try {
      const { currency } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const result = await tradingAccountRepository.getTradingAccountsWithPagination(
        parseInt(page),
        parseInt(limit),
        { currency: currency.toUpperCase() }
      );

      res.json({
        success: true,
        data: result.accounts,
        pagination: result.pagination,
        message: `Trading accounts with currency '${currency}' retrieved successfully`
      });
    } catch (error) {
      console.error('Error getting trading accounts by currency:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve trading accounts by currency'
      });
    }
  }

  static async getStatistics(req, res) {
    try {
      const stats = await tradingAccountRepository.getTradingAccountStatistics();
      
      res.json({
        success: true,
        data: stats,
        message: 'Trading account statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting trading account statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve trading account statistics'
      });
    }
  }
}

export default TradingAccountController;



