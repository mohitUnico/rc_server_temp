# RC Trading Server - Comprehensive Backend Documentation

## 🎯 Overview

RC Trading Server is a real-time trading platform backend built with Node.js, Express, and WebSocket technology. It provides comprehensive trading functionality including market data streaming, order management, position tracking, and automated trading services.

## 🔧 Implementation Flow Analysis

This document provides comprehensive flow diagrams and implementation details for every component, service, and process in the RC Trading Server.

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Flutter       │    │   Web Clients   │    │   Mobile Apps   │
│   Applications  │    │   (React/Vue)   │    │   (iOS/Android) │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     RC Trading Server     │
                    │     (Node.js/Express)     │
                    └─────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────┴───────┐    ┌─────────┴───────┐    ┌─────────┴───────┐
│   Supabase      │    │   iTick API     │    │   Email Service │
│   Database      │    │   (Market Data) │    │   (Gmail)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

1. **HTTP API Server** - RESTful endpoints for trading operations
2. **WebSocket Server** - Real-time market data streaming
3. **Market Data Integration** - iTick API for live price feeds
4. **Database Layer** - Supabase PostgreSQL for data persistence
5. **Trading Services** - Automated order execution and monitoring
6. **Email Service** - Trading credentials delivery

## 📊 Data Flow Architecture

### Real-time Market Data Flow

```
iTick API ──► WebSocket Manager ──► Price Cache Service ──► Trading Services
    │                                    │                        │
    ▼                                    ▼                        ▼
WebSocket ──► Flutter Clients    Database Updates    Position Monitoring
Connection    (Real-time UI)     (Orders/Positions)  (SL/TP Execution)
```

### Trading Order Flow

```
Client Request ──► Controller ──► Repository ──► Database
     │                │              │            │
     ▼                ▼              ▼            ▼
Validation    Business Logic    Data Access   Persistence
     │                │              │            │
     ▼                ▼              ▼            ▼
Response ◄── Service Layer ◄── Model Layer ◄── Database
```

## 🗂️ Project Structure

```
rc_server_temp1/
├── 📁 config/                 # Configuration files
│   ├── supabase.js           # Database connection
│   ├── websocket.js          # WebSocket configurations
│   ├── emailConfig.js        # Email service settings
│   └── envConfig.js          # Environment variables
├── 📁 controllers/           # HTTP request handlers
│   ├── OrderController.js    # Order management
│   ├── PositionController.js # Position management
│   ├── TradingAccountController.js # Account operations
│   └── InstrumentController.js # Instrument data
├── 📁 services/              # Business logic services
│   ├── accountMetricsService.js    # Account metrics calculation
│   ├── positionCheckService.js     # SL/TP monitoring
│   ├── pendingOrderService.js      # Order execution
│   ├── priceCacheService.js        # Price data caching
│   ├── instrumentCacheService.js   # Instrument data caching
│   ├── freeMarginMonitorService.js # Margin monitoring
│   ├── emailService.js             # Email functionality
│   └── databaseService.js          # Database operations
├── 📁 models/                # Data models
│   ├── TradingAccount.js     # Account model
│   ├── Order.js              # Order model
│   ├── Position.js           # Position model
│   ├── Instrument.js         # Instrument model
│   └── Trade.js              # Trade model
├── 📁 repositories/          # Data access layer
│   ├── BaseRepository.js     # Base repository class
│   ├── TradingAccountRepository.js
│   ├── OrderRepository.js
│   ├── PositionRepository.js
│   └── InstrumentRepository.js
├── 📁 sockets/               # WebSocket implementations
│   ├── flutterClient.js      # Client WebSocket server
│   ├── iTickForex.js         # Forex data connection
│   ├── iTickCrypto.js        # Crypto data connection
│   └── iTickIndices.js       # Indices data connection
├── 📁 http/                  # HTTP route handlers
│   ├── orders.js             # Order routes
│   ├── positions.js          # Position routes
│   ├── tradingAccounts.js    # Account routes
│   ├── instruments.js        # Instrument routes
│   └── quote.js              # Price quote routes
├── 📁 enums/                 # Enumerations
│   ├── orderEnums.js         # Order types and statuses
│   ├── positionEnums.js      # Position types and statuses
│   ├── accountEnums.js       # Account statuses
│   └── instrumentEnums.js    # Instrument categories
├── 📁 utils/                 # Utility functions
│   ├── logger.js             # Logging utility
│   ├── ping.js               # WebSocket ping utility
│   └── subscriptionManager.js # Client subscription management
├── 📁 websocket/             # WebSocket management
│   └── WebSocketManager.js   # WebSocket connection manager
├── 📁 validators/            # Input validation
│   └── orderValidators.js    # Order validation rules
├── 📁 scripts/               # Test and utility scripts
└── server.js                 # Main application entry point
```

## 🔧 Core Services - Implementation Flow Analysis

### 1. Account Metrics Service (`accountMetricsService.js`)

**Purpose**: Real-time calculation of trading account metrics

#### **Service Flow Architecture**:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Start Service │    │  Timer Interval │    │  Update Process │
│   (Singleton)   │───▶│    (1000ms)     │───▶│   (Every 1s)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Get All Active │    │  For Each       │    │  Calculate      │
│  Trading        │◀───│  Account        │───▶│  Position       │
│  Accounts       │    │  Process        │    │  Metrics        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Update Account │◀───│  Calculate      │◀───│  Get Current    │
│  with Metrics   │    │  Final Metrics  │    │  Price from     │
│  in Database    │    │  (Equity, etc)  │    │  Price Cache    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Metrics Calculation Flow**:

```
Account Balance + Open Positions → Calculate Unrealized P&L → Calculate Margin → Calculate Free Margin → Update Database

┌─────────────────┐
│ Account Balance │
                       └─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   For Each      │───▶│  Get Current    │───▶│  Calculate      │
│   Open Position │    │  Price from     │    │  Unrealized     │
│                 │    │  Price Cache    │    │  P&L            │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                                              │
        ▼                                              ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Sum All        │◀───│  Calculate      │◀───│  Position       │
│  Unrealized P&L │    │  Total Margin   │    │  Type Logic     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
│  Final Metrics  │
│  Equity = Balance + Unrealized P&L
│  Free Margin = Equity - Margin
│  Margin Level = (Equity / Margin) * 100
                       └─────────────────┘
```

#### **Implementation Details**:
- **Update Frequency**: 1 second interval
- **Singleton Pattern**: Single instance manages all account metrics
- **Dependencies**: Price Cache Service, Trading Account Repository, Position Repository
- **Process Flow**: Get active accounts → Calculate position metrics → Update database
- **Error Handling**: Graceful fallback to safe defaults on calculation errors

