# 📈 Forex Subscription Service

A comprehensive service that manages real-time subscriptions to 80 forex symbols from the iTick API. The service automatically subscribes to all symbols in batches of 8 after the forex WebSocket connection is established.

## 🏗️ Architecture

### Service Overview

The `ForexSubscriptionService` is designed to:

1. **Initialize** with all 80 forex symbols from configuration
2. **Batch** symbols into groups of 8 for efficient API calls
3. **Auto-subscribe** to all symbols after WebSocket connection
4. **Manage** subscription lifecycle (subscribe/unsubscribe)
5. **Provide** status and utility methods

### Data Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   iTickForex    │    │ ForexSubscription│    │   iTick API    │
│   WebSocket     │───►│     Service     │───►│   WebSocket    │
│   Connection    │    │                 │    │   Server       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   Batch         │              │
         │              │   Processing    │              │
         │              │   (8 symbols)   │              │
         │              └─────────────────┘              │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Price Cache   │    │   Subscription  │    │   Real-time     │
│   Service       │    │   Messages      │    │   Data Stream   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Features

### Core Functionality

- **Automatic Subscription**: Subscribes to all symbols after WebSocket connection
- **Batch Processing**: Groups symbols into batches of 8 for efficient API calls
- **Connection Management**: Integrates with WebSocket manager for connection handling
- **Status Tracking**: Monitors subscription status and provides detailed information
- **Error Handling**: Robust error handling with logging and recovery

### Symbol Management

- **80 Forex Symbols**: Comprehensive coverage of major, minor, and exotic pairs
- **Categorized Symbols**: Organized by currency groups and commodity types
- **Dynamic Batching**: Automatic batch creation and management
- **Flexible Access**: Methods to access symbols by batch or individually

## 📁 File Structure

```
services/
├── forexSubscriptionService.js     # Main service class
└── ...

config/
├── forexSymbols.js                # Symbol configuration
└── ...

sockets/
├── iTickForex.js                  # Integration point
└── ...

scripts/
├── testForexSubscriptionService.js # Test script
└── ...
```

## 🚀 Usage

### Basic Integration

The service is automatically integrated into the `iTickForex.js` socket handler:

```javascript
import forexSubscriptionService from '../services/forexSubscriptionService.js';

// After successful WebSocket connection
await forexManager.connect();

// Auto-subscribe to all forex symbols
try {
    await forexSubscriptionService.subscribeToAllSymbols(forexManager);
} catch (error) {
    console.error('Failed to subscribe to forex symbols:', error);
}
```

### Manual Usage

```javascript
import forexSubscriptionService from '../services/forexSubscriptionService.js';

// Subscribe to all symbols
await forexSubscriptionService.subscribeToAllSymbols(forexManager);

// Check subscription status
const status = forexSubscriptionService.getSubscriptionStatus();
console.log(`Subscribed to ${status.totalSymbols} symbols`);

// Get all symbols
const allSymbols = forexSubscriptionService.getAllSymbols();

// Get symbols by batch
const firstBatch = forexSubscriptionService.getSymbolsByBatch(0);
```

## 📊 Symbol Categories

### Major Pairs (7 symbols)
- EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, USDCHF, NZDUSD

### Euro Crosses (17 symbols)
- EURTRY, EURPLN, EURZAR, EURHUF, EURCZK, EURSGD, EURHKD, EURRUB, EURMXN, EURGBP, EURCHF, EURCAD, EURAUD, EURNZD, EURJPY, EURSEK, EURNOK

### Pound Crosses (12 symbols)
- GBPSEK, GBPNOK, GBPTRY, GBPZAR, GBPPLN, GBPHKD, GBPSGD, GBPCHF, GBPCAD, GBPAUD, GBPNZD, GBPJPY

### Australian Dollar Crosses (7 symbols)
- AUDHKD, AUDTHB, AUDNZD, AUDJPY, AUDCAD, AUDCHF, AUDSGD

