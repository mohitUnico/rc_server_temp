# Margin Validation for Market Orders

## Overview

The system now includes comprehensive margin validation for market orders that calculates the actual required margin for each specific order and verifies that the account has sufficient free margin before allowing the order to be placed.

## Features

### ✅ Comprehensive Margin Calculation

- **Real-time price fetching**: Gets current market price for accurate margin calculation
- **Instrument-specific contract sizes**: Uses actual contract sizes from the database
- **Account leverage consideration**: Applies the account's specific leverage setting
- **Lot size validation**: Calculates margin based on the exact lot size requested

### ✅ Detailed Error Reporting

- **Specific margin requirements**: Shows exactly how much margin is required
- **Available margin display**: Shows current free margin in the account
- **Margin deficit calculation**: Shows how much additional margin is needed
- **Calculation details**: Provides transparency on how the margin was calculated

### ✅ Integration with Position Creation

- **Accurate margin tracking**: Positions are created with the correct margin used
- **Real-time validation**: Margin is checked at the time of order placement
- **Consistent calculation**: Same margin calculation used across all market order endpoints

## How It Works

### 1. Margin Calculation Formula

```javascript
// Calculate the notional value of the position
const notionalValue = lotSize * contractSize * currentPrice;

// Calculate required margin based on leverage
const marginRequirement = notionalValue / leverage;
```

### 2. Validation Process

1. **Fetch current price** for the instrument
2. **Get account details** including leverage and free margin
3. **Get instrument details** including contract size
4. **Calculate required margin** using the formula above
5. **Compare with free margin** and reject if insufficient
6. **Store calculated margin** for position creation

### 3. Error Response Format

When margin is insufficient, the API returns:

```json
{
  "error": "Insufficient free margin for this order",
  "details": {
    "requiredMargin": "1050.00",
    "availableMargin": "500.00",
    "marginDeficit": "550.00",
    "lotSize": 0.1,
    "currentPrice": 1.05,
    "leverage": 100,
    "contractSize": 100000
  }
}
```

## API Endpoints

### Market Order Endpoints with Margin Validation

All market order endpoints now use the comprehensive margin validation:

- `POST /orders` - General order placement (includes market orders)
- `POST /orders/execute-market` - Execute market order
- `POST /orders/market` - Place market order with automatic price fetching

### Example Request

```json
POST /orders/market
{
  "accountId": "user-123",
  "instrumentId": 1,
  "side": "buy",
  "lotSize": 0.1,
  "sl": 1.0450,
  "tp": 1.0550
}
```

### Example Success Response

```json
{
  "order": {
    /* order details */
  },
  "trade": {
    /* trade details */
  },
  "position": {
    "id": 123,
    "marginUsed": 1050.0
    /* other position details */
  },
  "executedPrice": 1.05,
  "message": "Market buy order executed at 1.0500"
}
```

## Configuration

### Default Settings

- **Leverage**: 100 (1% margin requirement)
- **Contract Size**: 100,000 (for forex instruments)
- **Margin Threshold**: Free margin must be >= required margin

### Customization

You can customize the margin calculation by modifying the `calculateRequiredMargin` function in `validators/orderValidators.js`:

```javascript
function calculateRequiredMargin(
  lotSize,
  price,
  leverage = 100,
  contractSize = 100000
) {
  // Customize margin calculation logic here
  const notionalValue = lotSize * contractSize * price;
  const marginRequirement = notionalValue / leverage;
  return marginRequirement;
}
```

## Testing

### Test Script

Use the provided test script to verify margin validation:

```bash
node scripts/testMarginValidation.js
```

The test script includes:

- **Margin calculation verification**
- **Insufficient margin testing**
- **Sufficient margin testing**
- **Detailed logging of calculations**

### Manual Testing

1. **Test with insufficient margin**:

   - Use an account with low free margin
   - Try to place a large lot size order
   - Verify rejection with detailed error message

2. **Test with sufficient margin**:
   - Use an account with adequate free margin
   - Place a reasonable lot size order
   - Verify successful execution with correct margin used

## Benefits

### Risk Management

- **Prevents margin calls**: Orders are rejected before they can cause margin issues
- **Accurate margin tracking**: Positions reflect the actual margin used
- **Real-time validation**: Margin is checked at current market prices

### User Experience

- **Clear error messages**: Users know exactly why their order was rejected
- **Transparent calculations**: Users can see how margin was calculated
- **Immediate feedback**: No waiting for order processing to fail

### System Integrity

- **Consistent calculations**: Same margin logic used everywhere
- **Data accuracy**: Positions have correct margin values
- **Audit trail**: All margin calculations are logged

## Migration Notes

### From Basic to Comprehensive Validation

The system previously used basic margin validation (`validateFreeMarginPositive`) that only checked if free margin > 0. The new comprehensive validation (`validateSufficientMargin`) provides:

- **More accurate validation**: Checks actual required margin vs available margin
- **Better error reporting**: Provides detailed information about margin requirements
- **Improved position tracking**: Positions are created with accurate margin values

### Backward Compatibility

- **Non-market orders**: Still use basic validation (limit/stop orders)
- **Existing endpoints**: All market order endpoints now use comprehensive validation
- **Error handling**: Improved error messages with more details

## Troubleshooting

### Common Issues

1. **"Failed to fetch current price"**: Check price service connectivity
2. **"Instrument not found"**: Verify instrument ID exists in database
3. **"Trading account not found"**: Verify account UID is correct
4. **Unexpected margin calculations**: Check instrument contract size and account leverage

### Debugging

Enable debug logging to see detailed margin calculations:

```javascript
// In your application startup
const logger = new Logger("OrderValidators");
logger.setLevel("debug");
```

### Performance Considerations

- **Price fetching**: Adds one API call per order validation
- **Database queries**: Requires fetching account and instrument details
- **Calculation overhead**: Minimal computational cost for margin calculation

## Future Enhancements

### Potential Improvements

1. **Margin buffer**: Add configurable margin buffer (e.g., require 110% of calculated margin)
2. **Dynamic leverage**: Support different leverage for different instruments
3. **Margin optimization**: Suggest optimal lot sizes based on available margin
4. **Batch validation**: Validate multiple orders simultaneously for efficiency
5. **Margin forecasting**: Predict margin requirements for pending orders
