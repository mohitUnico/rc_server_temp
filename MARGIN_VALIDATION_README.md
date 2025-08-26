# Free Margin Validation for Market Orders

## Overview

The system now includes comprehensive free margin validation that checks if there's sufficient free margin available for placing specific orders, rather than just checking if free margin > 0.

## Features

- **Order-Specific Margin Calculation**: Calculates required margin based on lot size, current price, and leverage
- **Real-Time Price Fetching**: For market orders, fetches current price to calculate accurate margin requirements
- **Instrument-Aware**: Uses actual contract sizes from instruments or category-based defaults
- **Detailed Error Reporting**: Provides specific details about margin requirements and deficits
- **Comprehensive Logging**: Detailed logging for monitoring and debugging

## How It Works

### Margin Calculation Formula

```
Required Margin = (Lot Size × Contract Size × Current Price) ÷ Leverage
```

**Example:**

- Lot Size: 0.1 (10,000 units)
- Contract Size: 100,000 (Forex standard)
- Current Price: 1.2000
- Leverage: 100:1

```
Required Margin = (0.1 × 100,000 × 1.2000) ÷ 100 = 120 USD
```

### Validation Process

1. **Account Verification**: Checks if the trading account exists and is active
2. **Order Type Detection**: Identifies if it's a market order or other type
3. **Price Fetching**: For market orders, fetches current price from PriceService
4. **Margin Calculation**: Calculates required margin using the formula above
5. **Sufficiency Check**: Compares required margin with available free margin
6. **Response**: Either allows the order or returns detailed error information

## Implementation Details

### Updated Validator

The `validateFreeMarginPositive` function in `validators/orderValidators.js` now:

- Calculates required margin for specific orders
- Fetches current prices for market orders
- Uses instrument contract sizes when available
- Provides detailed error responses with margin details

### Contract Size Handling

The system uses contract sizes in this priority order:

1. **Database Value**: Uses `contract_size` from instruments table
2. **Category Defaults**: Falls back to category-based defaults:
   - Forex: 100,000
   - Metal: 100
   - Crypto: 1
   - Default: 1
3. **Conservative Estimate**: For non-market orders, uses lot size × 1000

### Error Response Format

When insufficient margin is detected:

```json
{
  "error": "Insufficient free margin for this order",
  "details": {
    "requiredMargin": "120.00",
    "availableMargin": "50.00",
    "marginDeficit": "70.00",
    "lotSize": 0.1,
    "currentPrice": 1.2,
    "leverage": 100
  }
}
```

## API Endpoints

The validation is applied to these endpoints:

- `POST /orders` - Place any order type
- `POST /orders/execute-market` - Execute market order
- `POST /orders/market` - Place market order

## Testing

Run the test script to verify the validation logic:

```bash
node scripts/testMarginValidation.js
```

The test script covers:

- Market orders with sufficient margin
- Market orders with insufficient margin
- Non-market orders
- Invalid accounts
- Missing required fields

## Configuration

### Leverage Settings

Leverage is stored in the trading account and defaults to 100:1. You can modify this in the `TradingAccount` model.

### Contract Sizes

Contract sizes can be configured in the `instruments` table or will use category-based defaults.

## Logging

The validation includes comprehensive logging:

- **Info Level**: Price fetching, margin calculations, validation results
- **Debug Level**: Detailed calculation steps
- **Warn Level**: Insufficient margin warnings
- **Error Level**: Calculation errors and failures

## Security Considerations

- All database queries use parameterized queries
- Price data is validated before use
- Account isolation ensures users can only access their own data
- Error messages don't expose sensitive account information

## Performance Impact

- **Market Orders**: Additional price fetch required (~50-100ms)
- **Non-Market Orders**: Minimal impact (uses conservative estimate)
- **Caching**: Instrument data is cached to minimize database queries

## Future Enhancements

Potential improvements:

1. **Margin Buffer**: Add configurable margin buffer (e.g., 10% extra required)
2. **Position Correlation**: Consider existing positions when calculating margin
3. **Currency Conversion**: Handle margin calculations in different currencies
4. **Real-Time Updates**: Update margin requirements as prices change
5. **Advanced Risk Management**: Implement position sizing rules

## Troubleshooting

### Common Issues

1. **Price Fetch Failures**: Check PriceService connectivity
2. **Instrument Not Found**: Verify instrument exists in database
3. **Margin Calculation Errors**: Check contract size values
4. **Performance Issues**: Monitor price fetch response times

### Debug Mode

Enable debug logging to see detailed calculation steps:

```javascript
// In your logger configuration
logger.setLevel("debug");
```

## Dependencies

The validation depends on:

- `PriceService` - For fetching current market prices
- `TradingAccountRepository` - For account data
- `InstrumentRepository` - For instrument details
- `Logger` - For consistent logging
