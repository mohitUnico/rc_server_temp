/**
 * Order repository for handling order data operations with retry logic
 */

import BaseRepository from './BaseRepository.js';
import Order from '../models/Order.js';
import { OrderStatus } from '../enums/orderEnums.js';

class OrderRepository extends BaseRepository {
  constructor() {
    super('orders');
  }

  /**
   * Place a new order with retry logic (matching Flutter placeOrder)
   */
  async placeOrder(orderData) {
    try {
      const order = new Order(orderData);
      const validation = order.validate();
      
      if (!validation.isValid) {
        throw new Error(`Order validation failed: ${validation.errors.join(', ')}`);
      }

      const dbData = order.toDatabaseFormat();
      // Generate a unique ID since the database column is NOT NULL without default
      if (!dbData.id) {
        dbData.id = Date.now() + Math.floor(Math.random() * 1000);
      }
      const result = await this.create(dbData);
      
      return Order.fromDatabase(result);
    } catch (error) {
      console.log('Order placement failed:', error.message);
      
      // Provide more specific error messages (matching Flutter patterns)
      if (error.message.includes('network') || error.message.includes('connectivity')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
        throw new Error('Authentication error. Please log in again.');
      } else if (error.message.includes('forbidden') || error.message.includes('403')) {
        throw new Error('Access denied. Please check your account permissions.');
      } else {
        throw new Error(`Failed to place order. Please try again. Error: ${error.message}`);
      }
    }
  }

  /**
   * Place order with retry (matching Flutter placeOrderWithRetry)
   */
  async placeOrderWithRetry(orderData) {
    return this.placeOrder(orderData);
  }

  /**
   * Find order by ID with retry logic
   */
  async findOrderById(id) {
    try {
      const result = await this.findById(id);
      return result ? Order.fromDatabase(result) : null;
    } catch (error) {
      console.error('Error finding order by ID:', error);
      throw error;
    }
  }

  /**
   * Find orders by account ID with retry logic (matching Flutter getOrdersByAccount)
   */
  async findOrdersByAccountId(accountId, options = {}) {
    try {
      const filters = { account_id: accountId };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      return result.map(order => Order.fromDatabase(order));
    } catch (error) {
      console.error('Error finding orders by account ID:', error);
      throw error;
    }
  }

  /**
   * Find orders by status with retry logic (matching Flutter getOrdersByStatus)
   */
  async findOrdersByStatus(status, accountId = null, options = {}) {
    try {
      const filters = { status };
      if (accountId) {
        filters.account_id = accountId;
      }
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      return result.map(order => Order.fromDatabase(order));
    } catch (error) {
      console.error('Error finding orders by status:', error);
      throw error;
    }
  }

  /**
   * Find placed orders (matching Flutter getPlacedOrders)
   */
  async findPlacedOrders(accountId = null, options = {}) {
    return this.findOrdersByStatus(OrderStatus.PLACED, accountId, options);
  }

  /**
   * Find pending orders (matching Flutter getPendingOrders)
   */
  async findPendingOrders(accountId = null, options = {}) {
    return this.findOrdersByStatus(OrderStatus.PENDING, accountId, options);
  }

  /**
   * Find filled orders (matching Flutter getFilledOrders)
   */
  async findFilledOrders(accountId = null, options = {}) {
    return this.findOrdersByStatus(OrderStatus.FILLED, accountId, options);
  }

  /**
   * Find cancelled orders (matching Flutter getCancelledOrders)
   */
  async findCancelledOrders(accountId = null, options = {}) {
    return this.findOrdersByStatus(OrderStatus.CANCELLED, accountId, options);
  }

