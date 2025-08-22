/**
 * Instrument repository for handling instrument data operations with retry logic
 */

import BaseRepository from './BaseRepository.js';
import Instrument from '../models/Instrument.js';
import { InstrumentStatus } from '../enums/instrumentEnums.js';

class InstrumentRepository extends BaseRepository {
  constructor() {
    super('instruments');
    // Simple in-memory cache to avoid repeated DB calls for the same instrument
    this.instrumentCacheById = new Map();
    this.instrumentCacheBySymbol = new Map();
  }

  /**
   * Fetches all active instruments (matching Flutter getAllInstruments)
   */
  async getAllInstruments() {
    try {
      const filters = { status: 'active' };
      const options = { orderBy: { column: 'symbol', ascending: true } };
      const result = await this.findAll(filters, options);
      return result.map(instrument => Instrument.fromDatabase(instrument));
    } catch (error) {
      console.error('Error getting all instruments:', error);
      throw error;
    }
  }

  /**
   * Fetches a single instrument by ID (matching Flutter getInstrumentById)
   */
  async findInstrumentById(instrumentId) {
    try {
      const numericId = parseInt(instrumentId);
      if (this.instrumentCacheById.has(numericId)) {
        return this.instrumentCacheById.get(numericId);
      }

      const result = await this.findById(numericId);
      const instrument = result ? Instrument.fromDatabase(result) : null;
      if (instrument) {
        this.instrumentCacheById.set(numericId, instrument);
        if (instrument.symbol) {
          this.instrumentCacheBySymbol.set(instrument.symbol, instrument);
        }
      }
      return instrument;
    } catch (error) {
      console.error('Error finding instrument by ID:', error);
      return null;
    }
  }

  /**
   * Fetches instruments by category (matching Flutter getInstrumentsByCategory)
   */
  async findInstrumentsByCategory(category) {
    try {
      const filters = { 
        category: category,
        status: 'active'
      };
      const options = { orderBy: { column: 'symbol', ascending: true } };
      const result = await this.findAll(filters, options);
      return result.map(instrument => Instrument.fromDatabase(instrument));
    } catch (error) {
      console.error('Error finding instruments by category:', error);
      throw error;
    }
  }

  /**
   * Fetches instrument by symbol (matching Flutter getInstrumentBySymbol)
   */
  async findInstrumentBySymbol(symbol) {
    try {
      if (!symbol) return null;
      if (this.instrumentCacheBySymbol.has(symbol)) {
        return this.instrumentCacheBySymbol.get(symbol);
      }

      const filters = { 
        symbol: symbol,
        status: 'active'
      };
      const result = await this.findOne(filters);
      const instrument = result ? Instrument.fromDatabase(result) : null;
      if (instrument) {
        this.instrumentCacheBySymbol.set(symbol, instrument);
        if (instrument.id) {
          this.instrumentCacheById.set(instrument.id, instrument);
        }
      }
      return instrument;
    } catch (error) {
      console.error('Error finding instrument by symbol:', error);
      return null;
    }
  }

