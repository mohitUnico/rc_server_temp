# Instrument Cache Service

## Overview

The Instrument Cache Service is a high-performance in-memory caching system that stores all instrument data when the server starts, eliminating the need for repeated Supabase database calls. This service significantly improves response times and reduces database load for instrument-related operations.

## Features

- **In-Memory Caching**: Stores all instrument data in memory for instant access
- **Multiple Indexes**: Caches instruments by ID, symbol, and category for efficient lookups
- **Auto-Refresh**: Automatically refreshes cache data every 5 minutes to keep data current
- **Statistics Tracking**: Monitors cache performance with hit rates and timing metrics
- **Repository Integration**: Seamlessly integrates with existing repository methods
- **Search Functionality**: Provides fast search across instrument names and symbols
- **Category Filtering**: Quick access to instruments by category (Forex, Crypto, Indices, etc.)

## Performance Benefits

- **Zero Database Calls**: After initialization, all instrument lookups are served from memory
- **Sub-millisecond Response**: Cache lookups are typically under 1ms
- **Reduced Database Load**: Eliminates repeated queries for the same instrument data
- **Scalable**: Handles thousands of instruments efficiently

## How It Works

1. **Initialization**: On server start, loads all active instruments from database into memory
2. **Multiple Indexes**: Creates separate data structures for different lookup patterns:
   - `instrumentsById`: Map for ID-based lookups
   - `instrumentsBySymbol`: Map for symbol-based lookups
   - `instrumentsByCategory`: Map for category-based lookups
   - `activeInstruments`: Map of only active instruments
   - `allInstruments`: Array of all instruments
3. **Auto-Refresh**: Periodically reloads data to keep cache current
4. **Repository Integration**: Repository methods check cache first before hitting database

## Cache Data Structures

```javascript
{
  instrumentsById: Map<number, Instrument>,           // ID → Instrument
  instrumentsBySymbol: Map<string, Instrument>,       // Symbol → Instrument
  instrumentsByCategory: Map<string, Instrument[]>,   // Category → Instrument[]
  activeInstruments: Map<number, Instrument>,         // ID → Active Instrument
  allInstruments: Instrument[]                        // All instruments array
}
```

## Service Methods

### Core Methods

- `initialize()` - Load all instruments from database into cache
- `refresh()` - Reload all instruments from database
- `isReady()` - Check if cache is initialized and ready
- `getStatus()` - Get comprehensive cache status and statistics

### Data Access Methods

- `getInstrumentById(id)` - Get instrument by ID
- `getInstrumentBySymbol(symbol)` - Get instrument by symbol
- `getAllInstruments()` - Get all instruments
- `getActiveInstruments()` - Get only active instruments
- `getInstrumentsByCategory(category)` - Get instruments by category
- `searchInstruments(query)` - Search instruments by name or symbol

### Category-Specific Methods

- `getForexInstruments()` - Get all Forex instruments
- `getCryptoInstruments()` - Get all Crypto instruments
- `getIndicesInstruments()` - Get all Indices instruments
- `getCommoditiesInstruments()` - Get all Commodities instruments

### Management Methods

- `startAutoRefresh(intervalMs)` - Start automatic refresh
- `stopAutoRefresh()` - Stop automatic refresh
- `updateInstrument(instrument)` - Update single instrument in cache
- `removeFromCache(instrumentId)` - Remove instrument from cache
- `getStats()` - Get cache performance statistics

## Configuration

### Default Settings

```javascript
{
  autoRefreshInterval: 300000,  // 5 minutes
  checkIntervalMs: 5000         // 5 seconds for monitoring
}
```

### Customizing Settings

```javascript
// Start auto-refresh with custom interval (10 minutes)
instrumentCacheService.startAutoRefresh(600000);

// Get cache statistics
const stats = instrumentCacheService.getStats();

// Check cache status
const status = instrumentCacheService.getStatus();
```

## Integration

The service is automatically initialized when the server starts and integrates seamlessly with existing repository methods.

### Server Integration

```javascript
// In server.js
import instrumentCacheService from "./services/instrumentCacheService.js";

// Initialize cache
await instrumentCacheService.initialize();

// Start auto-refresh
instrumentCacheService.startAutoRefresh(300000);

// Stop auto-refresh (in graceful shutdown)
instrumentCacheService.stopAutoRefresh();
```

### Repository Integration

The InstrumentRepository automatically uses the cache:

```javascript
// These methods now check cache first
const instrument = await instrumentRepository.findInstrumentById(123);
const instruments = await instrumentRepository.getAllInstruments();
const forexInstruments = await instrumentRepository.findInstrumentsByCategory(
  "forex"
);
```

