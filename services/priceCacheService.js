import { Logger } from '../utils/logger.js';

const logger = new Logger('PriceCacheService');

/**
 * In-memory cache for storing latest prices from WebSocket data
 * TEMPORARY: Currently limited to 3 forex symbols (EURUSD, GBPUSD, USDJPY) for testing
 */
class PriceCacheService {
  constructor() {
    // Cache structure: { assetType: { symbol: { price, timestamp, data } } }
    this.priceCache = {
      forex: new Map(),
      crypto: new Map(),
      indices: new Map()
    };

    // Track forex symbol statistics
    this.forexStats = {
      totalSymbols: 0,
      activeSymbols: 0,
      lastUpdate: null
    };

    // Start periodic logging of forex price cache
    this.startPeriodicLogging();
  }

  /**
   * Start periodic logging of forex price cache every minute
   * TEMPORARY: Currently limited to 3 symbols for testing
   */
  startPeriodicLogging() {
    // Log every minute (60000ms)
    this.loggingInterval = setInterval(() => {
      this.logForexPriceCache();
    }, 60000);

    logger.info('Started periodic logging of forex price cache every minute (TEMPORARY: Limited to 3 symbols)');
  }

  /**
   * Stop periodic logging
   */
  stopPeriodicLogging() {
    if (this.loggingInterval) {
      clearInterval(this.loggingInterval);
      this.loggingInterval = null;
      logger.info('Stopped periodic logging of forex price cache');
    }
  }

  /**
   * Log the current state of forex price cache to terminal
   * TEMPORARY: Currently limited to 3 symbols for testing
   */
  logForexPriceCache() {
    try {
      const now = new Date().toISOString();
      const forexPrices = this.getAllPrices('forex');
      const symbolCount = Object.keys(forexPrices).length;

      if (symbolCount === 0) {
        console.log(`\n[${now}] 📊 Forex Price Cache: No symbols cached yet (TEMPORARY: Limited to 3 symbols)`);
        return;
      }

      console.log(`\n[${now}] 📊 Forex Price Cache Status (${symbolCount} symbols) [TEMPORARY: Limited to 3 symbols]:`);
      console.log('─'.repeat(80));

      // Group symbols by price ranges for better readability
      const priceRanges = {
        '0.1-1.0': [],
        '1.0-10.0': [],
        '10.0-100.0': [],
        '100.0+': []
      };

      Object.entries(forexPrices).forEach(([symbol, priceData]) => {
        const { price, age } = priceData;
        const ageSeconds = Math.round(age / 1000);
        const status = age < 10000 ? '🟢' : age < 30000 ? '🟡' : '🔴';

        if (price < 1.0) priceRanges['0.1-1.0'].push({ symbol, price, ageSeconds, status });
        else if (price < 10.0) priceRanges['1.0-10.0'].push({ symbol, price, ageSeconds, status });
        else if (price < 100.0) priceRanges['10.0-100.0'].push({ symbol, price, ageSeconds, status });
        else priceRanges['100.0+'].push({ symbol, price, ageSeconds, status });
      });

      // Log each price range
      Object.entries(priceRanges).forEach(([range, symbols]) => {
        if (symbols.length > 0) {
          console.log(`\n${range} (${symbols.length} symbols):`);
          symbols.forEach(({ symbol, price, ageSeconds, status }) => {
            const formattedPrice = price.toFixed(5);
            console.log(`  ${status} ${symbol}: ${formattedPrice} (${ageSeconds}s old)`);
          });
        }
      });

      // Log summary statistics
      const activeCount = Object.values(forexPrices).filter(p => p.age < 10000).length;
      const warningCount = Object.values(forexPrices).filter(p => p.age >= 10000 && p.age < 30000).length;
      const staleCount = Object.values(forexPrices).filter(p => p.age >= 30000).length;

      console.log('\n─'.repeat(80));
      console.log(`📈 Summary: Active: ${activeCount} | Warning: ${warningCount} | Stale: ${staleCount}`);
      console.log(`🕒 Last Update: ${this.forexStats.lastUpdate || 'Never'}`);
      console.log(`💾 Memory Usage: ${this.getMemoryUsageInfo()}`);

    } catch (error) {
      logger.error('Error logging forex price cache:', error);
    }
  }

