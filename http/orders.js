import express from 'express';
import OrderController from '../controllers/OrderController.js';
import { validateNewOrderPayload, validateFreeMarginPositive } from '../validators/orderValidators.js';

const router = express.Router();

// Create / place order
router.post('/orders', validateNewOrderPayload, validateFreeMarginPositive, (req, res) => OrderController.placeOrder(req, res));

// Modify order
router.put('/orders/:id', (req, res) => OrderController.modifyOrder(req, res));

// Cancel order
router.post('/orders/:id/cancel', (req, res) => OrderController.cancelOrder(req, res));

// Delete order
router.delete('/orders/:id', (req, res) => OrderController.deleteOrder(req, res));

// Get one order by id
router.get('/orders/:id', (req, res) => OrderController.getOrderById(req, res));

// Get all orders (supports pagination and filters via query)
router.get('/orders', (req, res) => OrderController.getAllOrders(req, res));

// Filter via body or query (no pagination if not provided)
router.post('/orders/filter', (req, res) => OrderController.filterOrders(req, res));

// Get orders by account
router.get('/accounts/:accountId/orders', (req, res) => OrderController.getOrdersByAccount(req, res));

// Get orders by status (optionally by account via ?accountId=)
router.get('/orders/status/:status', (req, res) => OrderController.getOrdersByStatus(req, res));

// Convenience lists
router.get('/orders/placed', (req, res) => OrderController.getPlacedOrders(req, res));
router.get('/orders/filled', (req, res) => OrderController.getFilledOrders(req, res));
router.get('/orders/cancelled', (req, res) => OrderController.getCancelledOrders(req, res));

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