## Performance Statistics

The service tracks comprehensive performance metrics:

```javascript
{
  totalInstruments: 130,
  activeInstruments: 130,
  categories: Set(4) { 'forex', 'crypto', 'indices', 'commodities' },
  lastRefreshDuration: 315,        // milliseconds
  cacheHits: 1250,                // successful cache lookups
  cacheMisses: 5,                 // cache misses (fallback to DB)
  hitRate: '99.60%',              // cache hit percentage
  cacheSize: {
    byId: 130,                    // instruments cached by ID
    bySymbol: 130,                // instruments cached by symbol
    byCategory: 4,                // categories with instruments
    active: 130,                  // active instruments
    total: 130                    // total instruments
  }
}
```

## Logging

The service provides detailed logging at different levels:

- **INFO**: Initialization, refresh operations, auto-refresh start/stop
- **DEBUG**: Individual cache operations, instrument updates
- **WARN**: Cache refresh conflicts, initialization issues
- **ERROR**: Database connection failures, cache corruption

### Example Log Output

```
[InstrumentCacheService] INFO: 🔄 Initializing instrument cache...
[InstrumentCacheService] INFO: ✅ Instrument cache initialized with 130 instruments in 315ms
[InstrumentCacheService] INFO: 📊 Cache stats: 130 active, 4 categories
[InstrumentCacheService] INFO: 🔄 Auto-refresh started with 300s interval
[InstrumentCacheService] INFO: ✅ Instrument cache refreshed with 130 instruments in 2ms
```

## Error Handling

The service includes robust error handling:

1. **Database Failures**: Graceful fallback with error logging
2. **Cache Corruption**: Automatic cache clearing and reinitialization
3. **Memory Issues**: Efficient memory management with cleanup
4. **Concurrent Access**: Thread-safe operations with proper locking

## Memory Management

- **Efficient Storage**: Uses Map and Set data structures for optimal performance
- **Memory Monitoring**: Tracks cache size and memory usage
- **Cleanup**: Proper cleanup of references to prevent memory leaks
- **Garbage Collection**: Allows garbage collection of unused data

## Testing

The service includes comprehensive testing capabilities:

```javascript
// Test cache initialization
await instrumentCacheService.initialize();

// Test data retrieval
const instruments = instrumentCacheService.getAllInstruments();
const instrument = instrumentCacheService.getInstrumentById(123);

// Test performance
const stats = instrumentCacheService.getStats();
console.log(`Cache hit rate: ${stats.hitRate}`);

// Test auto-refresh
instrumentCacheService.startAutoRefresh(10000); // 10 seconds for testing
```

## Monitoring and Alerts

The service can be monitored through:

1. **Cache Statistics**: Real-time performance metrics
2. **Health Checks**: Cache readiness and status
3. **Performance Metrics**: Hit rates, response times, memory usage
4. **Error Tracking**: Failed operations and recovery attempts

## Best Practices

### Usage Guidelines

1. **Always check cache readiness**: Use `isReady()` before accessing data
2. **Handle cache misses gracefully**: Fallback to database when needed
3. **Monitor performance**: Regularly check cache statistics
4. **Configure appropriate refresh intervals**: Balance freshness with performance

### Performance Optimization

1. **Use appropriate methods**: Choose the most specific lookup method
2. **Batch operations**: Use bulk methods when possible
3. **Monitor memory usage**: Watch for memory leaks
4. **Tune refresh intervals**: Adjust based on data update frequency

## Troubleshooting

### Common Issues

1. **Cache Not Initialized**: Check database connectivity and initialization logs
2. **High Memory Usage**: Monitor cache size and consider reducing data
3. **Stale Data**: Check auto-refresh configuration and database updates
4. **Performance Degradation**: Monitor hit rates and cache statistics

### Debug Mode

Enable debug logging for detailed cache operations:

```javascript
// The service uses the Logger utility which can be configured for debug level
```

## Future Enhancements

Potential improvements for the service:

1. **Distributed Caching**: Support for Redis or other distributed cache systems
2. **Selective Loading**: Load only specific categories or instruments
3. **Compression**: Compress cached data to reduce memory usage
4. **Predictive Loading**: Preload frequently accessed instruments
5. **Cache Warming**: Warm cache with popular instruments on startup
6. **Metrics Export**: Export cache metrics to monitoring systems

## Related Services

The Instrument Cache Service works in conjunction with:

- **Instrument Repository**: Provides database access and cache integration
- **Price Cache Service**: Caches real-time price data
- **Account Metrics Service**: Uses instrument data for calculations
- **Position Check Service**: References instruments for position monitoring
- **Order Service**: Uses instrument data for order validation
