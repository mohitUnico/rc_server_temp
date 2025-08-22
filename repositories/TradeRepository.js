/**
 * Trade repository for handling trade data operations with retry logic
 */

import BaseRepository from './BaseRepository.js';
import Trade from '../models/Trade.js';

class TradeRepository extends BaseRepository {
  constructor() {
    super('trades');
  }

  /**
   * Create a new trade with retry logic (matching Flutter createTrade)
   */
  async createTrade({
    orderId,
    accountId,
    symbolId,
    side,
    quantity,
    price,
    fee
  }) {
    try {
      const data = {
        order_id: orderId,
        account_id: accountId,
        symbol_id: symbolId,
        side: side,
        quantity: quantity,
        price: price,
        fee: fee,
        executed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const result = await this.create(data);
      return Trade.fromDatabase(result);
    } catch (error) {
      console.error('Error creating trade:', error);
      throw error;
    }
  }

  /**
   * Get all trades for an account with retry logic and instrument details (matching Flutter getTradesByAccount)
   */
  async findTradesByAccountId(accountId, options = {}) {
    try {
      const filters = { account_id: accountId };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      const trades = result.map(trade => Trade.fromDatabase(trade));
      return await this.enrichTradesWithInstrumentDetails(trades);
    } catch (error) {
      console.error('Error finding trades by account ID:', error);
      throw error;
    }
  }

  /**
   * Get trades for a specific order with retry logic and instrument details (matching Flutter getTradesByOrder)
   */
  async findTradesByOrderId(orderId, options = {}) {
    try {
      const filters = { order_id: orderId };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      const trades = result.map(trade => Trade.fromDatabase(trade));
      return await this.enrichTradesWithInstrumentDetails(trades);
    } catch (error) {
      console.error('Error finding trades by order ID:', error);
      throw error;
    }
  }

  /**
   * Get trades for a specific symbol with retry logic and instrument details (matching Flutter getTradesBySymbol)
   */
  async findTradesBySymbolId(accountId, symbolId, options = {}) {
    try {
      const filters = { 
        account_id: accountId,
        symbol_id: symbolId
      };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      const trades = result.map(trade => Trade.fromDatabase(trade));
      return await this.enrichTradesWithInstrumentDetails(trades);
    } catch (error) {
      console.error('Error finding trades by symbol ID:', error);
      throw error;
    }
  }

  /**
   * Get trade by ID with retry logic and instrument details (matching Flutter getTradeById)
   */
  async findTradeById(id) {
    try {
      const result = await this.findById(id);
      if (!result) return null;
      
      const trade = Trade.fromDatabase(result);
      return await this.enrichTradeWithInstrumentDetails(trade);
    } catch (error) {
      console.error('Error finding trade by ID:', error);
      return null; // Return null if trade not found (matching Flutter behavior)
    }
  }

  /**
   * Update trade with retry logic (matching Flutter updateTrade)
   */
  async updateTrade(id, updates) {
    try {
      const result = await this.updateById(id, updates);
      return Trade.fromDatabase(result);
    } catch (error) {
      console.error('Error updating trade:', error);
      throw error;
    }
  }

  /**
   * Delete trade with retry logic (matching Flutter deleteTrade)
   */
  async deleteTrade(id) {
    try {
      return await this.deleteById(id);
    } catch (error) {
      console.error('Error deleting trade:', error);
      throw error;
    }
  }

  /**
   * Get total quantity traded for an order (matching Flutter getTotalQuantityForOrder)
   */
  async getTotalQuantityForOrder(orderId) {
    try {
      const response = await this.supabase
        .from('trades')
        .select('quantity')
        .eq('order_id', orderId);

      let total = 0;
      for (const trade of response) {
        total += (trade.quantity || 0);
      }
      return total;
    } catch (error) {
      console.error('Error getting total quantity for order:', error);
      throw error;
    }
  }

  /**
   * Find trades by side (buy/sell) with instrument details
   */
  async findTradesBySide(side, options = {}) {
    try {
      const filters = { side };
      const result = await this.findAll(filters, {
        ...options,
        orderBy: { column: 'created_at', ascending: false }
      });
      const trades = result.map(trade => Trade.fromDatabase(trade));
      return await this.enrichTradesWithInstrumentDetails(trades);
    } catch (error) {
      console.error('Error finding trades by side:', error);
      throw error;
    }
  }

  /**
   * Find buy trades
   */
  async findBuyTrades(options = {}) {
    return this.findTradesBySide('buy', options);
  }

  /**
   * Find sell trades
   */
  async findSellTrades(options = {}) {
    return this.findTradesBySide('sell', options);
  }

  /**
   * Find trades by date range
   */
  async findTradesByDateRange(startDate, endDate, options = {}) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .gte('executed_at', startDate.toISOString())
        .lte('executed_at', endDate.toISOString());

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
      } else {
        query = query.order('executed_at', { ascending: false });
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
        throw new Error(`Failed to find trades by date range: ${error.message}`);
      }