---

### 2. Position Check Service (`positionCheckService.js`)

**Purpose**: Automated stop-loss and take-profit monitoring

#### **Service Flow Architecture**:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Start Service │    │  Timer Interval │    │  Check Process  │
│   (Singleton)   │───▶│    (1000ms)     │───▶│   (Every 1s)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Get All Open   │    │  For Each       │    │  Check SL/TP    │
│  Positions      │◀───│  Position       │───▶│  Triggers       │
│  from Database  │    │  Process        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Close Position │◀───│  Trigger        │◀───│  Get Current    │
│  & Update       │    │  Detected       │    │  Price from     │
│  Account        │    │  (SL or TP)     │    │  Price Cache    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **SL/TP Monitoring Flow**:

```
┌─────────────────┐
│  Open Position  │
│  (SL/TP Set)    │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Get Current    │───▶│  Check Stop     │───▶│  Check Take     │
│  Market Price   │    │  Loss Trigger   │    │  Profit Trigger │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  No Trigger     │    │  Stop Loss      │    │  Take Profit    │
│  Continue       │    │  Hit - Close    │    │  Hit - Close    │
│  Monitoring     │    │  Position       │    │  Position       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Position Closure Process Flow**:

```
Position Trigger Detected → Calculate P&L → Update Position Status → Update Account Balance → Create Trade Record

┌─────────────────┐
│  Trigger        │
│  Detected       │
│  (SL/TP Hit)    │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Calculate      │───▶│  Update         │───▶│  Update         │
│  Final P&L      │    │  Position       │    │  Account        │
│  (Entry vs      │    │  Status to      │    │  Balance        │
│  Exit Price)    │    │  'CLOSED'       │    │  (+/- P&L)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Create         │◀───│  Generate       │◀───│  Log Closure    │
│  Closing        │    │  Trade Record   │    │  Event          │
│  Order Entry    │    │  for Audit      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Implementation Details**:
- **Check Frequency**: 1 second interval
- **Dependencies**: Price Cache Service, Position Repository
- **Process Flow**: Get open positions → Check SL/TP triggers → Close position if triggered
- **Position Model Methods**: `isStopLossHit()`, `isTakeProfitHit()` with position type logic
- **Closure Process**: P&L calculation → Position update → Account balance update → Trade record creation

---

### 3. Pending Order Service (`pendingOrderService.js`)

**Purpose**: Automated execution of pending orders

#### **Service Flow Architecture**:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Start Service │    │  Timer Interval │    │  Check Process  │
│   (Singleton)   │───▶│    (100ms)      │───▶│ (Every 0.1s)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Get All        │    │  For Each       │    │  Check Limit    │
│  Pending        │◀───│  Order          │───▶│  Price          │
│  Orders         │    │  Process        │    │  Conditions     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Fill Order &   │◀───│  Limit Price    │◀───│  Get Current    │
│  Create         │    │  Met            │    │  Price from     │
│  Position       │    │  (Execute)      │    │  Price Cache    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Order Execution Flow**:

```
┌─────────────────┐
│  Pending Order  │
│  (Limit/Stop)   │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Get Current    │───▶│  Check Order    │───▶│  Order Type     │
│  Market Price   │    │  Type Logic     │    │  Specific       │
└─────────────────┘    └─────────────────┘    │  Conditions     │
                                              └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Continue       │    │  Buy Limit:     │    │  Sell Limit:    │
│  Monitoring     │◀───│  Price ≤ Limit  │    │  Price ≥ Limit  │
│  (No Execute)   │    │  Buy Stop:      │    │  Sell Stop:     │
└─────────────────┘    │  Price ≥ Limit  │    │  Price ≤ Limit  │
                       └─────────────────┘    └─────────────────┘
```

#### **Order Filling Process Flow**:

```
Order Execution Triggered → Fill Order → Create Position → Link Order to Position

┌─────────────────┐
│  Order          │
│  Execution      │
│  Triggered      │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Update Order   │───▶│  Determine      │───▶│  Create         │
│  Status to      │    │  Position       │    │  Position       │
│  'FILLED'       │    │  Type (Buy/Sell)│    │  with Margin    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Set Fill       │◀───│  Calculate      │◀───│  Set Entry      │
│  Price & Time   │    │  Required       │    │  Price &        │
│                 │    │  Margin         │    │  SL/TP          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │
        ▼
┌─────────────────┐
│  Link Order     │
│  to Position    │
│  (position_id)  │
└─────────────────┘
```

#### **Implementation Details**:
- **Check Frequency**: 0.1 seconds (100ms) - ultra-fast execution
- **Dependencies**: Price Cache Service, Order Repository, Position Repository
- **Process Flow**: Get pending orders → Check limit price conditions → Fill order → Create position
- **Order Types**: Buy Limit, Sell Limit, Buy Stop, Sell Stop with specific price conditions
- **Execution Logic**: Position type determination based on order type, margin calculation, order-position linking

---

### 4. Price Cache Service (`priceCacheService.js`)

**Purpose**: In-memory caching of real-time price data

#### **Cache Architecture Flow**:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  WebSocket      │    │  Price Cache    │    │  Service        │
│  Data Stream    │───▶│  Update         │───▶│  Requests       │
│  (Forex/Crypto) │    │  (Map Storage)  │    │  (Fast Access)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Stale Data     │    │  Periodic       │    │  Statistics     │
│  Cleanup        │◀───│  Logging        │◀───│  Tracking       │
│  (Every 30s)    │    │  (Every 1min)   │    │  (Real-time)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Price Data Flow**:

```
WebSocket Message → Parse Price Data → Update Cache → Check Staleness → Serve to Services

┌─────────────────┐
│  WebSocket      │
│  Price Update   │
│  (Symbol:Price) │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Parse &        │───▶│  Update Cache   │───▶│  Add Timestamp  │
│  Validate       │    │  Map Structure  │    │  & Metadata     │
│  Price Data     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Special        │◀───│  Update         │◀───│  Cache by       │
│  Forex Stats    │    │  Statistics     │    │  Asset Type     │
│  Tracking       │    │  Counters       │    │  (Forex/Crypto) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Cache Access Flow**:

```
Service Request → Check Cache → Validate Staleness → Return Price or Null

┌─────────────────┐
│  Service        │
│  Price Request  │
│  (Symbol)       │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Check Cache    │───▶│  Found in       │───▶│  Check Age      │
│  Map for        │    │  Cache          │    │  vs Threshold   │
│  Symbol         │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Return Null    │◀───│  Stale Data     │    │  Fresh Data     │
│  (Not Found)    │    │  (>10s forex,   │    │  Return Price   │
│                 │    │   >5s others)   │    │  Value          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Statistics & Logging Flow**:

