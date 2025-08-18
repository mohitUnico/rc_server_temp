/**
 * Index file for all trading-related enums
 */

const { OrderType, OrderStatus, OrderSide } = require('./orderEnums');
const { PositionType, PositionStatus } = require('./positionEnums');
const { TransactionType, TransactionStatus } = require('./transactionEnums');
const { InstrumentCategory, InstrumentStatus } = require('./instrumentEnums');
const { AccountStatus } = require('./accountEnums');

module.exports = {
  // Order enums
  OrderType,
  OrderStatus,
  OrderSide,
  
  // Position enums
  PositionType,
  PositionStatus,
  
  // Transaction enums
  TransactionType,
  TransactionStatus,
  
  // Instrument enums
  InstrumentCategory,
  InstrumentStatus,
  
  // Account enums
  AccountStatus
};