  /**
   * Update order with retry logic (matching Flutter updateOrder)
   */
  async updateOrder(id, updates) {
    try {
      const result = await this.updateById(id, updates);
      return Order.fromDatabase(result);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  /**
   * Fill order with retry logic (matching Flutter fillOrder)
   */
  async fillOrder(id, fillPrice) {
    try {
      const updates = {
        status: OrderStatus.FILLED,
        price: fillPrice,
        filled_at: new Date().toISOString()
      };
      
      const result = await this.updateById(id, updates);
      return Order.fromDatabase(result);
    } catch (error) {
      console.error('Error filling order:', error);
      throw error;
    }
  }

  /**
   * Cancel order with retry logic (matching Flutter cancelOrder)
   */
  async cancelOrder(id) {
    try {
      console.log(`[OrderRepository] Cancelling order ${id}, setting status to: ${OrderStatus.CANCELLED}`);
      
      // First verify the order exists
      const existingOrder = await this.findOrderById(id);
      if (!existingOrder) {
        throw new Error(`Order with ID ${id} not found`);
      }
      
      console.log(`[OrderRepository] Found order ${id} with current status: ${existingOrder.status}`);
      
      const updates = { status: OrderStatus.CANCELLED };
      const result = await this.updateById(id, updates);
      
      console.log(`[OrderRepository] Order cancelled successfully`);
      return Order.fromDatabase(result);
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Reject order with retry logic (matching Flutter rejectOrder)
   */
  async rejectOrder(id) {
    try {
      const updates = { status: OrderStatus.REJECTED };
      const result = await this.updateById(id, updates);
      return Order.fromDatabase(result);
    } catch (error) {
      console.error('Error rejecting order:', error);
      throw error;
    }
  }

  /**
   * Delete order with retry logic (matching Flutter deleteOrder)
   */
  async deleteOrder(id) {
    try {
      return await this.deleteById(id);
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }

  /**
   * Find orders by instrument with retry logic (matching Flutter getOrdersByInstrument)
   */
  async findOrdersByInstrument(accountId, instrumentId, options = {}) {
    try {
      const filters = { 
        account_id: accountId,
        instrument_id: instrumentId
      };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      return result.map(order => Order.fromDatabase(order));
    } catch (error) {
      console.error('Error finding orders by instrument:', error);
      throw error;
    }
  }

  /**
   * Modify order with retry logic (matching Flutter modifyOrder)
   */
  async modifyOrder(id, { limitValue, slPrice, tpPrice }) {
    try {
      const updates = {};
      if (limitValue !== undefined) updates.limit_value = limitValue;
      if (slPrice !== undefined) updates.sl_price = slPrice;
      if (tpPrice !== undefined) updates.tp_price = tpPrice;

      if (Object.keys(updates).length > 0) {
        const result = await this.updateById(id, updates);
        return Order.fromDatabase(result);
      }
      
      return await this.findOrderById(id);
    } catch (error) {
      console.error('Error modifying order:', error);
      throw error;
    }
  }

  /**
   * Test database permissions (matching Flutter testDatabasePermissions)
   */
  async testDatabasePermissions() {
    try {
      console.log('[OrderRepository] Testing database permissions...');

      // Test read permission
      const testRead = await this.supabase.from('orders').select('id').limit(1);
      console.log('[OrderRepository] Read test successful:', testRead);

      // Test if we can update a simple field
      const testUpdate = await this.supabase
        .from('orders')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', 1) // Use a test order ID
        .select();
      console.log('[OrderRepository] Update test result:', testUpdate);
    } catch (error) {
      console.log('[OrderRepository] Database permission test failed:', error.message);
    }
  }

  /**
   * Get orders with pagination
   */
  async getOrdersWithPagination(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      const options = {
        limit,
        offset,
        orderBy: { column: 'created_at', ascending: false }
      };

      const result = await this.findAll(filters, options);
      const orders = result.map(order => Order.fromDatabase(order));
      
      const totalCount = await this.count(filters);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        orders,
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
      console.error('Error getting orders with pagination:', error);
      throw error;
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStatistics(accountId = null) {
    try {
      const filters = accountId ? { account_id: accountId } : {};
      
      const allOrders = await this.findAll(filters);
      const orders = allOrders.map(order => Order.fromDatabase(order));

      const stats = {
        total: orders.length,
        pending: orders.filter(order => order.isPending()).length,
        filled: orders.filter(order => order.isFilled()).length,
        cancelled: orders.filter(order => order.isCancelled()).length,
        rejected: orders.filter(order => order.isRejected()).length
      };

      return stats;
    } catch (error) {
      console.error('Error getting order statistics:', error);
      throw error;
    }
  }
}

export default OrderRepository;

