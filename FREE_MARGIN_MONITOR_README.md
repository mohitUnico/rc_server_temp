# Free Margin Monitor Service

## Overview

The Free Margin Monitor Service is a critical risk management component that automatically monitors the free margin of all trading accounts and closes all open positions when the free margin reaches 0 or a specified threshold. This service helps prevent margin calls and protects trading accounts from excessive losses.

## Features

- **Real-time Monitoring**: Continuously monitors free margin for all active trading accounts
- **Automatic Position Closure**: Closes all open positions when free margin threshold is reached
- **Configurable Threshold**: Can be configured to trigger at different free margin levels
- **Market Price Execution**: Closes positions at current market prices
- **Comprehensive Logging**: Detailed logging for monitoring and debugging
- **Graceful Error Handling**: Robust error handling with fallback mechanisms

## How It Works

1. **Monitoring Loop**: The service runs every 5 seconds (configurable) to check all active trading accounts
2. **Free Margin Check**: For each account, it compares the current free margin against the threshold (default: 0)
3. **Position Closure**: When free margin reaches or falls below the threshold, all open positions for that account are closed at current market prices
4. **Balance Update**: After position closure, account balances are automatically updated with the realized PnL

## Configuration

### Default Settings

```javascript
{
  checkIntervalMs: 5000,    // Check every 5 seconds
  marginThreshold: 0        // Close positions when free margin <= 0
}
```

### Customizing Settings

```javascript
// Change check interval to 10 seconds
freeMarginMonitorService.setCheckInterval(10000);

// Change margin threshold to 100 (close when free margin <= 100)
freeMarginMonitorService.setMarginThreshold(100);

// Get current service status
const status = freeMarginMonitorService.getStatus();
```

## Service Methods

### Core Methods

- `start()` - Start the monitoring service
- `stop()` - Stop the monitoring service
- `checkFreeMargin()` - Manually trigger a free margin check
- `getStatus()` - Get current service status and configuration

### Configuration Methods

- `setCheckInterval(intervalMs)` - Update the check interval
- `setMarginThreshold(threshold)` - Update the margin threshold

## Integration

The service is automatically started when the server starts and is included in the graceful shutdown process.

### Server Integration

```javascript
// In server.js
import freeMarginMonitorService from "./services/freeMarginMonitorService.js";

// Start service
freeMarginMonitorService.start();

// Stop service (in graceful shutdown)
freeMarginMonitorService.stop();
```

## Logging

The service provides comprehensive logging at different levels:

- **INFO**: Service start/stop, position closures, account monitoring
- **WARN**: Free margin threshold reached, position closure triggers
- **DEBUG**: Detailed monitoring information
- **ERROR**: Service errors, position closure failures

### Example Log Output

```
[FreeMarginMonitorService] INFO: Starting free margin monitor service
[FreeMarginMonitorService] DEBUG: Checking free margin for 3 trading accounts
[FreeMarginMonitorService] WARN: Free margin threshold reached for account 12345678: 0
[FreeMarginMonitorService] INFO: Closing all positions for account 12345678 due to low free margin
[FreeMarginMonitorService] INFO: Found 2 open positions to close for account 12345678
[FreeMarginMonitorService] INFO: Closing position 987654321 at market price 1.2345
[FreeMarginMonitorService] INFO: Successfully closed position 987654321 at price 1.2345
```

## Testing

A comprehensive test script is available to verify the service functionality:

```bash
node scripts/testFreeMarginMonitor.js
```

The test script includes:

- Service status verification
- Active account enumeration
- Free margin threshold simulation
- Position closure testing
- Service configuration testing
- Start/stop functionality testing

## Error Handling

The service includes robust error handling:

1. **Price Service Failures**: If current market prices are unavailable, positions are closed at entry price with 0 PnL
2. **Database Errors**: Errors are logged but don't stop the monitoring loop
3. **Position Closure Failures**: Individual position closure failures are logged but don't prevent other positions from being closed
4. **Account Access Errors**: Errors accessing specific accounts are logged but don't affect monitoring of other accounts

## Performance Considerations

- **Efficient Queries**: Uses optimized database queries to minimize performance impact
- **Configurable Intervals**: Check interval can be adjusted based on system requirements
- **Batch Processing**: Processes multiple accounts efficiently in each check cycle
- **Memory Management**: Proper cleanup and resource management

## Security Considerations

- **Read-Only Monitoring**: The service only reads account data and closes positions
- **No Authentication Bypass**: Uses existing repository methods with proper authentication
- **Audit Trail**: All actions are logged for audit purposes
- **Graceful Degradation**: Service failures don't compromise system security

## Monitoring and Alerts

The service can be monitored through:

1. **Service Status**: Check if the service is running
2. **Log Analysis**: Monitor logs for threshold breaches and position closures
3. **Database Queries**: Query position and account tables for closure events
4. **Health Checks**: Service health can be verified through the main server health endpoint

## Future Enhancements

Potential improvements for the service:

1. **Email Notifications**: Send alerts when positions are closed due to low margin
2. **Webhook Integration**: Trigger external systems when margin thresholds are breached
3. **Advanced Thresholds**: Support for different thresholds based on account type or user preferences
4. **Partial Position Closure**: Option to close only a portion of positions to maintain some margin
5. **Margin Call Simulation**: Test scenarios to verify margin call behavior
6. **Performance Metrics**: Track service performance and optimization opportunities

## Troubleshooting

### Common Issues

1. **Service Not Starting**: Check database connectivity and repository initialization
2. **Positions Not Closing**: Verify price service availability and position repository access
3. **High CPU Usage**: Consider increasing check interval or optimizing database queries
4. **Memory Leaks**: Ensure proper cleanup in error handling scenarios

### Debug Mode

Enable debug logging to get detailed information about the monitoring process:

```javascript
// The service uses the Logger utility which can be configured for debug level
```

## Related Services

The Free Margin Monitor Service works in conjunction with:

- **Account Metrics Service**: Provides real-time free margin updates
- **Position Check Service**: Monitors SL/TP levels for individual positions
- **Price Cache Service**: Provides current market prices for position closure
- **Position Repository**: Handles position closure operations
- **Trading Account Repository**: Provides account and margin information