```
┌─────────────────┐
│  Periodic       │
│  Statistics     │
│  Update         │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Count Total    │───▶│  Count Active   │───▶│  Group by       │
│  Symbols        │    │  Symbols        │    │  Price Ranges   │
│  in Cache       │    │  (<10s old)     │    │  (0.1-1.0, etc)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Update Stats   │◀───│  Calculate      │◀───│  Color Code     │
│  Object         │    │  Hit Rates      │    │  Status         │
│                 │    │                 │    │  (🟢🟡🔴)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Implementation Details**:
- **Cache Structure**: Separate Maps for Forex, Crypto, Indices with symbol-based keys
- **Data Format**: `{price, timestamp, data}` objects with metadata
- **Staleness Thresholds**: 10 seconds for Forex, 5 seconds for others
- **Auto-cleanup**: Periodic removal of stale entries every 30 seconds
- **Statistics Tracking**: Real-time counts of total/active symbols, hit rates
- **Logging System**: Detailed price status with color-coded freshness indicators

---

### 5. Instrument Cache Service (`instrumentCacheService.js`)

**Purpose**: In-memory caching of instrument data

#### **Cache Architecture Flow**:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Database       │    │  Cache Refresh  │    │  Multiple Cache │
│  Instruments    │───▶│  (Every 5min)   │───▶│  Structures     │
│  Table          │    │                 │    │  (ID/Symbol/etc)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Search         │    │  Category       │    │  Performance    │
│  Requests       │◀───│  Filtering      │◀───│  Monitoring     │
│  (Fast Access)  │    │  (Grouped)      │    │  (Hit Rates)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Multi-Map Cache Structure**:

```
┌─────────────────┐
│  Database       │
│  Instruments    │
│  (Single Table) │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  ID Map         │    │  Symbol Map     │    │  Category Map   │
│  ID → Instrument│    │  Symbol → Inst  │    │  Cat → Inst[]   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Active Map     │    │  All Array      │    │  Statistics     │
│  ID → Active    │    │  [Instruments]  │    │  Tracking       │
│  Only           │    │                 │    │  (Hits/Misses)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Cache Population Flow**:

```
Database Query → Parse Instruments → Populate All Maps → Update Statistics

┌─────────────────┐
│  Fetch All      │
│  Instruments    │
│  from Database  │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  For Each       │───▶│  Add to ID      │───▶│  Add to Symbol  │
│  Instrument     │    │  Map            │    │  Map            │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Add to         │◀───│  Add to Active  │◀───│  Add to         │
│  Category Map   │    │  Map (if active)│    │  All Array      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │
        ▼
┌─────────────────┐
│  Update         │
│  Statistics     │
│  Counters       │
└─────────────────┘
```

#### **Search & Access Flow**:

```
Service Request → Check Cache → Return Cached Data → Update Hit Rate

┌─────────────────┐
│  Service        │
│  Request        │
│  (ID/Symbol/    │
│   Category)     │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Check          │───▶│  Found in       │───▶│  Return         │
│  Appropriate    │    │  Cache          │    │  Cached         │
│  Map/Array      │    │                 │    │  Data           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Increment      │◀───│  Update Hit     │◀───│  Log Access     │
│  Hit Counter    │    │  Rate           │    │  Statistics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Implementation Details**:
- **Auto-refresh**: Every 5 minutes (300000ms)
- **Cache Structure**: Multiple Maps for different access patterns (ID, Symbol, Category)
- **Search Functionality**: Full-text search across name and symbol fields
- **Performance Monitoring**: Hit rate tracking, cache size monitoring
- **Memory Efficiency**: Optimized data structures for fast lookups

---

### 6. Free Margin Monitor Service (`freeMarginMonitorService.js`)

**Purpose**: Automatic position closure on margin call

#### **Service Flow Architecture**:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Start Service │    │  Timer Interval │    │  Check Process  │
│   (Singleton)   │───▶│    (5000ms)     │───▶│   (Every 5s)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Get All Active │    │  For Each       │    │  Check Free     │
│  Trading        │◀───│  Account        │───▶│  Margin vs      │
│  Accounts       │    │  Process        │    │  Threshold      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Emergency      │◀───│  Margin Call    │◀───│  Free Margin    │
│  Position       │    │  Detected       │    │  ≤ 10 Units     │
│  Closure        │    │  (Critical)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Margin Call Detection Flow**:

```
Account Check → Validate Free Margin → Compare with Threshold → Trigger Emergency Closure

┌─────────────────┐
│  Trading        │
│  Account        │
│  (Active)       │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Validate       │───▶│  Check Data     │───▶│  Compare with   │
│  Free Margin    │    │  Integrity      │    │  Threshold      │
│  Data           │    │  (Number/NaN)   │    │  (10 Units)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Skip Invalid   │◀───│  Skip Invalid   │◀───│  Above          │
│  Data           │    │  Data           │    │  Threshold      │
│                 │    │                 │    │  Continue       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐
│  Below/At       │
│  Threshold      │
│  → EMERGENCY    │
└─────────────────┘
```

#### **Emergency Position Closure Flow**:

```
Margin Call Triggered → Get Open Positions → Close All Positions → Update Account Balance

┌─────────────────┐
│  Margin Call    │
│  Triggered      │
│  (Critical)     │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Get All Open   │───▶│  Check if       │───▶│  For Each       │
│  Positions      │    │  Positions      │    │  Position       │
│  for Account    │    │  Exist          │    │  Close at       │
└─────────────────┘    └─────────────────┘    │  Market Price   │
        │                        │             └─────────────────┘
        ▼                        ▼                        │
┌─────────────────┐    ┌─────────────────┐                ▼
│  No Positions   │◀───│  Has Positions  │    ┌─────────────────┐
│  Set Balance    │    │  to Close       │───▶│  Get Current    │
│  to Zero        │    │                 │    │  Price from     │
└─────────────────┘    └─────────────────┘    │  Price Cache    │
                       └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Close Position │◀───│  Use Entry      │◀───│  Current Price  │
│  with P&L       │    │  Price as       │    │  Available      │
│  Calculation    │    │  Fallback       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Implementation Details**:
- **Check Frequency**: 5 seconds (5000ms) interval
- **Threshold**: 10 units (configurable margin call level)
- **Dependencies**: Trading Account Repository, Position Repository, Price Cache Service
- **Process Flow**: Check all active accounts → Validate free margin → Trigger emergency closure if needed
- **Emergency Closure**: Close all open positions at current market price, update account balance
- **Fallback Logic**: Use entry price if current market price unavailable

---

### 7. Email Service (`emailService.js`)

**Purpose**: Trading credentials delivery

