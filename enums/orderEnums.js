/**
 * Order-related enums based on database schema
 */

export const OrderType = {
  MARKET_BUY: 'marketBuy',
  MARKET_SELL: 'marketSell',
  BUY_LIMIT: 'buyLimit',
  SELL_LIMIT: 'sellLimit',
  BUY_STOP: 'buyStop',
  SELL_STOP: 'sellStop',
  BUY_STOP_LIMIT: 'buyStopLimit',
  SELL_STOP_LIMIT: 'sellStopLimit'
};

export const OrderStatus = {
  FILLED: 'filled',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  PLACED: 'placed'
};

export const OrderSide = {
  BUY: 'buy',
  SELL: 'sell'
};

export default {
  OrderType,
  OrderStatus,
  OrderSide
};

