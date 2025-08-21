import { Logger } from '../utils/logger.js';
import priceCacheService from './priceCacheService.js';
import OrderRepository from '../repositories/OrderRepository.js';
import PositionRepository from '../repositories/PositionRepository.js';
import { OrderStatus, OrderType } from '../enums/orderEnums.js';
import { PositionType } from '../enums/positionEnums.js';

const logger = new Logger('PendingOrderService');
const orderRepository = new OrderRepository();
const positionRepository = new PositionRepository();

/**
 * Service for monitoring and automatically filling pending orders when limit prices are met
 */
class PendingOrderService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
    this.checkIntervalMs = 100; // 0.1 seconds as requested
  }

  /**
   * Start the pending order monitoring service
   */
  start() {
    if (this.isRunning) {
      logger.warn('Pending order service is already running');
      return;
    }

    logger.info('Starting pending order service');
    this.isRunning = true;
    this.checkInterval = setInterval(() => {
      this.checkPendingOrders();
    }, this.checkIntervalMs);
  }

  /**
   * Stop the pending order monitoring service
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Pending order service is not running');
      return;
    }

    logger.info('Stopping pending order service');
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check all pending orders for limit price triggers
   */
  async checkPendingOrders() {
    try {
      // Get all pending orders
      const pendingOrders = await orderRepository.findPendingOrders();
      
      if (pendingOrders.length === 0) {
        return; // No pending orders to check
      }

      logger.debug(`Checking ${pendingOrders.length} pending orders for limit price triggers`);

      // Process each order
      for (const order of pendingOrders) {
        await this.checkOrder(order);
      }
    } catch (error) {
      logger.error('Error checking pending orders:', error);
    }
  }

  /**
   * Check a single order for limit price trigger
   */
  async checkOrder(order) {
    try {
      // Get current price for the instrument from WebSocket cache
      const currentPrice = await priceCacheService.getCurrentPriceByInstrumentId(order.instrumentId);
      
      // if (!currentPrice) {
      //   logger.warn(`Could not get current price for instrument ${order.instrumentId} from WebSocket cache`);
      //   return;
      // }

      logger.debug(`Order ${order.id}: Current price ${currentPrice}, Limit: ${order.limitValue}, Order type: ${order.orderType}`);

      // Check if limit price is met based on order type
      if (this.isLimitPriceMet(order, currentPrice)) {
        logger.info(`Limit price met for order ${order.id} at price ${currentPrice}`);
        await this.fillOrder(order, currentPrice);
      }

    } catch (error) {
      logger.error(`Error checking order ${order.id}:`, error);
    }
  }

  /**
   * Check if limit price is met based on order type
   */
  isLimitPriceMet(order, currentPrice) {
    if (!order.limitValue) {
      return false; // No limit value set
    }

    const limitPrice = parseFloat(order.limitValue);
    const price = parseFloat(currentPrice);

    switch (order.orderType) {
      case OrderType.BUY_LIMIT:
        // Buy limit: fill when current price <= limit price
        return price <= limitPrice;
      
      case OrderType.SELL_LIMIT:
        // Sell limit: fill when current price >= limit price
        return price >= limitPrice;
      
      case OrderType.BUY_STOP:
        // Buy stop: fill when current price >= limit price
        return price >= limitPrice;
      
      case OrderType.SELL_STOP:
        // Sell stop: fill when current price <= limit price
        return price <= limitPrice;
      
      case OrderType.BUY_STOP_LIMIT:
        // Buy stop limit: fill when current price >= stop price AND <= limit price
        // For simplicity, we'll use the limit value as the trigger price
        return price >= limitPrice;
      
      case OrderType.SELL_STOP_LIMIT:
        // Sell stop limit: fill when current price <= stop price AND >= limit price
        // For simplicity, we'll use the limit value as the trigger price
        return price <= limitPrice;
      
      default:
        logger.warn(`Unknown order type: ${order.orderType}`);
        return false;
    }
  }

  /**
   * Fill an order and create corresponding position
   */
  async fillOrder(order, fillPrice) {
    try {
      logger.info(`Filling order ${order.id} at price ${fillPrice}`);

      // Fill the order using the repository
      const filledOrder = await orderRepository.fillOrder(order.id, fillPrice);
      
      logger.info(`Successfully filled order ${order.id}`);

      // Create a position based on the filled order
      await this.createPositionFromOrder(filledOrder, fillPrice);

    } catch (error) {
      logger.error(`Error filling order ${order.id}:`, error);
    }
  }

  /**
   * Create a position from a filled order
   */
  async createPositionFromOrder(order, fillPrice) {
    try {
      // Determine position type based on order type
      let positionType;
      switch (order.orderType) {
        case OrderType.BUY_LIMIT:
        case OrderType.BUY_STOP:
        case OrderType.BUY_STOP_LIMIT:
          positionType = PositionType.BUY;
          break;
        
        case OrderType.SELL_LIMIT:
        case OrderType.SELL_STOP:
        case OrderType.SELL_STOP_LIMIT:
          positionType = PositionType.SELL;
          break;
        
        default:
          logger.warn(`Cannot create position for order type: ${order.orderType}`);
          return;
      }

      // Calculate margin used (you might want to implement proper margin calculation)
      const marginUsed = this.calculateMarginUsed(order, fillPrice);

      // Create the position
      const position = await positionRepository.createPosition({
        accountId: order.accountId,
        instrumentId: order.instrumentId,
        positionType: positionType,
        lotSize: order.lotSize,
        entryPrice: fillPrice,
        slPrice: order.slPrice,
        tpPrice: order.tpPrice,
        marginUsed: marginUsed
      });

      logger.info(`Created position ${position.id} from filled order ${order.id}`);

    } catch (error) {
      logger.error(`Error creating position from order ${order.id}:`, error);
    }
  }

  /**
   * Calculate margin used for a position
   * This is a simplified calculation - you might want to implement proper margin calculation
   */
  calculateMarginUsed(order, fillPrice) {
    // Simplified margin calculation: lot size * fill price * leverage factor
    // You should implement proper margin calculation based on your trading rules
    const leverageFactor = 0.01; // 1% margin requirement (adjust as needed)
    return order.lotSize * fillPrice * leverageFactor;
  }

  /**
   * Check pending orders for a specific account
   */
  async checkPendingOrdersForAccount(accountId) {
    try {
      const pendingOrders = await orderRepository.findPendingOrders(accountId);
      
      if (pendingOrders.length === 0) {
        return;
      }

      logger.debug(`Checking ${pendingOrders.length} pending orders for account ${accountId}`);

      for (const order of pendingOrders) {
        await this.checkOrder(order);
      }
    } catch (error) {
      logger.error(`Error checking pending orders for account ${accountId}:`, error);
    }
  }

  /**
   * Check pending orders for a specific instrument
   */
  async checkPendingOrdersForInstrument(accountId, instrumentId) {
    try {
      const orders = await orderRepository.findOrdersByInstrument(accountId, instrumentId);
      const pendingOrders = orders.filter(order => order.isPending());
      
      if (pendingOrders.length === 0) {
        return;
      }

      logger.debug(`Checking ${pendingOrders.length} pending orders for instrument ${instrumentId}`);

      for (const order of pendingOrders) {
        await this.checkOrder(order);
      }
    } catch (error) {
      logger.error(`Error checking pending orders for instrument ${instrumentId}:`, error);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkIntervalMs: this.checkIntervalMs,
      lastCheck: this.lastCheck
    };
  }

  /**
   * Update check interval
   */
  setCheckInterval(intervalMs) {
    if (this.isRunning) {
      this.stop();
      this.checkIntervalMs = intervalMs;
      this.start();
    } else {
      this.checkIntervalMs = intervalMs;
    }
    logger.info(`Pending order check interval updated to ${intervalMs}ms`);
  }

  /**
   * Manually trigger order check (useful for testing)
   */
  async triggerCheck() {
    if (!this.isRunning) {
      logger.warn('Service is not running, cannot trigger check');
      return;
    }
    
    logger.info('Manually triggering pending order check');
    await this.checkPendingOrders();
  }
}

// Create a singleton instance
const pendingOrderService = new PendingOrderService();

export default pendingOrderService;