#### **Email Service Flow Architecture**:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Credentials    │    │  Email Service  │    │  Gmail SMTP     │
│  Request        │───▶│  Processing     │───▶│  Delivery       │
│  (Trading ID/   │    │                 │    │                 │
│   Password)     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  HTML Template  │    │  Logo           │    │  Delivery       │
│  Generation     │◀───│  Attachment     │◀───│  Confirmation   │
│  (Styled)       │    │  (CID Embed)    │    │  (Message ID)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Email Composition Flow**:

```
Credentials Input → Template Generation → Attachment Processing → SMTP Delivery

┌─────────────────┐
│  Trading        │
│  Credentials    │
│  (ID/Password)  │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Generate       │───▶│  Apply CSS      │───▶│  Insert Logo    │
│  HTML Template  │    │  Styling        │    │  (CID Reference)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Security       │◀───│  Responsive     │◀───│  Professional   │
│  Notice         │    │  Design         │    │  Branding       │
│  (Warnings)     │    │  (Mobile)       │    │  (Colors/Logo)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **SMTP Configuration Flow**:

```
┌─────────────────┐
│  Gmail          │
│  Configuration  │
│  (App Password) │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Create         │───▶│  Configure      │───▶│  Test           │
│  Transporter    │    │  Authentication │    │  Connection     │
│  Instance       │    │  (User/Pass)    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Service        │◀───│  Security       │◀───│  Ready for      │
│  'gmail'        │    │  Validation     │    │  Email Sending  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Implementation Details**:
- **Provider**: Gmail SMTP with app passwords (not regular passwords)
- **Template Engine**: Custom HTML templates with inline CSS
- **Attachments**: Logo files with Content-ID (CID) references for embedding
- **Security Features**: Professional styling, security notices, responsive design
- **Delivery Confirmation**: Returns message ID for tracking

## 🗄️ Repository Layer - Implementation Flow Analysis

### Base Repository (`BaseRepository.js`)

**Purpose**: Foundation for all data access operations with retry logic

#### **Retry Mechanism Flow**:

```
Database Operation → Network Check → Execute → Success/Failure → Retry Logic

┌─────────────────┐
│  Database       │
│  Operation      │
│  Request        │
                       └─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Check Network  │───▶│  Execute        │───▶│  Success        │
│  Connectivity   │    │  Operation      │    │  Return Data    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Network OK     │    │  Operation      │    │  Return to      │
│  Continue       │    │  Failed         │    │  Caller         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Check Error    │───▶│  Validation/    │───▶│  Exponential    │
│  Type           │    │  Auth Error     │    │  Backoff        │
│                 │    │  (No Retry)     │    │  (2s,4s,8s,16s) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Throw Error    │◀───│  Throw Error    │◀───│  Wait & Retry   │
│  (Immediate)    │    │  (Immediate)    │    │  (Up to 5x)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **CRUD Operations Flow**:

```
┌─────────────────┐
│  CRUD           │
│  Operations     │
│  (Create/Read/  │
│   Update/Delete)│
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Apply Retry    │───▶│  Build Supabase │───▶│  Execute Query  │
│  Wrapper        │    │  Query          │    │  with Filters   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Handle         │◀───│  Apply          │◀───│  Apply          │
│  Response       │    │  Pagination     │    │  Ordering       │
│  & Errors       │    │  (Limit/Offset) │    │  (Sort)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Implementation Details**:
- **Retry Logic**: Exponential backoff (2s, 4s, 8s, 16s)
- **Max Retries**: 5 attempts with connectivity validation
- **Error Categorization**: Validation/auth errors bypass retry logic
- **Network Validation**: Connectivity checks before each operation
- **CRUD Operations**: Standardized create, read, update, delete with filters and pagination

---

### Trading Account Repository (`TradingAccountRepository.js`)

**Purpose**: Specialized repository for trading account operations

#### **Account Creation Flow**:

```
User Request → Generate Credentials → Create Account → Initialize Defaults → Return Account

┌─────────────────┐
│  User Request   │
│  (Create        │
│   Account)      │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Generate       │───▶│  Generate       │───▶│  Create Account │
│  Trading ID     │    │  Password       │    │  Data Object    │
│  (8 digits)     │    │  (4 chars)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Random         │◀───│  Alphanumeric   │◀───│  Default Values │
│  Numeric        │    │  String         │    │  (Balance,      │
│  Generation     │    │  Generation │    │   Leverage)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │
        ▼
┌─────────────────┐
│  Save to        │
│  Database &     │
│  Return Model   │
                       └─────────────────┘
```

#### **Balance Management Flow**:

```
Balance Update Request → Get Current Account → Calculate New Balance → Update & Return

┌─────────────────┐
│  Balance        │
│  Update         │
│  Request        │
│  (UID + Amount) │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Find Account   │───▶│  Validate       │───▶│  Calculate      │
│  by UID         │    │  Account        │    │  New Balance    │
│                 │    │  Exists         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Account Not    │◀───│  Account        │◀───│  Prevent        │
│  Found Error    │    │  Found          │    │  Negative       │
└─────────────────┘    └─────────────────┘    │  Balance        │
                                              └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐
│  Update         │
│  Database &     │
│  Return Updated │
│  Account        │
└─────────────────┘
```

#### **Watchlist Management Flow**:

```
Watchlist Request → Get Account → Validate Symbol → Update Watchlist → Return Account

┌─────────────────┐
│  Watchlist      │
│  Request        │
│  (Add/Remove)   │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Get Account    │───▶│  Check Symbol   │───▶│  Update         │
│  by UID         │    │  Exists         │    │  Watchlist      │
│                 │    │  in List        │    │  Array          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Account Not    │◀───│  Already        │◀───│  Save to        │
│  Found Error    │    │  Exists         │    │  Database       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Implementation Details**:
- **Account Creation**: 8-digit numeric ID, 4-character alphanumeric password
- **Balance Management**: UID-based updates with negative balance prevention
- **Watchlist Operations**: Array-based symbol management with duplicate checking
- **Default Values**: 100x leverage, $10,000 demo balance, USD currency
- **Data Validation**: Account existence checks, balance validation, symbol validation

---

### Order Repository (`OrderRepository.js`)

**Purpose**: Order management with instrument enrichment

#### **Order Placement Flow**:

```
Order Request → Validate Order → Generate ID → Save to Database → Return Order Model

┌─────────────────┐
│  Order          │
│  Request        │
│  (Order Data)   │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Create Order   │───▶│  Validate       │───▶│  Generate       │
│  Model          │    │  Order Data     │    │  Unique ID      │
│                 │    │                 │    │  (if needed)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Validation     │◀───│  Validation     │◀───│  Convert to     │
│  Failed Error   │    │  Success        │    │  Database       │
└─────────────────┘    └─────────────────┘    │  Format         │
                                              └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐
│  Save to        │
│  Database &     │
│  Return Model   │
└─────────────────┘
```

#### **Order Filling Flow**:

```
Fill Request → Update Order Status → Set Fill Price → Set Fill Time → Return Updated Order

┌─────────────────┐
│  Fill Order     │
│  Request        │
│  (ID + Price)   │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Update Order   │───▶│  Set Fill       │───▶│  Set Fill       │
│  Status to      │    │  Price          │    │  Timestamp      │
│  'FILLED'       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐
│  Return Updated │
│  Order Model    │
└─────────────────┘
```

#### **Instrument Enrichment Flow**:

```
Orders Query → Extract Instrument IDs → Batch Fetch Instruments → Enrich Orders → Return Enriched Data

┌─────────────────┐
│  Orders         │
│  Query Result   │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Extract        │───▶│  Get Unique     │───▶│  Batch Fetch    │
│  Instrument     │    │  Instrument     │    │  Instruments    │
│  IDs            │    │  IDs            │    │  from Database  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Create         │◀───│  Build          │◀───│  For Each       │
│  Instrument     │    │  Instrument     │    │  Order          │
│  Map            │    │  Cache          │    │  Add Instrument │
└─────────────────┘    └─────────────────┘    │  Details        │
                                              └─────────────────┘
```

#### **Implementation Details**:
- **Order Validation**: Model-based validation with error collection
- **ID Generation**: Timestamp-based unique ID generation
- **Order Filling**: Status updates with price and timestamp
- **Instrument Enrichment**: Batch processing for performance optimization
- **Model Preservation**: Maintains Order model instances throughout enrichment

---

### Position Repository (`PositionRepository.js`)

**Purpose**: Position management with complex P&L calculations

#### **Position Creation Flow**:

```
Position Request → Generate ID → Calculate Margin → Create Position → Return Position Model

┌─────────────────┐
│  Position       │
│  Request        │
│  (Order Data)   │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Generate       │───▶│  Calculate      │───▶│  Create         │
│  10-digit ID    │    │  Required       │    │  Position       │
│                 │    │  Margin         │    │  Data Object    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Random         │◀───│  Get Account    │◀───│  Set Default    │
│  Generation     │    │  Leverage       │    │  Values         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Get Instrument │───▶│  Determine      │───▶│  Apply Formula  │
│  Contract Size  │    │  Contract Size  │    │  Margin =       │
│                 │    │  by Category    │    │  (Lot×Size×Price)│
└─────────────────┘    └─────────────────┘    │  / Leverage     │
                                              └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐
│  Save to        │
│  Database &     │
│  Return Model   │
└─────────────────┘
```

#### **Position Closure Flow**:

```
Close Request → Get Position → Calculate P&L → Update Status → Create Trade Record → Update Account Balance

┌─────────────────┐
│  Close Position │
│  Request        │
│  (ID + Price)   │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Get Position   │───▶│  Calculate      │───▶│  Update         │
│  by ID          │    │  P&L            │    │  Position       │
│                 │    │                 │    │  Status         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Position Not   │◀───│  Get Contract   │◀───│  Set Status     │
│  Found Error    │    │  Size           │    │  to 'CLOSED'    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Apply P&L      │◀───│  Position Type  │───▶│  Set Exit       │
│  Formula        │    │  Logic          │    │  Price & Time   │
│  (Buy/Sell)     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Create         │◀───│  Create         │◀───│  Update         │
│  Closing Order  │    │  Trade Record   │    │  Account        │
│  & Trade        │    │  for Audit      │    │  Balance        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **P&L Calculation Flow**:

```
Position + Current Price → Get Contract Size → Apply Formula → Return P&L

┌─────────────────┐
│  Position       │
│  + Current      │
│  Price          │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Get Instrument │───▶│  Determine      │───▶│  Apply P&L      │
│  Details        │    │  Contract Size  │    │  Formula        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Default        │◀───│  Category-based │◀───│  Buy Position:  │
│  100000         │    │  Size           │    │  (Current-Entry)│
│  (Forex)        │    │  (Forex/Metal/  │    │  × Lot × Size   │
└─────────────────┘    │  Crypto)        │    │                 │
                       └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐
│  Sell Position: │
│  (Entry-Current)│
│  × Lot × Size   │
└─────────────────┘
```

#### **Implementation Details**:
- **Position Creation**: 10-digit unique ID generation with margin calculation
- **Margin Formula**: `(Lot Size × Contract Size × Price) / Leverage`
- **Contract Sizes**: 100,000 for Forex, 100 for Metal, 1 for Crypto
- **P&L Calculation**: Position type-based formula with contract size consideration
- **Position Closure**: Status update, P&L calculation, trade record creation, account balance update

---

## 🎮 Controller Layer - Implementation Flow Analysis

### Order Controller (`OrderController.js`)

**Purpose**: HTTP request handling for order operations

#### **Market Order Execution Flow**:

```
HTTP Request → Fetch Current Price → Create Order → Fill Order → Create Position → Link & Return

┌─────────────────┐
│  HTTP Request   │
│  (Market Order) │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Fetch Current  │───▶│  Create         │───▶│  Fill Order     │
│  Price          │    │  Market Order   │    │  Immediately    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Price Service  │◀───│  Set Order      │◀───│  Update Status  │
│  API Call       │    │  Type & Price   │    │  to 'FILLED'    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Create         │◀───│  Create         │◀───│  Link Order     │
│  Position       │    │  Trade Record   │    │  to Position    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │
        ▼
┌─────────────────┐
│  Return         │
│  Order, Trade,  │
│  Position       │
└─────────────────┘
```

#### **Pending Order Management Flow**:

```
HTTP Request → Check Order Type → Market Order vs Pending Order → Different Processing Paths

┌─────────────────┐
│  HTTP Request   │
│  (Order Type    │
│   Specified)    │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Check Order    │───▶│  Market Order   │───▶│  Immediate      │
│  Type           │    │  (MARKET_BUY/   │    │  Execution      │
│                 │    │   SELL)         │    │  Path           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Pending Order  │◀───│  Limit/Stop     │◀───│  Create Order   │
│  (LIMIT/STOP)   │    │  Order          │    │  & Position     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Create Order   │◀───│  Set Status     │◀───│  Fill Order     │
│  with Status    │    │  to 'PLACED'    │    │  & Create       │
│  'PLACED'       │    │                 │    │  Position       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │
        ▼
┌─────────────────┐
│  Return Order   │
│  (Pending)      │
└─────────────────┘
```

