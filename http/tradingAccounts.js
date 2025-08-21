import express from 'express';
import TradingAccountController from '../controllers/TradingAccountController.js';

const router = express.Router();

// ===== CRUD Operations =====

// Create trading account
router.post('/trading-accounts', (req, res) => TradingAccountController.create(req, res));

// Get all trading accounts (with pagination and filters)
router.get('/trading-accounts', (req, res) => TradingAccountController.getAll(req, res));

// Get trading account by ID
router.get('/trading-accounts/id/:id', (req, res) => TradingAccountController.getById(req, res));

// Get trading account by UID
router.get('/trading-accounts/uid/:uid', (req, res) => TradingAccountController.getByUid(req, res));

// Get trading accounts by user ID
router.get('/users/:userId/trading-accounts', (req, res) => TradingAccountController.getByUser(req, res));

// Update trading account
router.put('/trading-accounts/:uid', (req, res) => TradingAccountController.update(req, res));

// Delete trading account
router.delete('/trading-accounts/:uid', (req, res) => TradingAccountController.delete(req, res));

// ===== Balance Management =====

// Set balance to specific value
router.put('/trading-accounts/:uid/balance', (req, res) => TradingAccountController.updateBalance(req, res));

// Update balance by adding/subtracting amount
router.put('/trading-accounts/:uid/balance/amount', (req, res) => TradingAccountController.updateBalanceByAmount(req, res));

// Update account metrics (balance, equity, margin, freeMargin)
router.put('/trading-accounts/:uid/metrics', (req, res) => TradingAccountController.updateMetrics(req, res));

// ===== Status Management =====

// Update account status
router.put('/trading-accounts/:uid/status', (req, res) => TradingAccountController.updateStatus(req, res));

// Activate account
router.post('/trading-accounts/:uid/activate', (req, res) => TradingAccountController.activate(req, res));

// Suspend account
router.post('/trading-accounts/:uid/suspend', (req, res) => TradingAccountController.suspend(req, res));

// ===== Watchlist Management =====

// Get watchlist
router.get('/trading-accounts/:uid/watchlist', (req, res) => TradingAccountController.getWatchlist(req, res));

// Get watchlist with categories
router.get('/trading-accounts/:uid/watchlist/categories', (req, res) => TradingAccountController.getWatchlistWithCategories(req, res));

// Add symbol to watchlist
router.post('/trading-accounts/:uid/watchlist', (req, res) => TradingAccountController.addToWatchlist(req, res));

// Remove symbol from watchlist
router.delete('/trading-accounts/:uid/watchlist/:symbol', (req, res) => TradingAccountController.removeFromWatchlist(req, res));

// Update entire watchlist
router.put('/trading-accounts/:uid/watchlist', (req, res) => TradingAccountController.updateWatchlist(req, res));

// ===== Filtering and Statistics =====

// Get trading accounts by status
router.get('/trading-accounts/status/:status', (req, res) => TradingAccountController.getByStatus(req, res));

// Get trading accounts by type
router.get('/trading-accounts/type/:type', (req, res) => TradingAccountController.getByType(req, res));

// Get trading accounts by currency
router.get('/trading-accounts/currency/:currency', (req, res) => TradingAccountController.getByCurrency(req, res));

// Get trading account statistics
router.get('/trading-accounts/statistics', (req, res) => TradingAccountController.getStatistics(req, res));

export default router;



