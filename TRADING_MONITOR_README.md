# Trading Monitor Services

This document describes the trading monitor services that automatically manage positions and pending orders based on market conditions.

## Overview

The trading monitor system consists of four main components:

1. **PositionCheckService** - Monitors open positions and automatically closes them when SL/TP levels are hit
2. **PendingOrderService** - Monitors pending orders and automatically fills them when limit prices are met
3. **PriceCacheService** - In-memory cache that stores real-time prices from WebSocket data
4. **AccountMetricsService** - Calculates and updates trading account metrics (equity, margin, free margin) based on open positions

## Services

### PositionCheckService

Monitors open positions every 0.1 seconds and automatically closes them when:

- Stop Loss (SL) price is hit
- Take Profit (TP) price is hit

**Key Features:**

- Fetches open positions from Supabase
- Gets current market prices from WebSocket cache (real-time)
- Automatically closes positions when SL/TP triggers
- Calculates P&L and updates account balance
- Supports account-specific position checking

**Usage:**

```javascript
import positionCheckService from "./services/positionCheckService.js";

// Start the service
positionCheckService.start();

// Stop the service
positionCheckService.stop();

// Check status
const status = positionCheckService.getStatus();

// Manually check positions for specific account
await positionCheckService.checkPositionsForAccount(accountId);

// Update check interval (default: 100ms)
positionCheckService.setCheckInterval(200); // 0.2 seconds
```

### PendingOrderService

Monitors pending orders every 0.1 seconds and automatically fills them when:

- Buy Limit: Current price <= Limit price
- Sell Limit: Current price >= Limit price
- Buy Stop: Current price >= Limit price
- Sell Stop: Current price <= Limit price

**Key Features:**

- Fetches pending orders from Supabase
- Gets current market prices from WebSocket cache (real-time)
- Automatically fills orders when limit prices are met
- Creates corresponding positions for filled orders
- Supports different order types (limit, stop, stop-limit)
- Calculates margin requirements

**Usage:**

```javascript
import pendingOrderService from "./services/pendingOrderService.js";

// Start the service
pendingOrderService.start();

// Stop the service
pendingOrderService.stop();

// Check status
const status = pendingOrderService.getStatus();

// Manually check pending orders for specific account
await pendingOrderService.checkPendingOrdersForAccount(accountId);

// Manually check pending orders for specific instrument
await pendingOrderService.checkPendingOrdersForInstrument(
  accountId,
  instrumentId
);

// Manually trigger check
await pendingOrderService.triggerCheck();
```

### PriceCacheService

In-memory cache that stores real-time prices from WebSocket data.

**Key Features:**

- Stores prices from all WebSocket sources (forex, crypto, indices)
- Automatic stale price detection and cleanup
- Fast in-memory access for trading monitor services
- Supports instrument ID lookup for position/order checking
- Cache statistics and monitoring

**Usage:**

```javascript
import priceCacheService from "./services/priceCacheService.js";

// Update price from WebSocket data
priceCacheService.updatePrice("forex", "EURUSD", 1.085, {
  bid: 1.0848,
  ask: 1.0852,
});

// Get current price
const price = priceCacheService.getCurrentPrice("forex", "EURUSD");

// Get price by instrument ID (for trading services)
const price = await priceCacheService.getCurrentPriceByInstrumentId(
  instrumentId
);

// Get cache statistics
const stats = priceCacheService.getCacheStats();
```

### AccountMetricsService

Calculates and updates trading account metrics based on open positions and current market prices.

**Key Features:**

- Real-time equity calculation (balance + unrealized P&L)
- Margin calculation based on open positions
- Free margin calculation (equity - margin)
- Margin level percentage calculation
- Automatic updates every 1 second
- Margin sufficiency checking for new positions
- Support for all active trading accounts

**Usage:**

````javascript
import accountMetricsService from "./services/accountMetricsService.js";

// Start the service (automatically updates all accounts)
accountMetricsService.start();

// Get metrics summary for specific account
const summary = await accountMetricsService.getAccountMetricsSummary(accountUid);

// Check if account has sufficient margin for new position
const marginCheck = await accountMetricsService.checkMarginSufficiency(accountUid, requiredMargin);

// Get metrics for all accounts
const allMetrics = await accountMetricsService.getAllAccountsMetrics();

// Manually trigger update for specific account
await accountMetricsService.triggerUpdateForAccount(accountUid);