#### **Implementation Details**:
- **Market Orders**: Immediate execution with current price fetching
- **Pending Orders**: Created with 'PLACED' status for later execution
- **Order Processing**: Type-based routing with different execution paths
- **Position Creation**: Automatic position creation for market orders
- **Trade Records**: Audit trail creation for all executed orders

---

### Position Controller (`PositionController.js`)

**Purpose**: Position management and closure operations

#### **Position Closure Flow**:

```
HTTP Request → Validate Position → Get Exit Price → Determine Close Type → Execute Closure → Return Result

┌─────────────────┐
│  HTTP Request   │
│  (Close Position│
│   + Lot Size)   │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Find Position  │───▶│  Validate       │───▶│  Get Current    │
│  by ID          │    │  Position       │    │  Price from     │
│                 │    │  Status         │    │  Price Cache    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Position Not   │◀───│  Position       │◀───│  Use Entry      │
│  Found Error    │    │  Already        │    │  Price as       │
└─────────────────┘    │  Closed Error   │    │  Fallback       │
                       └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Position Open  │    │  Determine      │
                       │  Continue       │    │  Close Type     │
                       └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Return         │◀───│  Execute        │◀───│  Full Close     │
│  Closure        │    │  Closure        │    │  vs Partial     │
│  Result         │    │  Process        │    │  Close          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Implementation Details**:
- **Position Validation**: Status and existence checks before closure
- **Price Handling**: Current market price with entry price fallback
- **Close Types**: Full closure vs partial closure based on lot size
- **P&L Calculation**: Automatic calculation during closure process
- **Account Updates**: Balance updates with realized P&L

---

## 🔌 WebSocket Layer - Detailed Implementation

### WebSocket Manager (`WebSocketManager.js`)

**Purpose**: Centralized WebSocket connection management

#### **Connection Management Flow**:

```
Initialize Manager → Create WebSocket → Handle Events → Auto-Reconnect → Message Processing

┌─────────────────┐
│  Initialize     │
│  WebSocket      │
│  Manager        │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Create         │───▶│  Set Event      │───▶│  Connection     │
│  WebSocket      │    │  Handlers       │    │  Established    │
│  Connection     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Authentication │◀───│  Start Ping     │◀───│  Set Ready      │
│  (Token Header) │    │  Mechanism      │    │  Status         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Handle         │───▶│  Process        │───▶│  Auto-Reconnect │
│  Messages       │    │  Incoming       │    │  on Disconnect  │
└─────────────────┘    │  Data           │    │  (5s delay)     │
                       └─────────────────┘    └─────────────────┘
```

#### **Message Processing Flow**:

```
Raw Message → Parse JSON → Filter Ping/Pong → Notify Handlers → Update Cache

┌─────────────────┐
│  Raw WebSocket  │
│  Message        │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Parse JSON     │───▶│  Check Message  │───▶│  Skip Ping/     │
│  Data           │    │  Type           │    │  Pong Messages  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Parse Error    │◀───│  Valid Message  │◀───│  Process Price  │
│  Log & Skip     │    │  Continue       │    │  Data           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Update Price   │◀───│  Notify All     │◀───│  Extract Price  │
│  Cache          │    │  Handlers       │    │  Information    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Subscription Management Flow**:

```
Subscribe Request → Check Connection → Build Message → Send Subscription → Log Success

┌─────────────────┐
│  Subscribe      │
│  Request        │
│  (Symbol)       │
└─────────────────┘
        │
        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Check          │───▶│  Build          │───▶│  Send JSON      │
│  Connection     │    │  Message        │    │  Message        │
│  Status         │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Not Connected  │◀───│  Format:        │◀───│  Log            │
│  Skip           │    │  {ac:subscribe, │    │  Subscription   │
└─────────────────┘    │   params:       │    │  Success        │
                       │   symbol$region,│    └─────────────────┘
                       │   types:quote}  │
                       └─────────────────┘
```

#### **Implementation Details**:
- **Connection Management**: Promise-based connection with auto-reconnect
- **Event Handling**: Open, message, close, error event processing
- **Message Processing**: JSON parsing with ping/pong filtering
- **Subscription System**: Symbol-based subscription with region support
- **Error Handling**: Graceful error handling with logging

---

### Flutter Client WebSocket (`flutterClient.js`)

**Purpose**: Client-facing WebSocket server for real-time data

#### **Client Connection Management**:
```javascript
export function startFlutterWebSocket(server) {
  flutterWss = new WebSocketServer({ server });

  flutterWss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.subscribedSymbols = new Set();

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await handleFlutterMessage(ws, data);
      } catch (error) {
        sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      handleClientDisconnect(ws);
    });

    ws.on('pong', () => {
      ws.isAlive = true;
    });
  });
}
```

#### **Subscription Management**:
```javascript
async function handleSubscribe(ws, symbol, assetType) {
  // Add client to symbol subscription
  const { isFirstClient } = addClientToSymbol(assetType, symbol, ws);
  ws.subscribedSymbols.add(`${assetType}:${symbol}`);

  // Subscribe to upstream if first client
  if (isFirstClient) {
    const subscribeFn = getSubscribeFunction(assetType);
    if (subscribeFn) {
      await subscribeFn(symbol);
    }
  }

  sendMessage(ws, {
    type: 'subscription',
    status: 'success',
    symbol: symbol,
    assetType: assetType,
    message: `Successfully subscribed to ${symbol}`
  });
}
```

---

### iTick Forex Integration (`iTickForex.js`)

**Purpose**: Real-time forex data integration

#### **Data Processing Pipeline**:
```javascript
export async function connectToForex() {
  forexManager = new WebSocketManager('forex', WebSocketConfig.forex);

  // Set up message handler
  forexManager.onMessage(async (message, assetType) => {
    try {
      // Extract symbol and price from message
      const symbol = message.data?.s;           // Symbol (e.g., 'EURUSD')
      const lastPrice = message.data?.ld;       // Last price (e.g., 1.0850)

      if (symbol && lastPrice !== undefined) {
        // Update price cache for trading services
        priceCacheService.updatePrice(assetType, symbol, lastPrice, message.data);

        // Broadcast to subscribed clients
        const clients = getClientsForSymbol(assetType, symbol);
        if (clients && clients.size > 0) {
          for (const client of clients) {
            if (client.readyState === 1) {
              client.send(JSON.stringify(message));
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing ${assetType} message:`, error);
    }
  });

  await forexManager.connect();
  
  // Subscribe to all forex symbols
  await forexSubscriptionService.subscribeToAllSymbols(forexManager);
}
```

---

## 📊 Forex Subscription Service (`forexSubscriptionService.js`)

**Purpose**: Manages subscription to all 80 forex symbols

#### **Bulk Subscription System**:
```javascript
async subscribeToAllSymbols(forexManager) {
  if (this.isSubscribed) return true;

  this.forexManager = forexManager;
  await this.sendSubscriptionMessage();
  this.isSubscribed = true;

  // Start periodic subscription every 1 minute
  this.startPeriodicSubscription();
  return true;
}