      return data.map(trade => Trade.fromDatabase(trade));
    } catch (error) {
      console.error('Error finding trades by date range:', error);
      throw error;
    }
  }

  /**
   * Get trades with pagination and instrument details
   */
  async getTradesWithPagination(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      const options = {
        limit,
        offset,
        orderBy: { column: 'executed_at', ascending: false }
      };

      const result = await this.findAll(filters, options);
      const trades = result.map(trade => Trade.fromDatabase(trade));
      const enrichedTrades = await this.enrichTradesWithInstrumentDetails(trades);
      
      const totalCount = await this.count(filters);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        trades: enrichedTrades,
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
      console.error('Error getting trades with pagination:', error);
      throw error;
    }
  }

  /**
   * Get trade statistics
   */
  async getTradeStatistics(accountId = null) {
    try {
      const filters = accountId ? { account_id: accountId } : {};
      
      const allTrades = await this.findAll(filters);
      const trades = allTrades.map(trade => Trade.fromDatabase(trade));

      const totalValue = trades.reduce((sum, trade) => sum + trade.getTotalValue(), 0);
      const totalFees = trades.reduce((sum, trade) => sum + trade.fee, 0);
      const netValue = trades.reduce((sum, trade) => sum + trade.getNetValue(), 0);

      const buyTrades = trades.filter(trade => trade.isBuy());
      const sellTrades = trades.filter(trade => trade.isSell());

      const stats = {
        total: trades.length,
        buy: buyTrades.length,
        sell: sellTrades.length,
        totalValue,
        totalFees,
        netValue,
        averageTradeValue: trades.length > 0 ? totalValue / trades.length : 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting trade statistics:', error);
      throw error;
    }
  }

  /**
   * Get trade volume by symbol
   */
  async getTradeVolumeBySymbol(accountId = null) {
    try {
      const filters = accountId ? { account_id: accountId } : {};
      
      const allTrades = await this.findAll(filters);
      const trades = allTrades.map(trade => Trade.fromDatabase(trade));

      const volumeBySymbol = {};
      
      trades.forEach(trade => {
        if (!volumeBySymbol[trade.symbolId]) {
          volumeBySymbol[trade.symbolId] = {
            symbolId: trade.symbolId,
            totalVolume: 0,
            totalValue: 0,
            tradeCount: 0
          };
        }
        
        volumeBySymbol[trade.symbolId].totalVolume += trade.quantity;
        volumeBySymbol[trade.symbolId].totalValue += trade.getTotalValue();
        volumeBySymbol[trade.symbolId].tradeCount += 1;
      });

      return Object.values(volumeBySymbol);
    } catch (error) {
      console.error('Error getting trade volume by symbol:', error);
      throw error;
    }
  }

  /**
   * Find all trades with instrument details enrichment
   */
  async findAllWithInstrumentDetails(filters = {}, options = {}) {
    try {
      const result = await this.findAll(filters, options);
      const trades = result.map(trade => Trade.fromDatabase(trade));
      return await this.enrichTradesWithInstrumentDetails(trades);
    } catch (error) {
      console.error('Error finding all trades with instrument details:', error);
      throw error;
    }
  }

  /**
   * Enrich a single trade with instrument details
   */
  async enrichTradeWithInstrumentDetails(trade) {
    try {
      if (!trade.symbolId) {
        return trade;
      }

      // Import InstrumentRepository dynamically to avoid circular dependencies
      const { default: InstrumentRepository } = await import('./InstrumentRepository.js');
      const instrumentRepo = new InstrumentRepository();
      
      const instrument = await instrumentRepo.findInstrumentById(trade.symbolId);
      
      if (instrument) {
        // Add instrument details to the trade object while preserving the Trade model instance
        trade.instrument = {
          id: instrument.id,
          symbol: instrument.symbol,
          name: instrument.name,
          category: instrument.category,
          status: instrument.status
        };
      }
      
      return trade;
    } catch (error) {
      console.error('Error enriching trade with instrument details:', error);
      return trade; // Return original trade if enrichment fails
    }
  }

  /**
   * Enrich multiple trades with instrument details
   */
  async enrichTradesWithInstrumentDetails(trades) {
    try {
      if (!trades || trades.length === 0) {
        return trades;
      }

      // Import InstrumentRepository dynamically to avoid circular dependencies
      const { default: InstrumentRepository } = await import('./InstrumentRepository.js');
      const instrumentRepo = new InstrumentRepository();
      
      // Get unique symbol IDs to minimize database queries
      const symbolIds = [...new Set(trades.map(trade => trade.symbolId).filter(id => id))];
      
      // Fetch all instruments in one query
      const instruments = {};
      for (const symbolId of symbolIds) {
        const instrument = await instrumentRepo.findInstrumentById(symbolId);
        if (instrument) {
          instruments[symbolId] = {
            id: instrument.id,
            symbol: instrument.symbol,
            name: instrument.name,
            category: instrument.category,
            status: instrument.status
          };
        }
      }
      
      // Enrich each trade with instrument details while preserving Trade model instances
      trades.forEach(trade => {
        if (trade.symbolId && instruments[trade.symbolId]) {
          trade.instrument = instruments[trade.symbolId];
        }
      });
      
      return trades;
    } catch (error) {
      console.error('Error enriching trades with instrument details:', error);
      return trades; // Return original trades if enrichment fails
    }
  }
}

export default TradeRepository;

