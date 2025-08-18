/**
 * Instrument model based on database schema
 */

import { InstrumentCategory, InstrumentStatus } from '../enums/instrumentEnums.js';

class Instrument {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.symbol = data.symbol || '';
    this.category = data.instrument_category || null;
    this.status = data.instrument_status || InstrumentStatus.ACTIVE;
    this.description = data.description || '';
    this.createdAt = data.created_at || new Date();
    this.updatedAt = data.updated_at || new Date();
  }

  /**
   * Convert model to database format
   */
  toDatabaseFormat() {
    return {
      id: this.id,
      name: this.name,
      symbol: this.symbol,
      instrument_category: this.category,
      instrument_status: this.status,
      description: this.description,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  /**
   * Create Instrument from database data
   */
  static fromDatabase(data) {
    return new Instrument(data);
  }

  /**
   * Validate instrument data
   */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim() === '') {
      errors.push('Instrument name is required');
    }

    if (!this.symbol || this.symbol.trim() === '') {
      errors.push('Instrument symbol is required');
    }

    if (!this.category || !Object.values(InstrumentCategory).includes(this.category)) {
      errors.push('Valid instrument category is required');
    }

    if (!this.status || !Object.values(InstrumentStatus).includes(this.status)) {
      errors.push('Valid instrument status is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if instrument is active
   */
  isActive() {
    return this.status === InstrumentStatus.ACTIVE;
  }

  /**
   * Check if instrument is disabled
   */
  isDisabled() {
    return this.status === InstrumentStatus.DISABLED;
  }

  /**
   * Check if instrument is in a specific category
   */
  isInCategory(category) {
    return this.category === category;
  }

  /**
   * Check if instrument is forex
   */
  isForex() {
    return this.category === InstrumentCategory.FOREX;
  }

  /**
   * Check if instrument is crypto
   */
  isCrypto() {
    return this.category === InstrumentCategory.CRYPTO;
  }

  /**
   * Check if instrument is metal
   */
  isMetal() {
    return this.category === InstrumentCategory.METAL;
  }

  /**
   * Check if instrument is index
   */
  isIndex() {
    return this.category === InstrumentCategory.INDEX;
  }
}

export default Instrument;