### New Zealand Dollar Crosses (4 symbols)
- NZDSGD, NZDJPY, NZDCAD, NZDCHF

### Canadian Dollar Crosses (3 symbols)
- CADSGD, CADCHF, CADJPY

### Swiss Franc Crosses (2 symbols)
- CHFJPY, CHFSGD

### US Dollar Crosses (17 symbols)
- USDARS, USDSEK, USDNOK, USDDKK, USDSGD, USDHKD, USDZAR, USDTRY, USDTHB, USDMXN, USDCZK, USDHUF, USDPLN, USDRUB, USDBRL, USDILS, USDCLP, USDGEL

### Commodities (10 symbols)
- XAGAUD, XAGEUR, XAGUSD, XAUAUD, XAUCHF, XAUEUR, XAUGBP, XAUUSD, XPDUSD, XPTUSD

## 🔄 Subscription Process

### Batch Structure

The service creates 10 batches of 8 symbols each:

```
Batch 1:  EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, USDCHF, NZDUSD, EURTRY
Batch 2:  EURPLN, EURZAR, EURHUF, EURCZK, EURSGD, EURHKD, EURRUB, EURMXN
Batch 3:  EURGBP, EURCHF, EURCAD, EURAUD, EURNZD, EURJPY, EURSEK, EURNOK
...
Batch 10: XAUAUD, XAUCHF, XAUEUR, XAUGBP, XAUUSD, XPDUSD, XPTUSD
```

### Subscription Message Format

Each batch sends a subscription message:

```json
{
  "ac": "subscribe",
  "params": "EURUSD$gb,GBPUSD$gb,USDJPY$gb,AUDUSD$gb,USDCAD$gb,USDCHF$gb,NZDUSD$gb,EURTRY$gb",
  "types": "quote"
}
```

### Timing

- **Batch Delay**: 1 second between batches
- **Total Time**: ~10 seconds to subscribe to all symbols
- **Auto-trigger**: After WebSocket connection is established

## 🧪 Testing

### Run Test Script

```bash
npm run test-forex-subscription
```

### Test Output

The test script validates:

1. ✅ Service initialization
2. ✅ Symbol count and structure
3. ✅ Batch organization
4. ✅ Message format generation
5. ✅ Service method functionality
6. ✅ Configuration integration

### Manual Testing

```javascript
// Test individual methods
const service = new ForexSubscriptionService();
console.log(service.getSubscriptionStatus());

// Test batch creation
const batch = service.getSymbolsByBatch(0);
console.log('First batch:', batch);
```

## ⚙️ Configuration

### Environment Variables

No additional environment variables are required. The service uses:

- **Region**: `gb` (Great Britain) - hardcoded
- **Message Type**: `quote` - hardcoded
- **Batch Size**: 8 symbols - configurable in code

### Customization

To modify batch size or timing:

```javascript
// In initializeForexSymbols method
const batchSize = 10; // Change from 8 to 10
for (let i = 0; i < allSymbols.length; i += batchSize) {
    const batch = allSymbols.slice(i, i + batchSize);
    this.subscriptionBatches.push(batch);
}

// In subscribeToAllSymbols method
await this.delay(2000); // Change from 1000ms to 2000ms
```

## 🔍 Monitoring

### Status Methods

```javascript
// Get comprehensive status
const status = forexSubscriptionService.getSubscriptionStatus();
console.log(status);
// Output:
// {
//   isSubscribed: true,
//   totalSymbols: 80,
//   totalBatches: 10,
//   currentBatchIndex: 0
// }

// Get all symbols
const symbols = forexSubscriptionService.getAllSymbols();

// Get symbols by batch
const batch = forexSubscriptionService.getSymbolsByBatch(0);
```

### Logging

The service provides detailed logging:

- **Info**: Service initialization, batch processing, subscription status
- **Debug**: Individual symbol details, batch contents
- **Error**: Connection failures, subscription errors
- **Warn**: Connection issues, retry attempts

