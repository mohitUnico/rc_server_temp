# Trading Account API Documentation

This document provides comprehensive documentation for the Trading Account API endpoints, including request/response formats, examples, and usage instructions.

## Base URL

```
http://localhost:3000/http
```

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true|false,
  "data": {...},
  "message": "Description of the operation",
  "error": "Error description (if success: false)"
}
```

## Endpoints

### 1. CRUD Operations

#### Create Trading Account

**POST** `/trading-accounts`

Creates a new trading account for a user.

**Request Body:**

```json
{
  "userId": "user123",
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accountUid": "12345678",
    "userId": "user123",
    "accountNumber": "12345678",
    "accountType": "demo",
    "balance": 10000.0,
    "equity": 10000.0,
    "margin": 0.0,
    "freeMargin": 10000.0,
    "status": "active",
    "currency": "USD",
    "leverage": 100,
    "createdAt": "2025-01-13T10:00:00.000Z",
    "watchlist": []
  },
  "message": "Trading account created successfully"
}
```

#### Get All Trading Accounts

**GET** `/trading-accounts`

Retrieves all trading accounts with pagination and filtering.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (active, suspended, expired)
- `accountType` (optional): Filter by account type
- `currency` (optional): Filter by currency

**Example:**

```
GET /trading-accounts?page=1&limit=5&status=active&currency=USD
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "accountUid": "12345678",
      "userId": "user123",
      "balance": 10000.0,
      "equity": 10000.0,
      "status": "active",
      "currency": "USD"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "totalCount": 25,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Trading accounts retrieved successfully"
}
```

#### Get Trading Account by ID

**GET** `/trading-accounts/id/:id`

Retrieves a trading account by its database ID.

**Example:**

```
GET /trading-accounts/id/1
```

#### Get Trading Account by UID

**GET** `/trading-accounts/uid/:uid`

Retrieves a trading account by its UID.

**Example:**

```
GET /trading-accounts/uid/12345678
```

#### Get Trading Accounts by User

**GET** `/users/:userId/trading-accounts`

Retrieves all trading accounts for a specific user.

**Example:**

```
GET /users/user123/trading-accounts
```

#### Update Trading Account

**PUT** `/trading-accounts/:uid`

Updates a trading account with new data.

**Request Body:**

```json
{
  "balance": 15000.0,
  "equity": 15000.0,
  "currency": "EUR",
  "leverage": 200
}
```

#### Delete Trading Account

**DELETE** `/trading-accounts/:uid`

Deletes a trading account.

**Example:**

```
DELETE /trading-accounts/12345678
```

### 2. Balance Management

#### Set Balance

**PUT** `/trading-accounts/:uid/balance`

Sets the account balance to a specific value.

**Request Body:**

```json
{
  "balance": 20000.0
}
```

#### Update Balance by Amount

**PUT** `/trading-accounts/:uid/balance/amount`

Adds or subtracts an amount from the current balance.

**Request Body:**

```json
{
  "amount": 5000.0
}
```

**Note:** Positive amounts add to balance, negative amounts subtract from balance.

#### Update Account Metrics

**PUT** `/trading-accounts/:uid/metrics`

Updates multiple account metrics at once.

**Request Body:**

```json
{
  "balance": 20000.0,
  "equity": 19500.0,
  "margin": 500.0,
  "freeMargin": 19000.0
}
```

### 3. Status Management

#### Update Account Status

**PUT** `/trading-accounts/:uid/status`

Updates the account status.

**Request Body:**

```json
{
  "status": "suspended"
}
```

**Valid Status Values:**

- `active`
- `suspended`
- `expired`

#### Activate Account

**POST** `/trading-accounts/:uid/activate`

Activates a suspended or expired account.

**Example:**

```
POST /trading-accounts/12345678/activate
```

#### Suspend Account

**POST** `/trading-accounts/:uid/suspend`

Suspends an active account.

**Example:**

```
POST /trading-accounts/12345678/suspend
```

### 4. Watchlist Management

#### Get Watchlist

**GET** `/trading-accounts/:uid/watchlist`

Retrieves the watchlist for a trading account.

**Example:**

```
GET /trading-accounts/12345678/watchlist
```

**Response:**

```json
{
  "success": true,
  "data": ["EURUSD", "GBPUSD", "BTCUSD"],
  "count": 3,
  "message": "Watchlist retrieved successfully"
}
```

#### Get Watchlist with Categories

**GET** `/trading-accounts/:uid/watchlist/categories`

Retrieves the watchlist with symbol categories.

**Response:**

```json
{
  "success": true,
  "data": {
    "EURUSD": "forex",
    "GBPUSD": "forex",
    "BTCUSD": "crypto"
  },
  "count": 3,
  "message": "Watchlist with categories retrieved successfully"
}
```

#### Add Symbol to Watchlist

**POST** `/trading-accounts/:uid/watchlist`

Adds a symbol to the watchlist.

**Request Body:**

```json
{
  "symbol": "USDJPY"
}
```

#### Remove Symbol from Watchlist

**DELETE** `/trading-accounts/:uid/watchlist/:symbol`

Removes a symbol from the watchlist.

**Example:**

```
DELETE /trading-accounts/12345678/watchlist/EURUSD
```

#### Update Entire Watchlist

**PUT** `/trading-accounts/:uid/watchlist`

Replaces the entire watchlist with a new list.

**Request Body:**

```json
{
  "watchlist": ["EURUSD", "GBPUSD", "USDJPY", "BTCUSD"]
}
```

### 5. Filtering and Statistics

#### Get Trading Accounts by Status

**GET** `/trading-accounts/status/:status`

Retrieves trading accounts filtered by status.

**Example:**

```
GET /trading-accounts/status/active?page=1&limit=10
```

#### Get Trading Accounts by Type

**GET** `/trading-accounts/type/:type`

Retrieves trading accounts filtered by account type.

**Example:**

```
GET /trading-accounts/type/demo?page=1&limit=10
```

#### Get Trading Accounts by Currency

**GET** `/trading-accounts/currency/:currency`

Retrieves trading accounts filtered by currency.

**Example:**

```
GET /trading-accounts/currency/USD?page=1&limit=10
```

#### Get Trading Account Statistics

**GET** `/trading-accounts/statistics`

Retrieves comprehensive statistics about all trading accounts.

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 100,
    "active": 85,
    "suspended": 10,
    "expired": 5,
    "totalBalance": 1500000.0,
    "totalEquity": 1485000.0,
    "totalMargin": 15000.0,
    "totalFreeMargin": 1470000.0,
    "averageBalance": 15000.0,
    "averageEquity": 14850.0
  },
  "message": "Trading account statistics retrieved successfully"
}
```

