import OrderRepository from '../repositories/OrderRepository.js';
import Order from '../models/Order.js';
import { Logger } from '../utils/logger.js';
import { OrderStatus, OrderType } from '../enums/orderEnums.js';
import TradeRepository from '../repositories/TradeRepository.js';
import PositionRepository from '../repositories/PositionRepository.js';
import { PositionType } from '../enums/positionEnums.js';
import PriceService from '../services/priceService.js';

const logger = new Logger('OrderController');
const orderRepository = new OrderRepository();
const tradeRepository = new TradeRepository();
const positionRepository = new PositionRepository();

/**
 * Controller for order-related HTTP handlers
 */
class OrderController {
	/**
	 * Place a new order
	 * Expected body: accountId, instrumentId, orderType, lotSize, limitValue, slPrice|sl, tpPrice|tp, status
	 * Note: price field is removed - orders are placed as pending with price = null
	 */
	static async placeOrder(req, res) {
		try {
			const {
				accountId,
				instrumentId,
				orderType,
				lotSize,
				limitValue = null,
				sl = null,
				tp = null,
				status = OrderStatus.PENDING
			} = req.body || {};

			if (!accountId || !instrumentId || !orderType || !lotSize) {
				return res.status(400).json({
					error: 'Missing required fields: accountId, instrumentId, orderType, lotSize'
				});
			}

			// Check if this is a market order that needs immediate execution
			const isMarketOrder = orderType === OrderType.MARKET_BUY || orderType === OrderType.MARKET_SELL;
			
			if (isMarketOrder) {
				// For market orders, we need to fetch current price and execute immediately
				let currentPrice;
				try {
					logger.info(`Fetching current price for market order - instrumentId: ${instrumentId}`);
					currentPrice = await PriceService.getCurrentPrice(instrumentId);
					logger.info(`Current price fetched: ${currentPrice}`);
				} catch (error) {
					logger.error('Failed to fetch current price for market order:', error);
					return res.status(400).json({ 
						error: `Failed to fetch current price for market order: ${error.message}` 
					});
				}

				// Create order data with current price
				const orderData = {
					account_id: accountId,
					instrument_id: instrumentId,
					order_type: orderType,
					lot_size: lotSize,
					limit_value: limitValue,
					sl_price: sl,
					tp_price: tp,
					price: currentPrice,
					status: OrderStatus.PENDING
				};

				// 1) Place pending market order
				const placedOrder = await orderRepository.placeOrder(orderData);

				// 2) Fill order at current price
				const filledOrder = await orderRepository.fillOrder(placedOrder.id, currentPrice);

				// 3) Create trade
				const side = orderType === OrderType.MARKET_BUY ? 'buy' : 'sell';
				const trade = await tradeRepository.createTrade({
					orderId: filledOrder.id,
					accountId: accountId,
					symbolId: instrumentId,
					side,
					quantity: lotSize,
					price: currentPrice,
					fee: null
				});

				// 4) Create position
				const positionType = side === 'buy' ? PositionType.BUY : PositionType.SELL;
				const position = await positionRepository.createPosition({
					accountId: accountId,
					instrumentId: instrumentId,
					positionType,
					lotSize: lotSize,
					entryPrice: currentPrice,
					slPrice: sl,
					tpPrice: tp,
					marginUsed: 0
				});

				return res.status(201).json({ 
					order: filledOrder, 
					trade, 
					position,
					executedPrice: currentPrice 
				});
			} else {
				// For non-market orders (limit, stop, etc.), place as pending with price = null
				const orderData = {
					account_id: accountId,
					instrument_id: instrumentId,
					order_type: orderType,
					lot_size: lotSize,
					limit_value: limitValue,
					sl_price: sl,
					tp_price: tp,
					price: null, // Price will be set when order is filled
					status: OrderStatus.PENDING
				};

				// Place pending order
				const created = await orderRepository.placeOrder(orderData);
				return res.status(201).json({
					order: created,
					message: 'Order placed as pending. Price will be set when order is filled.'
				});
			}
		} catch (error) {
			logger.error('placeOrder failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	/**
	 * Modify an existing order for a specific account (only pending orders can be modified)
	 * Body may include: limitValue, slPrice|sl, tpPrice|tp; ID can be in params.id or body.orderId/body.id
	 */
	static async modifyOrder(req, res) {
		try {
			const { id, accountId } = req.params;
			if (!id) {
				return res.status(400).json({ error: 'Missing required field: order id' });
			}
			if (!accountId) {
				return res.status(400).json({ error: 'Missing required field: accountId' });
			}

			// First, get the current order to check its status
			const currentOrder = await orderRepository.findOrderById(id);
			if (!currentOrder) {
				return res.status(404).json({ error: 'Order not found' });
			}

			// Verify the order belongs to the specified account
			if (currentOrder.accountId != accountId) {
				return res.status(403).json({ error: 'Access denied: Order does not belong to this account' });
			}

			// Only pending orders can be modified
			if (currentOrder.status !== OrderStatus.PENDING) {
				return res.status(400).json({ 
					error: `Order cannot be modified. Current status: ${currentOrder.status}. Only pending orders can be modified.` 
				});
			}

			// Market orders (marketBuy/marketSell) cannot be modified as they are immediately filled
			if (currentOrder.orderType === OrderType.MARKET_BUY || currentOrder.orderType === OrderType.MARKET_SELL) {
				return res.status(400).json({ 
					error: `Market orders (${currentOrder.orderType}) cannot be modified as they are immediately executed.` 
				});
			}

			const updates = {
				limitValue: req.body?.limitValue,
				slPrice: req.body?.slPrice ?? req.body?.sl,
				tpPrice: req.body?.tpPrice ?? req.body?.tp
			};

			const updated = await orderRepository.modifyOrder(id, updates);
			return res.json(updated);
		} catch (error) {
			logger.error('modifyOrder failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	/**
	 * Cancel an existing order by ID for a specific account
	 */
	static async cancelOrder(req, res) {
		try {
			const { id, accountId } = req.params;
			if (!id) {
				return res.status(400).json({ error: 'Missing required field: order id' });
			}
			if (!accountId) {
				return res.status(400).json({ error: 'Missing required field: accountId' });
			}

			// First, get the current order to verify ownership
			const currentOrder = await orderRepository.findOrderById(id);
			if (!currentOrder) {
				return res.status(404).json({ error: 'Order not found' });
			}

			// Verify the order belongs to the specified account
			if (currentOrder.accountId != accountId) {
				return res.status(403).json({ error: 'Access denied: Order does not belong to this account' });
			}

			const cancelled = await orderRepository.cancelOrder(id);
			return res.json(cancelled);
		} catch (error) {
			logger.error('cancelOrder failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	/**
	 * Delete an order by ID for a specific account
	 */
	static async deleteOrder(req, res) {
		try {
			const { id, accountId } = req.params;
			if (!id) {
				return res.status(400).json({ error: 'Missing required field: order id' });
			}
			if (!accountId) {
				return res.status(400).json({ error: 'Missing required field: accountId' });
			}

			// First, get the current order to verify ownership
			const currentOrder = await orderRepository.findOrderById(id);
			if (!currentOrder) {
				return res.status(404).json({ error: 'Order not found' });
			}

			// Verify the order belongs to the specified account
			if (currentOrder.accountId != accountId) {
				return res.status(403).json({ error: 'Access denied: Order does not belong to this account' });
			}

			await orderRepository.deleteOrder(id);
			return res.status(200).json({ success: true });
		} catch (error) {
			logger.error('deleteOrder failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	/**
	 * Get a single order by ID for a specific account
	 */
	static async getOrderById(req, res) {
		try {
			const { id, accountId } = req.params;
			if (!id) {
				return res.status(400).json({ error: 'Missing required field: id' });
			}
			if (!accountId) {
				return res.status(400).json({ error: 'Missing required field: accountId' });
			}

			const order = await orderRepository.findOrderById(id);
			if (!order) {
				return res.status(404).json({ error: 'Order not found' });
			}

			// Verify the order belongs to the specified account
			if (order.accountId != accountId) {
				return res.status(403).json({ error: 'Access denied: Order does not belong to this account' });
			}

			return res.json(order);
		} catch (error) {
			logger.error('getOrderById failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	/**
	 * Get all orders for a specific account with optional pagination and filters
	 * Query: page, limit, status, instrumentId
	 */
	static async getAllOrders(req, res) {
		try {
			const { accountId } = req.params;
			if (!accountId) return res.status(400).json({ error: 'accountId is required' });

			const page = parseInt(req.query.page || '1', 10);
			const limit = parseInt(req.query.limit || '20', 10);

			const filters = { account_id: accountId };
			if (req.query.status) filters.status = req.query.status;
			if (req.query.instrumentId) filters.instrument_id = req.query.instrumentId;

			const result = await orderRepository.getOrdersWithPagination(page, limit, filters);
			return res.json(result);
		} catch (error) {
			logger.error('getAllOrders failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	/**
	 * Get orders by account
	 */
	static async getOrdersByAccount(req, res) {
		try {
			const { accountId } = req.params;
			if (!accountId) return res.status(400).json({ error: 'accountId is required' });
			const orders = await orderRepository.findOrdersByAccountId(accountId);
			return res.json(orders);
		} catch (error) {
			logger.error('getOrdersByAccount failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	/**
	 * Get orders by status for a specific account
	 */
	static async getOrdersByStatus(req, res) {
		try {
			const { status, accountId } = req.params;
			if (!status) return res.status(400).json({ error: 'status is required' });
			if (!accountId) return res.status(400).json({ error: 'accountId is required' });
			const orders = await orderRepository.findOrdersByStatus(status, accountId);
			return res.json(orders);
		} catch (error) {
			logger.error('getOrdersByStatus failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	/**
	 * Get pending/placed/filled/cancelled/rejected helpers for a specific account
	 */
	static async getPendingOrders(req, res) {
		try {
			const { accountId } = req.params;
			if (!accountId) return res.status(400).json({ error: 'accountId is required' });
			const orders = await orderRepository.findPendingOrders(accountId);
			return res.json(orders);
		} catch (error) {
			logger.error('getPendingOrders failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	static async getPlacedOrders(req, res) {
		try {
			const { accountId } = req.params;
			if (!accountId) return res.status(400).json({ error: 'accountId is required' });
			const orders = await orderRepository.findPlacedOrders(accountId);
			return res.json(orders);
		} catch (error) {
			logger.error('getPlacedOrders failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	static async getFilledOrders(req, res) {
		try {
			const { accountId } = req.params;
			if (!accountId) return res.status(400).json({ error: 'accountId is required' });
			const orders = await orderRepository.findFilledOrders(accountId);
			return res.json(orders);
		} catch (error) {
			logger.error('getFilledOrders failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	static async getCancelledOrders(req, res) {
		try {
			const { accountId } = req.params;
			if (!accountId) return res.status(400).json({ error: 'accountId is required' });
			const orders = await orderRepository.findCancelledOrders(accountId);
			return res.json(orders);
		} catch (error) {
			logger.error('getCancelledOrders failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	static async getRejectedOrders(req, res) {
		try {
			const { accountId } = req.params;
			if (!accountId) return res.status(400).json({ error: 'accountId is required' });
			const orders = await orderRepository.findRejectedOrders(accountId);
			return res.json(orders);
		} catch (error) {
			logger.error('getRejectedOrders failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	/**
	 * Get orders by instrument for an account
	 */
	static async getOrdersByInstrument(req, res) {
		try {
			const { accountId, instrumentId } = req.params;
			if (!accountId || !instrumentId) {
				return res.status(400).json({ error: 'accountId and instrumentId are required' });
			}
			const orders = await orderRepository.findOrdersByInstrument(accountId, instrumentId);
			return res.json(orders);
		} catch (error) {
			logger.error('getOrdersByInstrument failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	/**
	 * Fill an existing order (market execution style)
	 */
	static async fillOrder(req, res) {
		try {
			const id = req.params?.id || req.body?.orderId || req.body?.id;
			const { price } = req.body || {};
			if (!id || price === undefined) {
				return res.status(400).json({ error: 'id and price are required' });
			}
			const filled = await orderRepository.fillOrder(id, price);
			return res.json(filled);
		} catch (error) {
			logger.error('fillOrder failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	/**
	 * Place a market order and immediately create trade and position
	 * Body: accountId, instrumentId, side ('buy'|'sell'), lotSize, slPrice?, tpPrice?
	 * Note: price field is removed - current price is fetched automatically
	 */
	static async executeMarketOrder(req, res) {
		try {
			const { accountId, instrumentId, side, lotSize, sl = null, tp = null } = req.body || {};
			if (!accountId || !instrumentId || !side || !lotSize) {
				return res.status(400).json({ error: 'accountId, instrumentId, side, lotSize are required' });
			}

			// Get current price automatically
			let finalPrice;
			try {
				logger.info(`Fetching current price for market order execution - instrumentId: ${instrumentId}`);
				finalPrice = await PriceService.getCurrentPrice(instrumentId);
				logger.info(`Current price fetched: ${finalPrice}`);
			} catch (error) {
				logger.error('Failed to fetch current price for market order execution:', error);
				return res.status(400).json({ 
					error: `Failed to fetch current price for market order: ${error.message}` 
				});
			}

			// 1) Create pending market order
			const orderType = side === 'buy' ? 'marketBuy' : 'marketSell';
			const orderData = {
				account_id: accountId,
				instrument_id: instrumentId,
				order_type: orderType,
				lot_size: lotSize,
				status: OrderStatus.PENDING,
				price: finalPrice,
				sl_price: sl,
				tp_price: tp
			};
			const placedOrder = await orderRepository.placeOrder(orderData);

			// 2) Fill the order at current price
			const filledOrder = await orderRepository.fillOrder(placedOrder.id, finalPrice);

			// 3) Create trade
			const trade = await tradeRepository.createTrade({
				orderId: filledOrder.id,
				accountId: accountId,
				symbolId: instrumentId,
				side: side,
				quantity: lotSize,
				price: finalPrice,
				fee: null
			});

			// 4) Create position
			const positionType = side === 'buy' ? PositionType.BUY : PositionType.SELL;
			const position = await positionRepository.createPosition({
				accountId: accountId,
				instrumentId: instrumentId,
				positionType: positionType,
				lotSize: lotSize,
				entryPrice: finalPrice,
				slPrice: sl,
				tpPrice: tp,
				marginUsed: 0 // optionally compute margin here if needed
			});

			return res.status(201).json({ 
				order: filledOrder, 
				trade, 
				position,
				executedPrice: finalPrice 
			});
		} catch (error) {
			logger.error('executeMarketOrder failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	/**
	 * Filter orders for a specific account (same as getAll but without pagination if not provided)
	 */
	static async filterOrders(req, res) {
		try {
			const { accountId } = req.params;
			if (!accountId) return res.status(400).json({ error: 'accountId is required' });

			const allowed = ['status', 'instrument_id', 'order_type'];
			const rawFilters = req.body?.filters || req.query || {};
			const filters = { account_id: accountId };
			for (const key of allowed) {
				if (rawFilters[key] !== undefined) filters[key] = rawFilters[key];
			}

			const page = rawFilters.page ? parseInt(rawFilters.page, 10) : null;
			const limit = rawFilters.limit ? parseInt(rawFilters.limit, 10) : null;

			if (page && limit) {
				const result = await orderRepository.getOrdersWithPagination(page, limit, filters);
				return res.json(result);
			}

			const orders = await orderRepository.findAllWithInstrumentDetails(filters);
			return res.json(orders);
		} catch (error) {
			logger.error('filterOrders failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	/**
	 * Place a market order with automatic price fetching
	 * Body: accountId, instrumentId, side ('buy'|'sell'), lotSize, slPrice?, tpPrice?
	 */
	static async placeMarketOrder(req, res) {
		try {
			const { accountId, instrumentId, side, lotSize, sl = null, tp = null } = req.body || {};
			if (!accountId || !instrumentId || !side || !lotSize) {
				return res.status(400).json({ error: 'accountId, instrumentId, side, lotSize are required' });
			}

			// Validate side
			if (side !== 'buy' && side !== 'sell') {
				return res.status(400).json({ error: 'side must be either "buy" or "sell"' });
			}

			// Get current price
			let currentPrice;
			try {
				logger.info(`Fetching current price for market order - instrumentId: ${instrumentId}`);
				currentPrice = await PriceService.getCurrentPrice(instrumentId);
				logger.info(`Current price fetched: ${currentPrice}`);
			} catch (error) {
				logger.error('Failed to fetch current price for market order:', error);
				return res.status(400).json({ 
					error: `Failed to fetch current price for market order: ${error.message}` 
				});
			}

			// Create order data
			const orderType = side === 'buy' ? OrderType.MARKET_BUY : OrderType.MARKET_SELL;
			const orderData = {
				account_id: accountId,
				instrument_id: instrumentId,
				order_type: orderType,
				lot_size: lotSize,
				status: OrderStatus.PENDING,
				price: currentPrice,
				sl_price: sl,
				tp_price: tp
			};

			// 1) Place pending market order
			const placedOrder = await orderRepository.placeOrder(orderData);

			// 2) Fill order at current price
			const filledOrder = await orderRepository.fillOrder(placedOrder.id, currentPrice);

			// 3) Create trade
			const trade = await tradeRepository.createTrade({
				orderId: filledOrder.id,
				accountId: accountId,
				symbolId: instrumentId,
				side: side,
				quantity: lotSize,
				price: currentPrice,
				fee: null
			});

			// 4) Create position
			const positionType = side === 'buy' ? PositionType.BUY : PositionType.SELL;
			const position = await positionRepository.createPosition({
				accountId: accountId,
				instrumentId: instrumentId,
				positionType: positionType,
				lotSize: lotSize,
				entryPrice: currentPrice,
				slPrice: sl,
				tpPrice: tp,
				marginUsed: 0
			});

			return res.status(201).json({ 
				order: filledOrder, 
				trade, 
				position,
				executedPrice: currentPrice,
				message: `Market ${side} order executed at ${currentPrice}`
			});
		} catch (error) {
			logger.error('placeMarketOrder failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	/**
	 * Get current price for an instrument
	 * Query: instrumentId
	 */
	static async getCurrentPrice(req, res) {
		try {
			const { instrumentId } = req.params;
			if (!instrumentId) {
				return res.status(400).json({ error: 'instrumentId is required' });
			}

			const price = await PriceService.getCurrentPrice(parseInt(instrumentId, 10));
			return res.json({ 
				instrumentId: parseInt(instrumentId, 10), 
				currentPrice: price,
				timestamp: new Date().toISOString()
			});
		} catch (error) {
			logger.error('getCurrentPrice failed', error);
			return res.status(400).json({ error: error.message });
		}
	}
}

export default OrderController;


