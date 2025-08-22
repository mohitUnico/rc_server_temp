import express from 'express';
import OrderController from '../controllers/OrderController.js';
import { validateNewOrderPayload, validateFreeMarginPositive } from '../validators/orderValidators.js';

const router = express.Router();

// Create / place order
router.post('/orders', validateNewOrderPayload, validateFreeMarginPositive, (req, res) => OrderController.placeOrder(req, res));

// Modify order for a specific account
router.put('/accounts/:accountId/orders/:id', (req, res) => OrderController.modifyOrder(req, res));

// Cancel order for a specific account
router.post('/accounts/:accountId/orders/:id/cancel', (req, res) => OrderController.cancelOrder(req, res));

// Delete order for a specific account
router.delete('/accounts/:accountId/orders/:id', (req, res) => OrderController.deleteOrder(req, res));

// Get all orders for a specific account (supports pagination and filters via query)
router.get('/accounts/:accountId/orders', (req, res) => OrderController.getAllOrders(req, res));

// Filter orders for a specific account via body or query (no pagination if not provided)
router.post('/accounts/:accountId/orders/filter', (req, res) => OrderController.filterOrders(req, res));

// Convenience lists for specific account (must come before /orders/:id to avoid conflicts)
router.get('/accounts/:accountId/orders/pending', (req, res) => OrderController.getPendingOrders(req, res));
router.get('/accounts/:accountId/orders/placed', (req, res) => OrderController.getPlacedOrders(req, res));
router.get('/accounts/:accountId/orders/filled', (req, res) => OrderController.getFilledOrders(req, res));
router.get('/accounts/:accountId/orders/cancelled', (req, res) => OrderController.getCancelledOrders(req, res));
router.get('/accounts/:accountId/orders/rejected', (req, res) => OrderController.getRejectedOrders(req, res));

// Get orders by status for a specific account
router.get('/accounts/:accountId/orders/status/:status', (req, res) => OrderController.getOrdersByStatus(req, res));

// Get one order by id for a specific account (must come after specific routes)
router.get('/accounts/:accountId/orders/:id', (req, res) => OrderController.getOrderById(req, res));

// Legacy route - redirects to the new account-specific route
router.get('/accounts/:accountId/orders', (req, res) => OrderController.getOrdersByAccount(req, res));

// Orders by instrument for an account
router.get('/accounts/:accountId/instruments/:instrumentId/orders', (req, res) => OrderController.getOrdersByInstrument(req, res));

// Fill an order (market execution simulation)
router.post('/orders/:id/fill', (req, res) => OrderController.fillOrder(req, res));

// Execute market order: create order + trade + position
router.post('/orders/execute-market', validateNewOrderPayload, validateFreeMarginPositive, (req, res) => OrderController.executeMarketOrder(req, res));

// Place market order with automatic price fetching
router.post('/orders/market', validateNewOrderPayload, validateFreeMarginPositive, (req, res) => OrderController.placeMarketOrder(req, res));

// Get current price for an instrument
router.get('/instruments/:instrumentId/price', (req, res) => OrderController.getCurrentPrice(req, res));

export default router;