  /**
   * Fetches all unique categories (matching Flutter getAllCategories)
   */
  async getAllCategories() {
    try {
      const filters = { status: 'active' };
      const options = { orderBy: { column: 'category', ascending: true } };
      const result = await this.findAll(filters, options);
      
      if (result && result.length > 0) {
        const categories = result
          .map(item => item.category)
          .filter((category, index, self) => self.indexOf(category) === index); // Remove duplicates
        return categories;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error getting all categories:', error);
      throw error;
    }
  }

  /**
   * Fetches instruments by a list of symbols (matching Flutter getInstrumentsBySymbols)
   */
  async findInstrumentsBySymbols(symbols) {
    try {
      if (symbols.length === 0) {
        return [];
      }

      const filters = { status: 'active' };
      const options = { orderBy: { column: 'symbol', ascending: true } };
      
      // Use inFilter to match multiple symbols
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .in('symbol', symbols)
        .eq('status', 'active')
        .order('symbol', { ascending: true });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find instruments by symbols: ${error.message}`);
      }

      return data.map(instrument => Instrument.fromDatabase(instrument));
    } catch (error) {
      console.error('Error finding instruments by symbols:', error);
      return [];
    }
  }

  /**
   * Create a new instrument
   */
  async createInstrument(instrumentData) {
    try {
      const instrument = new Instrument(instrumentData);
      const validation = instrument.validate();
      
      if (!validation.isValid) {
        throw new Error(`Instrument validation failed: ${validation.errors.join(', ')}`);
      }

      const dbData = instrument.toDatabaseFormat();
      const result = await this.create(dbData);
      
      return Instrument.fromDatabase(result);
    } catch (error) {
      console.error('Error creating instrument:', error);
      throw error;
    }
  }

  /**
   * Find instruments by status
   */
  async findInstrumentsByStatus(status, options = {}) {
    try {
      const filters = { instrument_status: status };
      const result = await this.findAll(filters, options);
      return result.map(instrument => Instrument.fromDatabase(instrument));
    } catch (error) {
      console.error('Error finding instruments by status:', error);
      throw error;
    }
  }

  /**
   * Find active instruments
   */
  async findActiveInstruments(options = {}) {
    return this.findInstrumentsByStatus(InstrumentStatus.ACTIVE, options);
  }

  /**
   * Find disabled instruments
   */
  async findDisabledInstruments(options = {}) {
    return this.findInstrumentsByStatus(InstrumentStatus.DISABLED, options);
  }

  /**
   * Find forex instruments
   */
  async findForexInstruments(options = {}) {
    return this.findInstrumentsByCategory('Forex', options);
  }

  /**
   * Find crypto instruments
   */
  async findCryptoInstruments(options = {}) {
    return this.findInstrumentsByCategory('Crypto', options);
  }

  /**
   * Find metal instruments
   */
  async findMetalInstruments(options = {}) {
    return this.findInstrumentsByCategory('Metal', options);
  }

  /**
   * Find index instruments
   */
  async findIndexInstruments(options = {}) {
    return this.findInstrumentsByCategory('Index', options);
  }

  /**
   * Search instruments by name or symbol
   */
  async searchInstruments(searchTerm, options = {}) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .or(`name.ilike.%${searchTerm}%,symbol.ilike.%${searchTerm}%`);

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
      } else {
        query = query.order('name', { ascending: true });
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
        throw new Error(`Failed to search instruments: ${error.message}`);
      }

      return data.map(instrument => Instrument.fromDatabase(instrument));
    } catch (error) {
      console.error('Error searching instruments:', error);
      throw error;
    }
  }

  /**
   * Update instrument status
   */
  async updateInstrumentStatus(id, status) {
    try {
      const result = await this.updateById(id, { instrument_status: status });
      return Instrument.fromDatabase(result);
    } catch (error) {
      console.error('Error updating instrument status:', error);
      throw error;
    }
  }

  /**
   * Activate instrument
   */
  async activateInstrument(id) {
    return this.updateInstrumentStatus(id, InstrumentStatus.ACTIVE);
  }

  /**
   * Disable instrument
   */
  async disableInstrument(id) {
    return this.updateInstrumentStatus(id, InstrumentStatus.DISABLED);
  }

  /**
   * Update instrument with new data
   */
  async updateInstrument(id, instrumentData) {
    try {
      const instrument = new Instrument(instrumentData);
      const validation = instrument.validate();
      
      if (!validation.isValid) {
        throw new Error(`Instrument validation failed: ${validation.errors.join(', ')}`);
      }

      const dbData = instrument.toDatabaseFormat();
      delete dbData.id; // Remove ID from update data
      
      const result = await this.updateById(id, dbData);
      return Instrument.fromDatabase(result);
    } catch (error) {
      console.error('Error updating instrument:', error);
      throw error;
    }
  }

  /**
   * Delete instrument
   */
  async deleteInstrument(id) {
    try {
      return await this.deleteById(id);
    } catch (error) {
      console.error('Error deleting instrument:', error);
      throw error;
    }
  }

  /**
   * Get instruments with pagination
   */
  async getInstrumentsWithPagination(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      const options = {
        limit,
        offset,
        orderBy: { column: 'name', ascending: true }
      };

      const result = await this.findAll(filters, options);
      const instruments = result.map(instrument => Instrument.fromDatabase(instrument));
      
      const totalCount = await this.count(filters);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        instruments,
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
      console.error('Error getting instruments with pagination:', error);
      throw error;
    }
  }

  /**
   * Get instrument statistics
   */
  async getInstrumentStatistics() {
    try {
      const allInstruments = await this.findAll();
      const instruments = allInstruments.map(instrument => Instrument.fromDatabase(instrument));

      const activeInstruments = instruments.filter(instrument => instrument.isActive());
      const disabledInstruments = instruments.filter(instrument => instrument.isDisabled());

      const forexInstruments = instruments.filter(instrument => instrument.isForex());
      const cryptoInstruments = instruments.filter(instrument => instrument.isCrypto());
      const metalInstruments = instruments.filter(instrument => instrument.isMetal());
      const indexInstruments = instruments.filter(instrument => instrument.isIndex());

      const stats = {
        total: instruments.length,
        active: activeInstruments.length,
        disabled: disabledInstruments.length,
        forex: forexInstruments.length,
        crypto: cryptoInstruments.length,
        metal: metalInstruments.length,
        index: indexInstruments.length
      };

      return stats;
    } catch (error) {
      console.error('Error getting instrument statistics:', error);
      throw error;
    }
  }

  /**
   * Get instruments by category with counts
   */
  async getInstrumentsByCategory() {
    try {
      const allInstruments = await this.findAll();
      const instruments = allInstruments.map(instrument => Instrument.fromDatabase(instrument));

      const categoryStats = {};
      
      instruments.forEach(instrument => {
        if (!categoryStats[instrument.category]) {
          categoryStats[instrument.category] = {
            category: instrument.category,
            total: 0,
            active: 0,
            disabled: 0
          };
        }
        
        categoryStats[instrument.category].total += 1;
        
        if (instrument.isActive()) {
          categoryStats[instrument.category].active += 1;
        } else {
          categoryStats[instrument.category].disabled += 1;
        }
      });

      return Object.values(categoryStats);
    } catch (error) {
      console.error('Error getting instruments by category:', error);
      throw error;
    }
  }
}

export default InstrumentRepository;