## 🚨 Error Handling

### Common Issues

1. **WebSocket Not Connected**
   - Service waits for connection before subscribing
   - Automatic retry on reconnection

2. **Subscription Failures**
   - Individual batch failures don't stop the process
   - Detailed error logging for debugging

3. **Connection Drops**
   - Service detects disconnection
   - Automatic reconnection handling

### Recovery Strategies

- **Automatic Retry**: Failed batches are logged but don't stop the process
- **Connection Monitoring**: Continuous connection status checking
- **Graceful Degradation**: Partial subscription if some batches fail

## 🔗 Integration Points

### Primary Integration

- **iTickForex.js**: Main integration point for WebSocket connection
- **WebSocketManager**: Manages the underlying WebSocket connection
- **PriceCacheService**: Receives real-time price updates

### Secondary Integration

- **Logger**: Centralized logging system
- **Configuration**: Symbol definitions and service settings
- **Test Scripts**: Validation and testing utilities

## 📈 Performance

### Metrics

- **Subscription Time**: ~10 seconds for all 80 symbols
- **Memory Usage**: Minimal - only stores symbol arrays and status
- **CPU Usage**: Low - only active during subscription process
- **Network**: 10 API calls (one per batch)

### Optimization

- **Batch Processing**: Reduces API calls from 80 to 10
- **Delayed Execution**: Prevents overwhelming the API
- **Efficient Data Structures**: Uses arrays and maps for fast access
- **Minimal State**: Only tracks essential subscription information

## 🔮 Future Enhancements

### Planned Features

1. **Dynamic Symbol Management**: Add/remove symbols at runtime
2. **Configurable Batch Sizes**: Adjust batch size based on API limits
3. **Retry Mechanisms**: Automatic retry for failed subscriptions
4. **Health Monitoring**: Real-time subscription health checks
5. **Performance Metrics**: Detailed performance analytics

### Potential Improvements

- **Symbol Prioritization**: Subscribe to major pairs first
- **Load Balancing**: Distribute subscriptions across multiple connections
- **Caching**: Cache subscription status for faster recovery
- **Webhooks**: Notify other services of subscription changes

## 📚 API Reference

### Class: ForexSubscriptionService

#### Constructor
```javascript
new ForexSubscriptionService()
```

#### Methods

##### `subscribeToAllSymbols(forexManager)`
Subscribes to all forex symbols in batches.

**Parameters:**
- `forexManager` (WebSocketManager): The forex WebSocket manager instance

**Returns:** Promise<boolean> - Success status

##### `unsubscribeFromAllSymbols(forexManager)`
Unsubscribes from all forex symbols.

**Parameters:**
- `forexManager` (WebSocketManager): The forex WebSocket manager instance

**Returns:** Promise<boolean> - Success status

##### `getSubscriptionStatus()`
Gets the current subscription status.

**Returns:** Object with subscription details

##### `getAllSymbols()`
Gets all forex symbols as an array.

**Returns:** Array<string> - All symbol codes

##### `getSymbolsByBatch(batchIndex)`
Gets symbols for a specific batch.

**Parameters:**
- `batchIndex` (number): The batch index (0-9)

**Returns:** Array<string> - Symbols in the specified batch

##### `reset()`
Resets the service state.

**Returns:** void

## 🤝 Contributing

### Development Guidelines

1. **Follow existing patterns**: Maintain consistency with other services
2. **Add comprehensive logging**: Include info, debug, and error logs
3. **Include error handling**: Handle all potential failure scenarios
4. **Write tests**: Add test cases for new functionality
5. **Update documentation**: Keep this README current

### Code Standards

- **ES6+**: Use modern JavaScript features
- **Async/Await**: Prefer async/await over Promises
- **Error Handling**: Use try/catch blocks consistently
- **Logging**: Use the Logger utility for all output
- **Comments**: Document complex logic and business rules

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: Development Team