## Integration with Server

The services are now integrated directly into `server.js`. They will automatically start when the server starts and stop during graceful shutdown.

```javascript
// In server.js - services are imported and started automatically
import positionCheckService from "./services/positionCheckService.js";
import pendingOrderService from "./services/pendingOrderService.js";
import accountMetricsService from "./services/accountMetricsService.js";

// Services start automatically when server starts
server.listen(PORT, () => {
  // ... other startup code ...

  // Start trading monitor services
  try {
    positionCheckService.start();
    logger.info("✅ Position check service started");

    pendingOrderService.start();
    logger.info("✅ Pending order service started");

    accountMetricsService.start();
    logger.info("✅ Account metrics service started");

    logger.info(
      "🎯 Trading monitor services: Position & Order monitoring active"
    );
    logger.info("📊 Account metrics service: Real-time equity, margin, and free margin updates active");
  } catch (error) {
    logger.error("❌ Failed to start trading monitor services:", error);
  }
});

// Services stop automatically during graceful shutdown
async function gracefulShutdown(signal) {
  // ... other shutdown code ...

  // Stop trading monitor services
  try {
    positionCheckService.stop();
    logger.info("✅ Position check service stopped");

    pendingOrderService.stop();
    logger.info("✅ Pending order service stopped");

    accountMetricsService.stop();
    logger.info("✅ Account metrics service stopped");
  } catch (error) {
    logger.error("❌ Error stopping trading monitor services:", error);
  }

  // ... rest of shutdown code ...
}
````

## Testing

Use the provided test scripts to verify the services work correctly:

```bash
# Test trading monitor services
node scripts/testTradingMonitor.js combined

# Test individual services
node scripts/testTradingMonitor.js individual

# Test custom intervals
node scripts/testTradingMonitor.js intervals

# Test price cache service
node scripts/testPriceCache.js

# Test account metrics service
node scripts/testAccountMetrics.js

# Run all tests
node scripts/testTradingMonitor.js all
```

## Configuration

### Check Intervals

Default check interval is 100ms (0.1 seconds). You can modify this:

```javascript
// Set intervals for individual services
positionCheckService.setCheckInterval(200); // 0.2 seconds
pendingOrderService.setCheckInterval(200); // 0.2 seconds
```

### Margin Calculation

The pending order service uses a simplified margin calculation. You may want to customize this in `pendingOrderService.js`:

```javascript
calculateMarginUsed(order, fillPrice) {
  // Current: lot size * fill price * leverage factor
  const leverageFactor = 0.01; // 1% margin requirement

  // Customize based on your trading rules
  return order.lotSize * fillPrice * leverageFactor;
}
```

## Error Handling

All services include comprehensive error handling:

- Logs errors with detailed context
- Continues operation even if individual checks fail
- Graceful degradation when price data is unavailable
- Retry logic for database operations

## Monitoring and Logging

Services use the Logger utility for consistent logging:

- Info level: Service start/stop, successful operations
- Debug level: Detailed operation information
- Warn level: Non-critical issues
- Error level: Critical errors and failures

## Performance Considerations

- Services run on separate intervals to avoid blocking
- Database queries are optimized with proper indexing
- Price fetching is cached where possible
- Check intervals can be adjusted based on system load

## Security

- All database operations use parameterized queries
- Price data is validated before use
- Account isolation ensures users can only access their own data
- Error messages don't expose sensitive information

## Dependencies

The services depend on:

- `PriceService` - For fetching current market prices
- `PositionRepository` - For position database operations
- `OrderRepository` - For order database operations
- `Logger` - For consistent logging
- Supabase - For database access

## Troubleshooting

### Common Issues

1. **Services not starting**: Check database connectivity and permissions
2. **No positions/orders being processed**: Verify data exists in database
3. **High CPU usage**: Increase check intervals
4. **Price fetch failures**: Check API connectivity and authentication

### Debug Mode

Enable debug logging to see detailed operation information:

```javascript
// In your logger configuration
const logger = new Logger("ServiceName", "debug");
```

### Manual Testing

Use the manual trigger methods to test specific scenarios:

```javascript
// Test specific account
await positionCheckService.checkPositionsForAccount("test-account-id");
await pendingOrderService.checkPendingOrdersForAccount("test-account-id");

// Test specific instrument
await pendingOrderService.checkPendingOrdersForInstrument(
  "account-id",
  "instrument-id"
);
```
