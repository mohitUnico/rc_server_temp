import { Logger } from '../utils/logger.js';

const logger = new Logger('PriceCacheService');

/**
 * In-memory cache for storing latest prices from WebSocket data
 */
class PriceCacheService {
  constructor() {
    // Cache structure: { assetType: { symbol: { price, timestamp, data } } }
    this.priceCache = {
      forex: new Map(),
      crypto: new Map(),
      indices: new Map()
    };
  }

  /**
   * Update price for a symbol from WebSocket data
   */
  updatePrice(assetType, symbol, price, data = {}) {
    try {
      if (!this.priceCache[assetType]) {
        this.priceCache[assetType] = new Map();
      }

      const priceData = {
        price: parseFloat(price),
        timestamp: Date.now(),
        data: data
      };

      this.priceCache[assetType].set(symbol, priceData);
      
      logger.debug(`Updated price for ${symbol} (${assetType}): ${price}`);
    } catch (error) {
      logger.error(`Error updating price for ${symbol} (${assetType}):`, error);
    }
  }

  /**
   * Get current price for a symbol
   */
  getCurrentPrice(assetType, symbol) {
    try {
      if (!this.priceCache[assetType]) {
        return null;
      }

      const priceData = this.priceCache[assetType].get(symbol);
      if (!priceData) {
        return null;
      }

      // Check if price is stale (older than 5 seconds)
      const now = Date.now();
      const age = now - priceData.timestamp;
      if (age > 5000) {
        logger.warn(`Price for ${symbol} (${assetType}) is stale (${age}ms old)`);
        return null;
      }

      return priceData.price;
    } catch (error) {
      logger.error(`Error getting price for ${symbol} (${assetType}):`, error);
      return null;
    }
  }

  /**
   * Get current price for a symbol by instrument ID
   * This requires looking up the symbol from the instrument ID
   */
  async getCurrentPriceByInstrumentId(instrumentId) {
    try {
      // Import here to avoid circular dependencies
      const InstrumentRepository = (await import('../repositories/InstrumentRepository.js')).default;
      const instrumentRepository = new InstrumentRepository();
      
      const instrument = await instrumentRepository.findInstrumentById(instrumentId);
      if (!instrument) {
        logger.warn(`Instrument with ID ${instrumentId} not found`);
        return null;
      }

      const { symbol } = instrument;
      
      // Auto-detect asset type based on symbol pattern
      let assetType;
      if (symbol.includes('USDT') || symbol.includes('BTC') || symbol.includes('ETH')) {
        assetType = 'crypto';
      } else if (symbol.includes('XAU') || symbol.includes('XAG') || symbol.includes('XPD') || symbol.includes('XPT')) {
        assetType = 'forex'; // Metals are typically handled by forex API
      } else if (symbol.length === 6 && symbol.match(/^[A-Z]{6}$/)) {
        assetType = 'forex';
      } else {
        assetType = 'forex'; // Default to forex
      }

      return this.getCurrentPrice(assetType, symbol);
    } catch (error) {
      logger.error(`Error getting price for instrument ${instrumentId}:`, error);
      return null;
    }
  }

  /**
   * Get all cached prices for an asset type
   */
  getAllPrices(assetType) {
    try {
      if (!this.priceCache[assetType]) {
        return {};
      }

      const prices = {};
      for (const [symbol, priceData] of this.priceCache[assetType].entries()) {
        prices[symbol] = {
          price: priceData.price,
          timestamp: priceData.timestamp,
          age: Date.now() - priceData.timestamp
        };
      }

      return prices;
    } catch (error) {
      logger.error(`Error getting all prices for ${assetType}:`, error);
      return {};
    }
  }

  /**
   * Get all cached prices across all asset types
   */
  getAllPricesAllTypes() {
    try {
      const allPrices = {};
      
      for (const assetType of ['forex', 'crypto', 'indices']) {
        allPrices[assetType] = this.getAllPrices(assetType);
      }

      return allPrices;
    } catch (error) {
      logger.error('Error getting all prices:', error);
      return {};
    }
  }

  /**
   * Check if a symbol has a valid price
   */
  hasValidPrice(assetType, symbol) {
    try {
      const price = this.getCurrentPrice(assetType, symbol);
      return price !== null && price > 0;
    } catch (error) {
      logger.error(`Error checking price validity for ${symbol} (${assetType}):`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    try {
      const stats = {
        forex: this.priceCache.forex.size,
        crypto: this.priceCache.crypto.size,
        indices: this.priceCache.indices.size
      };

      stats.total = stats.forex + stats.crypto + stats.indices;
      
      // Calculate average age of prices
      let totalAge = 0;
      let priceCount = 0;
      const now = Date.now();

      for (const assetType of ['forex', 'crypto', 'indices']) {
        for (const [symbol, priceData] of this.priceCache[assetType].entries()) {
          totalAge += (now - priceData.timestamp);
          priceCount++;
        }
      }

      stats.averageAge = priceCount > 0 ? totalAge / priceCount : 0;
      stats.priceCount = priceCount;

      return stats;
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return { total: 0, averageAge: 0, priceCount: 0 };
    }
  }

  /**
   * Clear stale prices (older than 10 seconds)
   */
  clearStalePrices() {
    try {
      const now = Date.now();
      const staleThreshold = 10000; // 10 seconds

      for (const assetType of ['forex', 'crypto', 'indices']) {
        for (const [symbol, priceData] of this.priceCache[assetType].entries()) {
          if (now - priceData.timestamp > staleThreshold) {
            this.priceCache[assetType].delete(symbol);
            logger.debug(`Cleared stale price for ${symbol} (${assetType})`);
          }
        }
      }
    } catch (error) {
      logger.error('Error clearing stale prices:', error);
    }
  }

  /**
   * Clear all prices
   */
  clearAllPrices() {
    try {
      this.priceCache = {
        forex: new Map(),
        crypto: new Map(),
        indices: new Map()
      };
      logger.info('Cleared all cached prices');
    } catch (error) {
      logger.error('Error clearing all prices:', error);
    }
  }
}

// Create a singleton instance
const priceCacheService = new PriceCacheService();

export default priceCacheService; 
