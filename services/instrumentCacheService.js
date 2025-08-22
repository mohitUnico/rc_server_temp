import { Logger } from '../utils/logger.js';
import { InstrumentCategory, InstrumentStatus } from '../enums/instrumentEnums.js';

const logger = new Logger('InstrumentCacheService');

/**
 * Service for caching all instrument data in memory to avoid repeated database calls
 */
class InstrumentCacheService {
  constructor() {
    this.isInitialized = false;
    this.isLoading = false;
    this.lastRefreshTime = null;
    this.refreshInterval = null;
    
    // Cache data structures
    this.instrumentsById = new Map();
    this.instrumentsBySymbol = new Map();
    this.instrumentsByCategory = new Map();
    this.activeInstruments = new Map();
    this.allInstruments = [];
    
    // Statistics
    this.stats = {
      totalInstruments: 0,
      activeInstruments: 0,
      categories: new Set(),
      lastRefreshDuration: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * Initialize the cache by loading all instruments from database
   */
  async initialize() {
    if (this.isInitialized || this.isLoading) {
      logger.warn('Instrument cache is already initialized or loading');
      return;
    }

    try {
      logger.info('🔄 Initializing instrument cache...');
      this.isLoading = true;
      const startTime = Date.now();

      // Dynamically import repository to avoid circular dependency
      const { default: InstrumentRepository } = await import('../repositories/InstrumentRepository.js');
      const instrumentRepository = new InstrumentRepository();

      // Load all instruments from database
      const instruments = await instrumentRepository.getAllInstruments();
      
      // Clear existing cache
      this.clearCache();
      
      // Populate cache data structures
      for (const instrument of instruments) {
        this.addToCache(instrument);
      }

      // Update statistics
      this.stats.totalInstruments = instruments.length;
      this.stats.activeInstruments = this.activeInstruments.size;
      this.stats.lastRefreshDuration = Date.now() - startTime;
      this.lastRefreshTime = new Date();

      this.isInitialized = true;
      this.isLoading = false;

      logger.info(`✅ Instrument cache initialized with ${instruments.length} instruments in ${this.stats.lastRefreshDuration}ms`);
      logger.info(`📊 Cache stats: ${this.stats.activeInstruments} active, ${this.stats.categories.size} categories`);
      
    } catch (error) {
      this.isLoading = false;
      logger.error('❌ Failed to initialize instrument cache:', error);
      throw error;
    }
  }

  /**
   * Refresh the cache by reloading all instruments
   */
  async refresh() {
    if (this.isLoading) {
      logger.warn('Instrument cache refresh already in progress');
      return;
    }

    try {
      logger.info('🔄 Refreshing instrument cache...');
      this.isLoading = true;
      const startTime = Date.now();

      // Dynamically import repository to avoid circular dependency
      const { default: InstrumentRepository } = await import('../repositories/InstrumentRepository.js');
      const instrumentRepository = new InstrumentRepository();

      // Load all instruments from database
      const instruments = await instrumentRepository.getAllInstruments();
      
      // Clear existing cache
      this.clearCache();
      
      // Populate cache data structures
      for (const instrument of instruments) {
        this.addToCache(instrument);
      }

      // Update statistics
      this.stats.totalInstruments = instruments.length;
      this.stats.activeInstruments = this.activeInstruments.size;
      this.stats.lastRefreshDuration = Date.now() - startTime;
      this.lastRefreshTime = new Date();

      this.isLoading = false;

      logger.info(`✅ Instrument cache refreshed with ${instruments.length} instruments in ${this.stats.lastRefreshDuration}ms`);
      
    } catch (error) {
      this.isLoading = false;
      logger.error('❌ Failed to refresh instrument cache:', error);
      throw error;
    }
  }

  /**
   * Add an instrument to all cache data structures
   */
  addToCache(instrument) {
    if (!instrument || !instrument.id) {
      return;
    }

    // Add to ID cache
    this.instrumentsById.set(instrument.id, instrument);
    
    // Add to symbol cache
    if (instrument.symbol) {
      this.instrumentsBySymbol.set(instrument.symbol, instrument);
    }
    
    // Add to category cache
    if (instrument.category) {
      if (!this.instrumentsByCategory.has(instrument.category)) {
        this.instrumentsByCategory.set(instrument.category, []);
      }
      this.instrumentsByCategory.get(instrument.category).push(instrument);
      this.stats.categories.add(instrument.category);
    }
    
    // Add to active instruments cache
    if (instrument.isActive()) {
      this.activeInstruments.set(instrument.id, instrument);
    }
    
    // Add to all instruments array
    this.allInstruments.push(instrument);
  }

  /**
   * Clear all cache data structures
   */
  clearCache() {
    this.instrumentsById.clear();
    this.instrumentsBySymbol.clear();
    this.instrumentsByCategory.clear();
    this.activeInstruments.clear();
    this.allInstruments = [];
    this.stats.categories.clear();
  }

  /**
   * Get instrument by ID (from cache)
   */
  getInstrumentById(id) {
    if (!this.isInitialized) {
      this.stats.cacheMisses++;
      return null;
    }

    const instrument = this.instrumentsById.get(parseInt(id));
    if (instrument) {
      this.stats.cacheHits++;
      return instrument;
    } else {
      this.stats.cacheMisses++;
      return null;
    }
  }

  /**
   * Get instrument by symbol (from cache)
   */
  getInstrumentBySymbol(symbol) {
    if (!this.isInitialized || !symbol) {
      this.stats.cacheMisses++;
      return null;
    }

    const instrument = this.instrumentsBySymbol.get(symbol);
    if (instrument) {
      this.stats.cacheHits++;
      return instrument;
    } else {
      this.stats.cacheMisses++;
      return null;
    }
  }

  /**
   * Get all instruments (from cache)
   */
  getAllInstruments() {
    if (!this.isInitialized) {
      return [];
    }
    return [...this.allInstruments];
  }

  /**
   * Get all active instruments (from cache)
   */
  getActiveInstruments() {
    if (!this.isInitialized) {
      return [];
    }
    return Array.from(this.activeInstruments.values());
  }

  /**
   * Get instruments by category (from cache)
   */
  getInstrumentsByCategory(category) {
    if (!this.isInitialized || !category) {
      return [];
    }

    const instruments = this.instrumentsByCategory.get(category);
    return instruments ? [...instruments] : [];
  }

  /**
   * Get all forex instruments (from cache)
   */
  getForexInstruments() {
    return this.getInstrumentsByCategory(InstrumentCategory.FOREX);
  }

  /**
   * Get all crypto instruments (from cache)
   */
  getCryptoInstruments() {
    return this.getInstrumentsByCategory(InstrumentCategory.CRYPTO);
  }

  /**
   * Get all indices instruments (from cache)
   */
  getIndicesInstruments() {
    return this.getInstrumentsByCategory(InstrumentCategory.INDICES);
  }

  /**
   * Get all commodities instruments (from cache)
   */
  getCommoditiesInstruments() {
    return this.getInstrumentsByCategory(InstrumentCategory.COMMODITIES);
  }

  /**
   * Search instruments by name or symbol (from cache)
   */
  searchInstruments(query) {
    if (!this.isInitialized || !query) {
      return [];
    }

    const searchTerm = query.toLowerCase();
    return this.allInstruments.filter(instrument => 
      instrument.name.toLowerCase().includes(searchTerm) ||
      instrument.symbol.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      isInitialized: this.isInitialized,
      isLoading: this.isLoading,
      lastRefreshTime: this.lastRefreshTime,
      cacheSize: {
        byId: this.instrumentsById.size,
        bySymbol: this.instrumentsBySymbol.size,
        byCategory: this.instrumentsByCategory.size,
        active: this.activeInstruments.size,
        total: this.allInstruments.length
      },
      hitRate: this.stats.cacheHits + this.stats.cacheMisses > 0 
        ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Start automatic refresh interval
   */
  startAutoRefresh(intervalMs = 300000) { // Default: 5 minutes
    if (this.refreshInterval) {
      this.stopAutoRefresh();
    }

    this.refreshInterval = setInterval(async () => {
      try {
        await this.refresh();
      } catch (error) {
        logger.error('Auto-refresh failed:', error);
      }
    }, intervalMs);

    logger.info(`🔄 Auto-refresh started with ${intervalMs / 1000}s interval`);
  }

  /**
   * Stop automatic refresh interval
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      logger.info('⏹️ Auto-refresh stopped');
    }
  }

  /**
   * Check if cache is ready
   */
  isReady() {
    return this.isInitialized && !this.isLoading;
  }

  /**
   * Get cache status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isLoading: this.isLoading,
      isReady: this.isReady(),
      lastRefreshTime: this.lastRefreshTime,
      autoRefreshActive: !!this.refreshInterval,
      stats: this.getStats()
    };
  }

  /**
   * Update a single instrument in cache (for real-time updates)
   */
  updateInstrument(instrument) {
    if (!this.isInitialized || !instrument || !instrument.id) {
      return;
    }

    // Remove from all caches first
    this.removeFromCache(instrument.id);
    
    // Add updated instrument
    this.addToCache(instrument);
    
    logger.debug(`Updated instrument ${instrument.symbol} (ID: ${instrument.id}) in cache`);
  }

  /**
   * Remove an instrument from cache
   */
  removeFromCache(instrumentId) {
    const instrument = this.instrumentsById.get(instrumentId);
    if (!instrument) {
      return;
    }

    // Remove from ID cache
    this.instrumentsById.delete(instrumentId);
    
    // Remove from symbol cache
    if (instrument.symbol) {
      this.instrumentsBySymbol.delete(instrument.symbol);
    }
    
    // Remove from category cache
    if (instrument.category) {
      const categoryInstruments = this.instrumentsByCategory.get(instrument.category);
      if (categoryInstruments) {
        const index = categoryInstruments.findIndex(i => i.id === instrumentId);
        if (index !== -1) {
          categoryInstruments.splice(index, 1);
        }
      }
    }
    
    // Remove from active instruments cache
    this.activeInstruments.delete(instrumentId);
    
    // Remove from all instruments array
    const index = this.allInstruments.findIndex(i => i.id === instrumentId);
    if (index !== -1) {
      this.allInstruments.splice(index, 1);
    }
  }
}

// Create singleton instance
const instrumentCacheService = new InstrumentCacheService();

export default instrumentCacheService;
