/**
 * Instrument-related enums based on database schema
 */

export const InstrumentCategory = {
  FOREX: 'Forex',
  METAL: 'Metal',
  INDEX: 'Index',
  CRYPTO: 'Crypto'
};

export const InstrumentStatus = {
  ACTIVE: 'active',
  DISABLED: 'disabled'
};

export default {
  InstrumentCategory,
  InstrumentStatus
};