sendSubscriptionMessage() {
  // Create single message with all 80 symbols
  const params = this.allSymbols.map(symbol => `${symbol}$gb`).join(',');
  const message = {
    ac: 'subscribe',
    params: params,
    types: 'quote'
  };

  this.forexManager.socket.send(JSON.stringify(message));
  this.logger.debug(`Sent subscription for ${this.allSymbols.length} symbols`);
}

startPeriodicSubscription() {
  this.periodicTimer = setInterval(() => {
    if (this.isSubscribed && this.forexManager) {
      this.sendSubscriptionMessage();
    }
  }, 60000); // 1 minute
}
```

---

## 🌐 API Endpoints

### Trading Accounts
```
GET    /trading-accounts/:uid          # Get account by UID
POST   /trading-accounts               # Create new account
PUT    /trading-accounts/:uid          # Update account
DELETE /trading-accounts/:uid          # Delete account
PUT    /trading-accounts/:uid/balance  # Update balance
PUT    /trading-accounts/:uid/status   # Update status
GET    /trading-accounts/:uid/watchlist # Get watchlist
POST   /trading-accounts/:uid/watchlist # Add to watchlist
```

### Orders
```
POST   /orders                         # Place new order
PUT    /orders/:id/:accountId          # Modify order
DELETE /orders/:id/:accountId          # Cancel order
GET    /orders/:id/:accountId          # Get order by ID
GET    /orders/:accountId              # Get all orders for account
GET    /orders/:accountId/pending      # Get pending orders
GET    /orders/:accountId/filled       # Get filled orders
POST   /orders/market                  # Execute market order
```

### Positions
```
GET    /positions/:id                  # Get position by ID
GET    /positions/account/:accountId   # Get all positions
GET    /positions/account/:accountId/open    # Get open positions
GET    /positions/account/:accountId/closed  # Get closed positions
PUT    /positions/:id                  # Modify SL/TP
DELETE /positions/:id                  # Close position
```

### Instruments
```
GET    /instruments                    # Get all instruments
GET    /instruments/:id                # Get instrument by ID
GET    /instruments/category/:category # Get by category
GET    /instruments/symbol/:symbol     # Get by symbol
GET    /instruments/categories         # Get all categories
```

### Market Data
```
GET    /http/quote/:instrumentId       # Get current price
GET    /http/candlestick/:instrumentId # Get candlestick data
```

## 🔌 WebSocket API

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3000');
```

### Message Format
```javascript
// Subscribe to symbols
{
  "action": "subscribe",
  "symbol": "EURUSD,GBPUSD",
  "assetType": "forex"
}

// Unsubscribe from symbols
{
  "action": "unsubscribe",
  "symbol": "EURUSD",
  "assetType": "forex"
}

// Ping for connection health
{
  "action": "ping"
}
```

### Data Response
```javascript
{
  "data": {
    "s": "EURUSD",           // Symbol
    "ld": 1.0850,           // Last price
    "b": 1.0849,            // Bid
    "a": 1.0851,            // Ask
    "t": 1640995200000      // Timestamp
  }
}
```

## 🗄️ Database Schema

