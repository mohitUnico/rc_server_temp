/**
 * Base repository class with common CRUD operations and retry logic
 */

import { supabase } from '../config/supabase.js';

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.supabase = supabase;
    
    // Retry configuration (matching Flutter repositories)
    this.maxRetries = 5;
    this.retryDelay = 2000; // base delay in milliseconds (will use exponential backoff)
  }

  /**
   * Check network connectivity
   */
  async checkNetworkConnectivity() {
    try {
      // Try to make a simple request to check connectivity
      await this.supabase.from(this.tableName).select('id').limit(1);
    } catch (error) {
      throw new Error('No network connectivity or Supabase service unavailable');
    }
  }

  /**
   * Retry wrapper for database operations
   */
  async withRetry(operation, operationName) {
    let attempts = 0;
    let lastException = null;

    while (attempts < this.maxRetries) {
      try {
        await this.checkNetworkConnectivity();
        return await operation();
      } catch (error) {
        lastException = error;
        console.log(`${operationName} error on attempt ${attempts + 1}: ${error.message}`);
        
        // Don't retry for certain types of errors
        if (error.message.includes('validation') || 
            error.message.includes('unauthorized') || 
            error.message.includes('forbidden')) {
          throw error;
        }
      }

      attempts++;
      if (attempts < this.maxRetries) {
        // Exponential backoff: 2s, 4s, 8s, 16s ... capped implicitly by attempts
        const delayMs = this.retryDelay * Math.pow(2, attempts - 1);
        console.log(`Retrying ${operationName} in ${Math.ceil(delayMs / 1000)} seconds...`);
        await this.delay(delayMs);
      }
    }

    // All retries failed
    throw new Error(
      `Failed to ${operationName} after ${this.maxRetries} attempts. Last error: ${lastException?.message || 'Unknown error'}`
    );
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a new record with retry logic
   */
  async create(data) {
    return this.withRetry(async () => {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
      }

      return result;
    }, 'create');
  }

  /**
   * Find record by ID with retry logic
   */
  async findById(id) {
    return this.withRetry(async () => {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Record not found
        }
        throw new Error(`Failed to find ${this.tableName} by ID: ${error.message}`);
      }

      return data;
    }, 'findById');
  }

  /**
   * Find all records with optional filters and retry logic
   */
  async findAll(filters = {}, options = {}) {
    return this.withRetry(async () => {
      let query = this.supabase
        .from(this.tableName)
        .select('*');

      // Apply filters
      Object.keys(filters).forEach(key => {
        query = query.eq(key, filters[key]);
      });

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
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
        throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
      }

      return data;
    }, 'findAll');
  }

  /**
   * Update record by ID with retry logic
   */
  async updateById(id, data) {
    return this.withRetry(async () => {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
      }

      return result;
    }, 'updateById');
  }

  /**
   * Delete record by ID with retry logic
   */
  async deleteById(id) {
    return this.withRetry(async () => {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
      }

      return true;
    }, 'deleteById');
  }

  /**
   * Count records with optional filters and retry logic
   */
  async count(filters = {}) {
    return this.withRetry(async () => {
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Apply filters
      Object.keys(filters).forEach(key => {
        query = query.eq(key, filters[key]);
      });

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count ${this.tableName}: ${error.message}`);
      }

      return count;
    }, 'count');
  }

  /**
   * Find one record with filters and retry logic
   */
  async findOne(filters = {}) {
    return this.withRetry(async () => {
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .limit(1);

      // Apply filters
      Object.keys(filters).forEach(key => {
        query = query.eq(key, filters[key]);
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
      }

      return data && data.length > 0 ? data[0] : null;
    }, 'findOne');
  }

  /**
   * Update by field (for cases where primary key is not 'id')
   */
  async updateByField(field, value, updateData) {
    return this.withRetry(async () => {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq(field, value)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
      }

      return result;
    }, 'updateByField');
  }

  /**
   * Delete by field (for cases where primary key is not 'id')
   */
  async deleteByField(field, value) {
    return this.withRetry(async () => {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq(field, value);

      if (error) {
        throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
      }

      return true;
    }, 'deleteByField');
  }
}

export default BaseRepository;