## Error Handling

### Common Error Responses

#### 400 Bad Request

```json
{
  "success": false,
  "error": "Missing required fields",
  "message": "userId and email are required"
}
```

#### 404 Not Found

```json
{
  "success": false,
  "error": "Trading account not found",
  "message": "No trading account found with UID: 12345678"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Failed to retrieve trading account"
}
```

## Usage Examples

### JavaScript/Node.js

```javascript
const axios = require("axios");

// Create a trading account
const createAccount = async () => {
  try {
    const response = await axios.post(
      "http://localhost:3000/http/trading-accounts",
      {
        userId: "user123",
        email: "user@example.com",
      }
    );
    console.log("Account created:", response.data);
  } catch (error) {
    console.error("Error:", error.response.data);
  }
};

// Get account by UID
const getAccount = async (uid) => {
  try {
    const response = await axios.get(
      `http://localhost:3000/http/trading-accounts/uid/${uid}`
    );
    console.log("Account:", response.data);
  } catch (error) {
    console.error("Error:", error.response.data);
  }
};

// Update balance
const updateBalance = async (uid, newBalance) => {
  try {
    const response = await axios.put(
      `http://localhost:3000/http/trading-accounts/${uid}/balance`,
      {
        balance: newBalance,
      }
    );
    console.log("Balance updated:", response.data);
  } catch (error) {
    console.error("Error:", error.response.data);
  }
};

// Add symbol to watchlist
const addToWatchlist = async (uid, symbol) => {
  try {
    const response = await axios.post(
      `http://localhost:3000/http/trading-accounts/${uid}/watchlist`,
      {
        symbol: symbol,
      }
    );
    console.log("Symbol added:", response.data);
  } catch (error) {
    console.error("Error:", error.response.data);
  }
};
```

### cURL Examples

```bash
# Create trading account
curl -X POST http://localhost:3000/http/trading-accounts \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "email": "user@example.com"}'

# Get account by UID
curl http://localhost:3000/http/trading-accounts/uid/12345678

# Update balance
curl -X PUT http://localhost:3000/http/trading-accounts/12345678/balance \
  -H "Content-Type: application/json" \
  -d '{"balance": 20000.0}'

# Add to watchlist
curl -X POST http://localhost:3000/http/trading-accounts/12345678/watchlist \
  -H "Content-Type: application/json" \
  -d '{"symbol": "EURUSD"}'

# Get statistics
curl http://localhost:3000/http/trading-accounts/statistics
```

## Data Models

### TradingAccount Model

```javascript
{
  accountUid: string,        // Unique account identifier
  userId: string,           // Associated user ID
  accountNumber: string,    // Account number
  accountType: string,      // Account type (demo, live, etc.)
  balance: number,          // Current balance
  equity: number,           // Current equity
  margin: number,           // Used margin
  freeMargin: number,       // Free margin
  status: string,           // Account status (active, suspended, expired)
  currency: string,         // Account currency
  leverage: number,         // Account leverage
  createdAt: Date,          // Creation timestamp
  watchlist: string[]       // Array of watchlist symbols
}
```

## Notes

1. **Account UID**: The primary identifier for trading accounts is the `accountUid`, not the database ID.
2. **Balance Validation**: Balance cannot be negative. If a negative amount would result in a negative balance, it will be set to 0.
3. **Watchlist**: Watchlist symbols are stored as an array of strings.
4. **Pagination**: All list endpoints support pagination with `page` and `limit` parameters.
5. **Filtering**: Multiple filter parameters can be combined in a single request.
6. **Error Handling**: All endpoints return consistent error responses with appropriate HTTP status codes.

## Rate Limiting

Currently, there are no rate limits implemented. Consider implementing rate limiting for production use.

## Security Considerations

1. **Input Validation**: All input is validated before processing.
2. **SQL Injection**: Uses parameterized queries to prevent SQL injection.
3. **Authentication**: Consider implementing authentication for production use.
4. **Authorization**: Consider implementing role-based access control.