### Trading Accounts
```sql
trading_accounts (
  id SERIAL PRIMARY KEY,
  account_uid VARCHAR UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  account_number VARCHAR NOT NULL,
  account_type VARCHAR NOT NULL,
  balance DECIMAL DEFAULT 0,
  equity DECIMAL DEFAULT 0,
  margin DECIMAL DEFAULT 0,
  free_margin DECIMAL DEFAULT 0,
  status VARCHAR DEFAULT 'active',
  currency VARCHAR DEFAULT 'USD',
  levarage INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Orders
```sql
orders (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,
  instrument_id INTEGER NOT NULL,
  position_id INTEGER,
  order_type VARCHAR NOT NULL,
  lot_size DECIMAL NOT NULL,
  status VARCHAR DEFAULT 'pending',
  limit_value DECIMAL,
  price DECIMAL DEFAULT 0,
  sl_price DECIMAL,
  tp_price DECIMAL,
  filled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Positions
```sql
positions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,
  instrument_id INTEGER NOT NULL,
  position_type VARCHAR NOT NULL,
  lot_size DECIMAL NOT NULL,
  entry_price DECIMAL NOT NULL,
  sl_price DECIMAL,
  tp_price DECIMAL,
  exit_price DECIMAL,
  pnl DECIMAL DEFAULT 0,
  status VARCHAR DEFAULT 'open',
  margin_used DECIMAL DEFAULT 0,
  opened_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Instruments
```sql
instruments (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  symbol VARCHAR UNIQUE NOT NULL,
  instrument_category VARCHAR NOT NULL,
  instrument_status VARCHAR DEFAULT 'active',
  description TEXT,
  contract_size DECIMAL,
  pip_size DECIMAL,
  min_lot_size DECIMAL,
  max_lot_size DECIMAL,
  pip_value DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## ⚙️ Configuration

### Environment Variables
```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# iTick API
ITICK_FOREX_WS_URL=wss://forex.ws.url
ITICK_CRYPTO_WS_URL=wss://crypto.ws.url
ITICK_INDICES_WS_URL=wss://indices.ws.url
ITICK_WS_AUTH_TOKEN=your_auth_token

# Email Service
EMAIL_USER=your_gmail@gmail.com
EMAIL_APP_PASSWORD=your_app_password

# Server
PORT=3000
LOGO_PATH=./assets/raz_caps_logo.png
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Supabase account
- iTick API access
- Gmail account (for email service)

### Installation
```bash
# Clone repository
git clone <repository-url>
cd rc_server_temp1

# Install dependencies
npm install

# Copy environment template
cp env-template.txt .env

# Configure environment variables
# Edit .env file with your credentials

# Start development server
npm run dev

# Or start production server
npm start
```

### Testing
```bash
# Test email service
npm run test-email

# Test forex subscription
npm run test-forex-subscription

# Test price cache
npm run test-price-cache

# Test Flutter architecture
npm run test-flutter-architecture
```

## 🔄 Data Flow Diagrams

### Market Data Subscription Flow
```
Client Request → Flutter WebSocket → Subscription Manager → iTick WebSocket
      ↓                ↓                     ↓                    ↓
   Subscribe      Add to Symbol        Check if First      Subscribe to API
      ↓                ↓                     ↓                    ↓
  Success         Client Added         Subscribe Upstream   Market Data Stream
      ↓                ↓                     ↓                    ↓
  Confirmation    Symbol Tracking      Data Broadcasting    Price Updates
```

### Order Execution Flow
```
Order Request → Controller → Validation → Repository → Database
     ↓              ↓           ↓           ↓           ↓
   Parse JSON   Business Logic  Input Check  Data Access  Persist Order
     ↓              ↓           ↓           ↓           ↓
  Response ←    Service Layer ← Model Layer ← Database ← Success
```

### Position Monitoring Flow
```
Market Data → Price Cache → Position Service → SL/TP Check → Auto Close
     ↓             ↓              ↓              ↓             ↓
  iTick API    Cache Update   Get Positions   Price Compare  Update DB
     ↓             ↓              ↓              ↓             ↓
  Real-time    Memory Store   Active Positions  Trigger Hit  Position Closed
```

## 📈 Performance Optimizations

### Caching Strategy
- **Instrument Cache**: 5-minute refresh cycle
- **Price Cache**: In-memory with stale cleanup
- **Connection Pooling**: Database connection reuse

### Memory Management
- **Automatic Cleanup**: Stale price data removal
- **Connection Monitoring**: WebSocket health checks
- **Log Rotation**: Minimal console output

### Scalability Features
- **Horizontal Scaling**: Stateless services
- **Load Balancing**: WebSocket connection distribution
- **Database Optimization**: Indexed queries

## 🛡️ Security Features

### Data Protection
- **Input Validation**: All endpoints validated
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization

### Authentication
- **Account-based Access**: UID-based authorization
- **Session Management**: WebSocket connection tracking
- **Rate Limiting**: Request throttling

## 📊 Monitoring & Logging

### Health Checks
```bash
GET /health
# Returns server status and uptime
```

### Service Status
- **Account Metrics**: Real-time equity calculation
- **Position Monitoring**: SL/TP execution tracking
- **Order Processing**: Pending order execution
- **Market Data**: Price feed connectivity

### Logging Levels
- **INFO**: Service start/stop, connections
- **DEBUG**: Detailed operation logs
- **ERROR**: Exception handling
- **WARN**: Performance warnings

## 🔧 Development Guidelines

### Code Structure
- **Controllers**: HTTP request handling
- **Services**: Business logic implementation
- **Repositories**: Data access abstraction
- **Models**: Data structure definition

### Error Handling
- **Consistent Responses**: Standardized error format
- **Graceful Degradation**: Service failure handling
- **Logging**: Comprehensive error tracking

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: Service interaction testing
- **Load Tests**: Performance validation

## 🚨 Troubleshooting

### Common Issues

#### WebSocket Connection Failures
```bash
# Check iTick API credentials
# Verify network connectivity
# Review WebSocket URL configuration
```

#### Database Connection Issues
```bash
# Verify Supabase credentials
# Check database permissions
# Review connection pool settings
```

#### Email Service Problems
```bash
# Verify Gmail app password
# Check SMTP settings
# Review email template syntax
```

### Performance Issues
- **High Memory Usage**: Check cache cleanup intervals
- **Slow Response Times**: Review database queries
- **Connection Drops**: Monitor WebSocket health

## 📚 API Documentation

### Request/Response Examples

#### Place Market Order
```javascript
POST /orders/market
{
  "accountId": "ACC123",
  "instrumentId": 1,
  "side": "buy",
  "lotSize": 0.1,
  "sl": 1.0800,
  "tp": 1.0900
}

Response:
{
  "order": { /* order object */ },
  "trade": { /* trade object */ },
  "position": { /* position object */ },
  "executedPrice": 1.0850
}
```

#### Get Account Positions
```javascript
GET /positions/account/ACC123/open

Response:
{
  "data": [
    {
      "id": 1,
      "instrumentId": 1,
      "positionType": "buy",
  "lotSize": 0.1,
      "entryPrice": 1.0850,
      "slPrice": 1.0800,
      "tpPrice": 1.0900,
      "pnl": 15.50,
      "status": "open"
    }
  ]
}
```

## 🔮 Future Enhancements

### Planned Features
- **Advanced Order Types**: OCO, Bracket orders
- **Risk Management**: Advanced margin calculations
- **Analytics**: Trading performance metrics
- **Mobile Push Notifications**: Real-time alerts
- **Multi-Exchange Support**: Additional data providers

### Scalability Improvements
- **Microservices Architecture**: Service decomposition
- **Event Sourcing**: Audit trail implementation
- **CQRS Pattern**: Read/write separation
- **Redis Integration**: Distributed caching

## 📞 Support & Contributing

### Getting Help
- **Documentation**: Comprehensive API docs
- **Examples**: Code samples and tutorials
- **Community**: Developer forums and chat

### Contributing
- **Code Style**: ESLint configuration
- **Testing**: Jest test framework
- **Documentation**: JSDoc standards
- **Pull Requests**: Review process

## 🎯 Summary

This comprehensive README provides detailed flow diagrams and implementation analysis for the RC Trading Server backend. The documentation covers:

### ✅ **Complete Coverage**
- **7 Core Services**: Account Metrics, Position Check, Pending Orders, Price Cache, Instrument Cache, Free Margin Monitor, Email Service
- **Repository Layer**: Base Repository with retry logic, Trading Account, Order, and Position repositories
- **Controller Layer**: HTTP request handling for orders and positions
- **WebSocket Layer**: Real-time data streaming and client management
- **Data Models**: Trading Account, Order, Position, Instrument, and Trade models

### 🔄 **Flow Diagrams**
- **Service Flows**: Detailed process flows for each service with timing and dependencies
- **Data Flows**: How data moves through the system from input to output
- **Architecture Flows**: System-level interactions and component relationships
- **Process Flows**: Step-by-step breakdown of complex operations

### 🏗️ **Implementation Details**
- **No Code Snippets**: Clean documentation focused on flow and architecture
- **Visual Diagrams**: ASCII-based flow diagrams for easy understanding
- **Process Logic**: Detailed explanation of how each component works
- **Integration Points**: How services interact with each other

### 📊 **Key Features Documented**
- **Real-time Processing**: 1-second account metrics, 0.1-second order execution
- **Automated Trading**: SL/TP monitoring, pending order execution, margin calls
- **Data Management**: Caching strategies, retry logic, error handling
- **WebSocket Architecture**: Client connections, subscriptions, message routing

This documentation enables any developer to understand the complete system architecture, implementation flows, and component interactions without needing to dive into the actual code.

---

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **iTick API** for market data feeds
- **Supabase** for database infrastructure
- **Node.js Community** for excellent tooling
- **Trading Community** for feedback and suggestions

---

*Last Updated: January 2025*
*Version: 1.0.0*