  /**
   * Get memory usage information for the cache
   */
  getMemoryUsageInfo() {
    try {
      const memUsage = process.memoryUsage();
      const rssMB = Math.round(memUsage.rss / 1024 / 1024);
      const heapMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      return `RSS: ${rssMB}MB | Heap: ${heapMB}MB`;
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Manually trigger forex price cache logging (for testing/debugging)
   */
  triggerForexLogging() {
    this.logForexPriceCache();
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

      // Special handling for forex symbols
      if (assetType === 'forex') {
        this.updateForexStats(symbol, priceData);
        // TEMPORARY: Limited to 3 symbols for testing
        logger.debug(`Updated forex price for ${symbol}: ${price} (${this.priceCache.forex.size} symbols cached) [TEMPORARY: Limited to 3]`);
      } else {
        logger.debug(`Updated price for ${symbol} (${assetType}): ${price}`);
      }
    } catch (error) {
      logger.error(`Error updating price for ${symbol} (${assetType}):`, error);
    }
  }

  /**
   * Update forex-specific statistics
   */
  updateForexStats(symbol, priceData) {
    this.forexStats.totalSymbols = this.priceCache.forex.size;
    this.forexStats.lastUpdate = new Date().toISOString();

    // Count active symbols (prices less than 10 seconds old)
    const now = Date.now();
    let activeCount = 0;
    for (const [sym, data] of this.priceCache.forex.entries()) {
      if (now - data.timestamp < 10000) { // 10 seconds
        activeCount++;
      }
    }
    this.forexStats.activeSymbols = activeCount;
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

      // Check if price is stale (older than 10 seconds for forex, 5 seconds for others)
      const now = Date.now();
      const age = now - priceData.timestamp;
      const staleThreshold = assetType === 'forex' ? 10000 : 5000;

      if (age > staleThreshold) {
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
   * Get detailed forex price information
   */
  getForexPrices() {
    try {
      const forexPrices = this.getAllPrices('forex');
      const now = Date.now();

      // Add additional metadata for forex prices
      const detailedPrices = {};
      for (const [symbol, priceData] of Object.entries(forexPrices)) {
        const age = now - priceData.timestamp;
        detailedPrices[symbol] = {
          ...priceData,
          age,
          isActive: age < 10000, // Less than 10 seconds old
          formattedPrice: priceData.price.toFixed(5)
        };
      }

      return {
        prices: detailedPrices,
        stats: this.forexStats,
        totalSymbols: Object.keys(detailedPrices).length,
        activeSymbols: Object.values(detailedPrices).filter(p => p.isActive).length
      };
    } catch (error) {
      logger.error('Error getting forex prices:', error);
      return { prices: {}, stats: this.forexStats, totalSymbols: 0, activeSymbols: 0 };
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

      // Add forex-specific stats
      if (stats.forex > 0) {
        stats.forexStats = this.forexStats;
      }

      return stats;
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return { total: 0, averageAge: 0, priceCount: 0 };
    }
  }

  /**
   * Clear stale prices (older than 15 seconds for forex, 10 seconds for others)
   */
  clearStalePrices() {
    try {
      const now = Date.now();
      let clearedCount = 0;

      for (const assetType of ['forex', 'crypto', 'indices']) {
        const staleThreshold = assetType === 'forex' ? 15000 : 10000; // 15s for forex, 10s for others

        for (const [symbol, priceData] of this.priceCache[assetType].entries()) {
          if (now - priceData.timestamp > staleThreshold) {
            this.priceCache[assetType].delete(symbol);
            clearedCount++;
            logger.debug(`Cleared stale price for ${symbol} (${assetType})`);
          }
        }
      }

      if (clearedCount > 0) {
        logger.info(`Cleared ${clearedCount} stale prices`);
        // Update forex stats after clearing
        this.updateForexStats();
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

      // Reset forex stats
      this.forexStats = {
        totalSymbols: 0,
        activeSymbols: 0,
        lastUpdate: null
      };

      logger.info('Cleared all cached prices');
    } catch (error) {
      logger.error('Error clearing all prices:', error);
    }
  }

  /**
   * Get symbols with recent price updates (last 5 seconds)
   */
  getRecentPriceUpdates(assetType = 'forex', timeWindow = 5000) {
    try {
      if (!this.priceCache[assetType]) {
        return [];
      }

      const now = Date.now();
      const recentUpdates = [];

      for (const [symbol, priceData] of this.priceCache[assetType].entries()) {
        if (now - priceData.timestamp <= timeWindow) {
          recentUpdates.push({
            symbol,
            price: priceData.price,
            timestamp: priceData.timestamp,
            age: now - priceData.timestamp
          });
        }
      }

      // Sort by most recent first
      recentUpdates.sort((a, b) => b.timestamp - a.timestamp);
      return recentUpdates;
    } catch (error) {
      logger.error(`Error getting recent price updates for ${assetType}:`, error);
      return [];
    }
  }
}

// Create a singleton instance
const priceCacheService = new PriceCacheService();

export default priceCacheService; 
