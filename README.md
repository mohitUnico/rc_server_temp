# 🚀 Real-Time Trading Data Server

A powerful Node.js server that provides real-time financial data streaming, symbol tracking, and WebSocket communication for trading applications. This server connects to iTick API for live market data and serves Flutter clients with real-time updates.

## 📋 Table of Contents

- [🏗️ Architecture Overview](#️-architecture-overview)
- [🔧 System Requirements](#-system-requirements)
- [🚀 Quick Start](#-quick-start)
- [📡 How It Works](#-how-it-works)
- [🏛️ Detailed Module Architecture](#️-detailed-module-architecture)
- [🌐 API Endpoints](#-api-endpoints)
- [🔌 WebSocket Communication](#-websocket-communication)
- [📊 Database Structure](#-database-structure)
- [⚙️ Configuration](#️-configuration)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [🔍 Troubleshooting](#-troubleshooting)
- [📚 Examples](#-examples)

---

## 🏗️ Architecture Overview

### **System Components**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Flutter       │    │   Node.js       │    │   iTick API     │
│   Clients       │◄──►│   Server        │◄──►│   (Forex/Crypto)│
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   Supabase      │    │   Real-time     │
│   Connection    │    │   Database      │    │   Data Stream   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Data Flow**

1. **iTick API** → Provides real-time market data (forex, crypto, indices)
2. **Node.js Server** → Processes data and manages connections
3. **Supabase Database** → Stores symbol tracking and price history
4. **Flutter Clients** → Receive real-time updates via WebSocket
5. **HTTP API** → Provides REST endpoints for data management

---

## 🔧 System Requirements

### **Prerequisites**
- **Node.js** 18+ 
- **npm** or **yarn**
- **Supabase account** (free tier works)
- **iTick API credentials**

### **Dependencies**
```json
{
  "express": "^4.18.2",
  "ws": "^8.14.2",
  "@supabase/supabase-js": "^2.38.4",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1"
}
```

---

## 🚀 Quick Start

### **1. Clone and Install**
```bash
git clone <your-repo>
cd rc_server_temp1
npm install
```

### **2. Environment Setup**
Create `.env` file:
```bash
# iTick API Configuration
ITICK_WS_AUTH_TOKEN=your_itick_token_here
ITICK_WS_URL=wss://ws.itick.com

# Supabase Configuration  
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Service Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password

# Server Configuration
PORT=3000
NODE_ENV=development
```

**📧 Email Service Setup:**
1. **Enable 2FA** on your Gmail account
2. **Generate App Password**: Go to Google Account → Security → 2-Step Verification → App passwords
3. **Create App Password** for "Mail" application
4. **Use App Password** in `EMAIL_APP_PASSWORD` (not your regular password)

### **3. Database Setup**
In Supabase SQL Editor, ensure you have:
- `symbols` table with proper structure
- `positions` table (if using trading features)
- Proper permissions set

### **4. Start Server**
```bash
npm start
# or
node server.js
```

### **5. Test Connection**
```bash
curl http://localhost:3000/health
```

---

## 📡 How It Works

### **1. Server Initialization**
```javascript
// server.js
import { startFlutterWebSocket } from './sockets/flutterClient.js';
import { connectToForex } from './sockets/iTickForex.js';

// Start WebSocket server for Flutter clients
startFlutterWebSocket(server);

// Connect to iTick API for market data
await connectToForex();
```

### **2. Real-Time Data Flow**
```
iTick API → WebSocket Connection → Price Processing → Database Update → Flutter Clients
```

### **3. Client Connection Flow**
```
Flutter Client → WebSocket Connection → Subscribe to Symbols → Receive Real-Time Data
```

---

## 🏛️ Detailed Module Architecture

### **📁 Project Structure Deep Dive**

```
rc_server_temp1/
├── 📁 config/                    # Configuration Management
│   ├── 📄 envConfig.js          # Environment Variables & Validation
│   ├── 📄 websocket.js          # WebSocket Connection Configs
│   └── 📄 supabase.js           # Database Client Configuration
├── 📁 core/                      # Core Business Logic
├── 📁 http/                      # HTTP REST API Layer
│   ├── 📄 candlestick.js        # Historical Data Endpoints
│   ├── 📄 quote.js              # Real-time Quote Endpoints
│   ├── 📄 symbols.js            # Symbol Management API
│   └── 📄 tradingCredentials.js # Email Service API
├── 📁 services/                  # Business Service Layer
│   ├── 📄 databaseService.js    # Database Operations
│   ├── 📄 symbolManagementService.js # Symbol CRUD Operations
│   ├── 📄 priceUpdateService.js # Price Update Logic
│   └── 📄 emailService.js       # Email Service for Trading Credentials
├── 📁 sockets/                   # WebSocket Implementation Layer
│   ├── 📄 flutterClient.js      # Flutter Client WebSocket Server
│   ├── 📄 iTickForex.js         # Forex Data Connection
│   ├── 📄 iTickCrypto.js        # Crypto Data Connection
│   └── 📄 iTickIndices.js       # Indices Data Connection
├── 📁 utils/                     # Utility Functions
│   ├── 📄 logger.js             # Structured Logging System
│   ├── 📄 ping.js               # WebSocket Health Monitoring
│   └── 📄 subscriptionManager.js # Client-Symbol Mapping
├── 📁 websocket/                 # WebSocket Management Layer
│   └── 📄 WebSocketManager.js   # Base WebSocket Class
├── 📁 scripts/                   # Utility Scripts
│   ├── 📄 initSymbols.js        # Initialize Default Symbols
│   └── 📄 testSetup.js          # System Testing
├── 📄 server.js                  # Main Server Entry Point
├── 📄 package.json               # Dependencies & Scripts
└── 📄 README.md                  # This Documentation
```

---

### **🔧 Core Modules Deep Dive**

#### **1. Server Entry Point (`server.js`)**

**Purpose:** Main application bootstrap and service orchestration

**How It Works:**
```javascript
// 1. Initialize Express server with middleware
const app = express();
app.use(cors());
app.use(express.json());

// 2. Start database connection
await DatabaseService.initializeDatabase();

// 3. Start WebSocket servers
startFlutterWebSocket(server);
await connectToForex();

// 4. Start HTTP server
server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
});
```

**Key Responsibilities:**
- ✅ **Express server setup** with CORS and JSON middleware
- ✅ **Database initialization** before starting services
- ✅ **WebSocket server startup** for client connections
- ✅ **iTick API connections** for market data
- ✅ **Graceful shutdown** handling (SIGTERM, SIGINT)

---

#### **2. WebSocket Management (`websocket/WebSocketManager.js`)**

**Purpose:** Base class for managing WebSocket connections to external APIs

**How It Works:**
```javascript
class WebSocketManager {
    constructor(assetType, config) {
        this.assetType = assetType;        // 'forex', 'crypto', 'indices'
        this.config = config;              // Connection configuration
        this.socket = null;                // WebSocket instance
        this.subscribedSymbols = new Set(); // Track subscribed symbols
        this.pingInterval = null;          // Health monitoring
    }
    
    async connect() {
        // 1. Create WebSocket connection
        this.socket = new WebSocket(this.config.url);
        
        // 2. Set up event handlers
        this.socket.on('open', this.onOpen.bind(this));
        this.socket.on('message', this.onMessage.bind(this));
        this.socket.on('close', this.onClose.bind(this));
        this.socket.on('error', this.onError.bind(this));
        
        // 3. Start ping/pong health monitoring
        this.startPing(this.socket, this.pingInterval);
    }
}
```

**Key Features:**
- 🔄 **Automatic reconnection** with exponential backoff
- 💓 **Ping/pong health monitoring** (20-second intervals)
- 📊 **Symbol subscription tracking** for efficient management
- 🚨 **Error handling** with detailed logging
- 🔄 **Message handler registration** for custom processing

**Connection Lifecycle:**
```
1. Initial Connection → 2. Authentication → 3. Symbol Subscription → 4. Data Streaming
         ↓                      ↓                    ↓                    ↓
   WebSocket Open         Send Auth Token      Subscribe Symbols    Process Messages
         ↓                      ↓                    ↓                    ↓
   Setup Handlers         Wait for Response    Track Subscriptions   Route to Clients
```

---

#### **3. Flutter Client WebSocket (`sockets/flutterClient.js`)**

**Purpose:** WebSocket server for Flutter clients to connect and subscribe to symbols

**How It Works:**
```javascript
function startFlutterWebSocket(server) {
    // 1. Create WebSocket server attached to HTTP server
    const wss = new WebSocketServer({ server });
    
    // 2. Handle client connections
    wss.on('connection', (ws) => {
        // 3. Initialize client state
        ws.subscribedSymbols = new Set();
        ws.isAlive = true;
        
        // 4. Set up message handlers
        ws.on('message', (data) => handleFlutterMessage(ws, data));
        ws.on('close', () => handleClientDisconnect(ws));
        ws.on('pong', () => { ws.isAlive = true; });
    });
    
    // 5. Start health monitoring
    startHeartbeat(wss);
}
```

**Client Message Processing:**
```javascript
async function handleFlutterMessage(ws, data) {
    const action = data.action || data.type;        // 'subscribe', 'unsubscribe', 'ping'
    const symbol = data.symbol;                     // 'EURUSD' or 'EURUSD,XAUUSD'
    const assetType = data.assetType || data.data;  // 'forex', 'crypto', 'indices'
    
    switch (action) {
        case 'subscribe':
            // Handle comma-separated symbols
            const symbols = symbol.split(',').map(s => s.trim());
            for (const sym of symbols) {
                await handleSubscribe(ws, sym, assetType);
            }
            break;
            
        case 'unsubscribe':
            // Handle comma-separated symbols
            const unsubSymbols = symbol.split(',').map(s => s.trim());
            for (const sym of unsubSymbols) {
                await handleUnsubscribe(ws, sym, assetType);
            }
            break;
    }
}
```

**Key Features:**
- 🔌 **WebSocket server** attached to HTTP server
- 📱 **Client state management** per connection
- 🔄 **Message parsing** with fallback field names
- 📊 **Multiple symbol support** (comma-separated)
- 💓 **Connection health monitoring** with ping/pong
- 🧹 **Automatic cleanup** on client disconnect

**Client Connection Flow:**
```
Flutter Client → WebSocket Connection → Message Handler → Subscription Manager → iTick API
      ↓                ↓                    ↓                ↓                ↓
   Connect()      on('connection')     Parse JSON      Add to Map      Subscribe
      ↓                ↓                    ↓                ↓                ↓
   Send Message    Set up Handlers     Route Action    Track Client    Start Data
      ↓                ↓                    ↓                ↓                ↓
   Receive Data    Handle Messages     Process Logic   Update State    Stream Data
```

---

#### **4. Subscription Management (`utils/subscriptionManager.js`)**

**Purpose:** Manages the mapping between symbols and connected clients

**How It Works:**
```javascript
// Three separate maps for different asset types
const forexSymbolClientMap = new Map();      // symbol → Set<WebSocket>
const cryptoSymbolClientMap = new Map();     // symbol → Set<WebSocket>
const indicesSymbolClientMap = new Map();    // symbol → Set<WebSocket>

function getMapForAssetType(assetType) {
    switch (assetType) {
        case 'forex': return forexSymbolClientMap;
        case 'crypto': return cryptoSymbolClientMap;
        case 'indices': return indicesSymbolClientMap;
        default: throw new Error(`Invalid asset type: ${assetType}`);
    }
}

function addClientToSymbol(assetType, symbol, client) {
    const map = getMapForAssetType(assetType);
    
    // 1. Get or create client set for this symbol
    if (!map.has(symbol)) {
        map.set(symbol, new Set());
    }
    
    const clientsSet = map.get(symbol);
    const isFirstClient = clientsSet.size === 0;
    
    // 2. Add client to the set
    clientsSet.add(client);
    
    // 3. Return whether this is the first client
    return { isFirstClient };
}
```

**Data Structure Visualization:**
```
forexSymbolClientMap:
┌─────────┬─────────────────────────────────────┐
│ Symbol  │ Connected Clients                   │
├─────────┼─────────────────────────────────────┤
│ EURUSD  │ Set { Client1, Client2, Client3 }  │
│ XAUUSD  │ Set { Client1, Client4 }           │
│ GBPUSD  │ Set { Client2 }                    │
└─────────┴─────────────────────────────────────┘

cryptoSymbolClientMap:
┌─────────┬─────────────────────────────────────┐
│ Symbol  │ Connected Clients                   │
├─────────┼─────────────────────────────────────┤
│ BTCUSD  │ Set { Client1, Client5 }           │
│ ETHUSD  │ Set { Client3, Client6 }           │
└─────────┴─────────────────────────────────────┘
```

**Key Features:**
- 🗺️ **Separate maps** for each asset type (forex, crypto, indices)
- 🔗 **Efficient client lookup** using Map and Set data structures
- 📊 **First/last client tracking** for upstream subscription management
- 🧹 **Automatic cleanup** when symbols have no clients
- 🔄 **Bulk operations** for client disconnection

**Subscription Lifecycle:**
```
1. Client Subscribe → 2. Add to Symbol Map → 3. Check if First Client → 4. Upstream Subscribe
         ↓                      ↓                      ↓                      ↓
   Parse Message         Get/Create Client Set     Track First Client     Subscribe to iTick
         ↓                      ↓                      ↓                      ↓
   Validate Data         Add Client to Set         Log Subscription       Start Data Stream
         ↓                      ↓                      ↓                      ↓
   Send Confirmation    Update Map State          Update Counters        Process Messages
```

---

#### **5. iTick Data Processing (`sockets/iTickForex.js`)**

**Purpose:** Handles real-time data from iTick API for forex symbols

**How It Works:**
```javascript
function connectToForex() {
    if (!forexManager) {
        // 1. Create WebSocket manager for forex
        forexManager = new WebSocketManager('forex', WebSocketConfig.forex);
        
        // 2. Set up message handler for incoming data
        forexManager.onMessage(async (message, assetType) => {
            // 3. Extract symbol and price from message
            const symbol = message.data?.s;           // Symbol (e.g., 'EURUSD')
            const lastPrice = message.data?.ld;       // Last price (e.g., 1.0850)
            
            if (lastPrice !== undefined) {
                // 4. Update price in database
                await PriceUpdateService.updatePrice(symbol, lastPrice, assetType);
            }
            
            // 5. Get clients subscribed to this symbol
            const clients = getClientsForSymbol(assetType, symbol);
            
            // 6. Send data to all subscribed clients
            for (const client of clients) {
                if (client.readyState === 1) { // WebSocket.OPEN
                    try {
                        client.send(JSON.stringify(message));
                    } catch (error) {
                        console.error('Error sending message to client:', error);
                    }
                }
            }
        });
    }
    
    return forexManager.connect();
}
```

**Message Processing Flow:**
```
iTick Message → Parse Data → Update Database → Find Subscribed Clients → Send to Clients
      ↓              ↓            ↓                ↓                    ↓
  Raw JSON      Extract      Price Update    Client Lookup      WebSocket Send
      ↓              ↓            ↓                ↓                    ↓
  WebSocket    Symbol &      Database       Subscription       Real-time Data
      ↓              ↓            ↓                ↓                    ↓
  Connection    Price Data    Upsert        Map Query          Client Delivery
```

**Key Features:**
- 🔄 **Automatic connection management** with WebSocketManager
- 📊 **Real-time price updates** to database
- 🎯 **Targeted client delivery** only to subscribed clients
- 🚨 **Error handling** for client communication
- 🔗 **Integration** with PriceUpdateService and SubscriptionManager

---

#### **6. Price Update Service (`services/priceUpdateService.js`)**

**Purpose:** Manages price updates in the database for tracked symbols

**How It Works:**
```javascript
export class PriceUpdateService {
    static async updatePrice(symbol, lastPrice, assetType) {
        try {
            // 1. Check if symbol exists in database
            const { data: existingSymbol, error: checkError } = await supabase
                .from('symbols')
                .select('symbol_name, price')
                .eq('symbol_name', symbol)
                .eq('symbol_type', assetType)
                .single();
            
            if (checkError || !existingSymbol) {
                // Symbol doesn't exist, skip update
                console.log(`⚠️ Symbol ${symbol} not found in ${assetType} table, skipping price update`);
                return false;
            }
            
            // 2. Update price in database
            const { data, error } = await supabase
                .from('symbols')
                .update({
                    price: parseFloat(lastPrice),
                    last_updated: new Date().toISOString()
                })
                .eq('symbol_name', symbol)
                .eq('symbol_type', assetType);
            
            if (error) {
                console.error(`Failed to update price for ${symbol}:`, error);
                return false;
            }
            
            return true;
        } catch (err) {
            console.error(`Error updating price for ${symbol}:`, err);
            return false;
        }
    }
}
```

**Database Update Flow:**
```
Price Data → Symbol Check → Database Update → Success/Failure Response
     ↓            ↓              ↓                    ↓
  New Price   Exists?        SQL Update         Return Status
     ↓            ↓              ↓                    ↓
  From iTick   Query DB      Update Price      Log Result
     ↓            ↓              ↓                    ↓
  WebSocket    Check Result   Set Timestamp    Handle Errors
```

**Key Features:**
- 🔍 **Symbol existence validation** before updates
- 💰 **Price parsing** and validation
- ⏰ **Timestamp updates** for tracking
- 🚨 **Error handling** with detailed logging
- 🔄 **Return status** for operation tracking

---

#### **7. Symbol Management Service (`services/symbolManagementService.js`)**

**Purpose:** Provides CRUD operations for managing tracked symbols

**How It Works:**
```javascript
export class SymbolManagementService {
    // CREATE - Add new symbol to tracking
    static async addTrackedSymbol(symbol, assetType) {
        try {
            // 1. Validate asset type
            if (!['forex', 'crypto', 'indices'].includes(assetType)) {
                throw new Error('Invalid asset type. Must be forex, crypto, or indices');
            }
            
            // 2. Check if symbol already exists
            const existing = await this.getTrackedSymbol(symbol, assetType);
            if (existing) {
                throw new Error(`Symbol ${symbol} is already being tracked for ${assetType}`);
            }
            
            // 3. Add to database
            const { data, error } = await supabase
                .from('symbols')
                .insert({
                    symbol_name: symbol.toUpperCase(),
                    symbol_type: assetType,
                    price: null,
                    added_at: new Date().toISOString(),
                    last_updated: new Date().toISOString()
                });
            
            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }
            
            return { symbol_name: symbol, symbol_type: assetType, price: null };
        } catch (err) {
            throw err;
        }
    }
    
    // READ - Get all tracked symbols
    static async getAllTrackedSymbols() {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .select('*')
                .order('symbol_type')
                .order('symbol_name');
            
            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }
            
            return data || [];
        } catch (err) {
            throw err;
        }
    }
}
```

**Service Operations Flow:**
```
HTTP Request → Service Method → Database Operation → Response Processing → HTTP Response
      ↓              ↓                ↓                    ↓                    ↓
  Parse Body     Validate Data    SQL Query/Update    Process Result     Send Response
      ↓              ↓                ↓                    ↓                    ↓
  Extract Params  Business Logic   Execute Query       Format Data        JSON Response
      ↓              ↓                ↓                    ↓                    ↓
  Route Handler   Service Layer    Database Result     Success/Error      Client Response
```

**Key Features:**
- ✅ **Input validation** for asset types and symbols
- 🔄 **Duplicate checking** before insertion
- 📊 **Ordered results** by asset type and symbol
- 🚨 **Error handling** with meaningful messages
- 🔒 **Data sanitization** (uppercase symbols)

---

#### **8. Database Service (`services/databaseService.js`)**

**Purpose:** Manages database initialization and connection testing

**How It Works:**
```javascript
export class DatabaseService {
    static async initializeDatabase() {
        try {
            console.log('🔧 Checking database connection...');
            
            // 1. Test connection by querying symbols table
            const { data, error } = await supabase
                .from('symbols')
                .select('*')
                .limit(1);
            
            if (error) {
                console.error('❌ Database connection failed:', error);
                throw error;
            }
            
            console.log('✅ Database connection successful');
            console.log('ℹ️ Using existing symbols table structure');
            
        } catch (err) {
            console.error('❌ Database initialization failed:', err);
            throw err;
        }
    }
    
    static async getTableInfo() {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .select('*')
                .limit(1);
            
            if (error) {
                return { exists: false, error: error.message };
            }
            
            return { exists: true, count: data.length };
        } catch (err) {
            return { exists: false, error: err.message };
        }
    }
}
```

**Initialization Flow:**
```
Server Start → Database Init → Connection Test → Table Validation → Service Ready
      ↓              ↓              ↓                ↓                ↓
  Load Config    Create Client    Test Query      Check Schema     Start Services
      ↓              ↓              ↓                ↓                ↓
  Parse .env     Supabase Client  Execute SQL      Validate Table   WebSocket/HTTP
      ↓              ↓              ↓                ↓                ↓
  Set Variables   Connection      Check Response    Log Structure    Accept Clients
```

**Key Features:**
- 🔌 **Connection testing** at startup
- 📊 **Table structure validation**
- 🚨 **Error handling** with detailed logging
- 🔄 **Graceful failure** handling
- 📝 **Status reporting** for monitoring

---

### **🔄 Complete Data Flow Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   iTick API     │    │   WebSocket     │    │   Message       │
│   (External)    │───►│   Manager       │───►│   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Real-time     │    │   Price Update  │    │   Subscription  │
│   Data Stream   │    │   Service       │    │   Manager       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Client        │    │   Flutter       │
│   Update        │    │   Lookup        │    │   WebSocket     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │   Target        │    │   Real-time     │
│   Storage       │    │   Client Set    │    │   Data Delivery │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Detailed Flow Steps:**

1. **iTick API** sends real-time market data via WebSocket
2. **WebSocketManager** receives and parses the message
3. **Message Processing** extracts symbol, price, and asset type
4. **Price Update Service** updates the database with new price
5. **Subscription Manager** finds all clients subscribed to this symbol
6. **Client Lookup** returns the set of connected WebSocket clients
7. **Flutter WebSocket** sends the price update to all subscribed clients
8. **Database Storage** persists the price update in Supabase

---

### **🔧 Service Dependencies & Interactions**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Server.js     │    │   Database      │    │   Supabase      │
│   (Main)        │───►│   Service       │───►│   Client        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Flutter       │    │   Symbol        │    │   Price Update  │
│   WebSocket     │◄──►│   Management    │◄──►│   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Subscription  │    │   iTick         │    │   WebSocket     │
│   Manager       │◄──►│   WebSocket     │◄──►│   Manager       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Dependency Chain:**
- **Server.js** → **DatabaseService** → **Supabase Client**
- **Server.js** → **FlutterWebSocket** → **SubscriptionManager**
- **Server.js** → **iTickWebSocket** → **WebSocketManager**
- **iTickWebSocket** → **PriceUpdateService** → **DatabaseService**
- **iTickWebSocket** → **SubscriptionManager** → **Client Delivery**

---

## 🌐 API Endpoints

### **Base URL:** `http://localhost:3000`

### **Health Check**
```http
GET /health
Response: {"status": "OK", "timestamp": "...", "uptime": 123}
```

### **Symbol Management**

#### **Add Symbol to Tracking**
```http
POST /http/tracked
Content-Type: application/json

{
  "symbol": "BTCUSD",
  "asset_type": "crypto"
}
```

#### **Get All Tracked Symbols**
```http
GET /http/tracked
Response: {"symbols": [...], "statistics": {...}}
```

#### **Get Symbols by Type**
```http
GET /http/tracked/forex
GET /http/tracked/crypto  
GET /http/tracked/indices
```

#### **Check if Symbol is Tracked**
```http
GET /http/tracked/check/EURUSD/forex
Response: {"symbol": "EURUSD", "is_tracked": true}
```

### **Price Data**

#### **Get Current Prices**
```http
GET /http/prices
GET /http/prices/forex
GET /http/prices/crypto
GET /http/prices/indices
```

#### **Get Symbol Details**
```http
GET /http/symbol/EURUSD
```

### **Historical Data**

#### **Candlestick Data**
```http
GET /http/candlestick?symbol=EURUSD&timeframe=1h&limit=100
```

#### **Quote Data**
```http
GET /http/quote?symbol=EURUSD
```

### **Email Service**

#### **Send Trading Credentials**
```http
POST /http/trading-credentials
Content-Type: application/json

{
  "emailID": "user@example.com",
  "tradingID": "TRADER123",
  "tradingPassword": "securepassword123"
}
```

**Request Details:**
- **Method:** `POST`
- **URL:** `http://localhost:3000/http/trading-credentials`
- **Headers:** `Content-Type: application/json`
- **Body:** JSON object with required fields

**Required Fields:**
- `emailID` (string): Valid email address where credentials will be sent
- `tradingID` (string): Trading account identifier (min 3 characters)
- `tradingPassword` (string): Trading account password (min 6 characters)

**Field Validation:**
- **Email:** Must be valid email format (e.g., `user@domain.com`)
- **Trading ID:** Alphanumeric + underscore + hyphen, min 3 chars
- **Password:** Minimum 6 characters, any characters allowed

**Success Response (200):**
```json
{
  "success": true,
  "message": "Trading credentials sent successfully",
  "data": {
    "emailID": "user@example.com",
    "tradingID": "TRADER123",
    "tradingPassword": "securepassword123",
    "messageId": "abc123@email.com",
    "sentAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

**400 - Missing/Invalid Fields:**
```json
{
  "success": false,
  "error": "Missing required fields",
  "message": "emailID, tradingID, and tradingPassword are required",
  "required": ["emailID", "tradingID", "tradingPassword"]
}
```

**400 - Invalid Email:**
```json
{
  "success": false,
  "error": "Invalid email format",
  "message": "Please provide a valid email address"
}
```

**400 - Invalid Trading ID:**
```json
{
  "success": false,
  "error": "Invalid trading ID",
  "message": "Trading ID must be at least 3 characters long"
}
```

**400 - Invalid Password:**
```json
{
  "success": false,
  "error": "Invalid trading password",
  "message": "Trading password must be at least 6 characters long"
}
```

**500 - Email Service Error:**
```json
{
  "success": false,
  "error": "Email sending failed",
  "message": "Failed to send trading credentials",
  "details": "SMTP connection failed"
}
```

#### **Check Email Service Status**
```http
GET /http/trading-credentials/status
Response: {"service": "gmail", "user": "Configured", "appPassword": "Configured"}
```

#### **Test Email Service**
```http
POST /http/trading-credentials/test
Response: {"success": true, "message": "Email service test successful"}
```

---

## 📱 **Client Implementation Examples**

### **Flutter/Dart Example**
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class TradingCredentialsService {
  static const String baseUrl = 'http://localhost:3000';
  
  static Future<Map<String, dynamic>> sendTradingCredentials({
    required String emailID,
    required String tradingID,
    required String tradingPassword,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/http/trading-credentials'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'emailID': emailID,
          'tradingID': tradingID,
          'tradingPassword': tradingPassword,
        }),
      );
      
      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data['data'],
          'message': data['message'],
        };
      } else {
        return {
          'success': false,
          'error': data['error'],
          'message': data['message'],
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network Error',
        'message': 'Failed to connect to server: $e',
      };
    }
  }
  
  static Future<Map<String, dynamic>> checkEmailServiceStatus() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/http/trading-credentials/status'),
      );
      
      final data = jsonDecode(response.body);
      return data;
    } catch (e) {
      return {
        'success': false,
        'error': 'Network Error',
        'message': 'Failed to check service status: $e',
      };
    }
  }
}

// Usage Example
void main() async {
  // Check service status first
  final status = await TradingCredentialsService.checkEmailServiceStatus();
  print('Email Service Status: $status');
  
  // Send trading credentials
  final result = await TradingCredentialsService.sendTradingCredentials(
    emailID: 'user@example.com',
    tradingID: 'TRADER123',
    tradingPassword: 'securepass123',
  );
  
  if (result['success']) {
    print('✅ Credentials sent: ${result['message']}');
    print('📧 Message ID: ${result['data']['messageId']}');
  } else {
    print('❌ Failed: ${result['message']}');
  }
}
```

### **JavaScript/Node.js Example**
```javascript
class TradingCredentialsClient {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }
  
  async sendTradingCredentials(emailID, tradingID, tradingPassword) {
    try {
      const response = await fetch(`${this.baseUrl}/http/trading-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailID,
          tradingID,
          tradingPassword,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data,
          message: data.message,
        };
      } else {
        return {
          success: false,
          error: data.error,
          message: data.message,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network Error',
        message: `Failed to connect to server: ${error.message}`,
      };
    }
  }
  
  async checkEmailServiceStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/http/trading-credentials/status`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network Error',
        message: `Failed to check service status: ${error.message}`,
      };
    }
  }
}

// Usage Example
const client = new TradingCredentialsClient();

async function testEmailService() {
  // Check service status
  const status = await client.checkEmailServiceStatus();
  console.log('Email Service Status:', status);
  
  // Send trading credentials
  const result = await client.sendTradingCredentials(
    'user@example.com',
    'TRADER123',
    'securepass123'
  );
  
  if (result.success) {
    console.log('✅ Credentials sent:', result.message);
    console.log('📧 Message ID:', result.data.messageId);
  } else {
    console.log('❌ Failed:', result.message);
  }
}

testEmailService();
```

### **Python Example**
```python
import requests
import json

class TradingCredentialsClient:
    def __init__(self, base_url='http://localhost:3000'):
        self.base_url = base_url
    
    def send_trading_credentials(self, email_id, trading_id, trading_password):
        try:
            response = requests.post(
                f'{self.base_url}/http/trading-credentials',
                headers={'Content-Type': 'application/json'},
                json={
                    'emailID': email_id,
                    'tradingID': trading_id,
                    'tradingPassword': trading_password
                }
            )
            
            data = response.json()
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'data': data['data'],
                    'message': data['message']
                }
            else:
                return {
                    'success': False,
                    'error': data['error'],
                    'message': data['message']
                }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': 'Network Error',
                'message': f'Failed to connect to server: {str(e)}'
            }
    
    def check_email_service_status(self):
        try:
            response = requests.get(f'{self.base_url}/http/trading-credentials/status')
            return response.json()
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': 'Network Error',
                'message': f'Failed to check service status: {str(e)}'
            }

# Usage Example
if __name__ == '__main__':
    client = TradingCredentialsClient()
    
    # Check service status
    status = client.check_email_service_status()
    print('Email Service Status:', status)
    
    # Send trading credentials
    result = client.send_trading_credentials(
        'user@example.com',
        'TRADER123',
        'securepass123'
    )
    
    if result['success']:
        print('✅ Credentials sent:', result['message'])
        print('📧 Message ID:', result['data']['messageId'])
    else:
        print('❌ Failed:', result['message'])
```

### **cURL Examples**
```bash
# 1. Check email service status
curl http://localhost:3000/http/trading-credentials/status

# 2. Test email service connection
curl -X POST http://localhost:3000/http/trading-credentials/test

# 3. Send trading credentials
curl -X POST http://localhost:3000/http/trading-credentials \
  -H "Content-Type: application/json" \
  -d '{
    "emailID": "user@example.com",
    "tradingID": "TRADER123",
    "tradingPassword": "securepass123"
  }'

# 4. Send with different credentials
curl -X POST http://localhost:3000/http/trading-credentials \
  -H "Content-Type: application/json" \
  -d '{
    "emailID": "trader@company.com",
    "tradingID": "FX_001",
    "tradingPassword": "mypassword456"
  }'
```

### **Postman Collection**
```json
{
  "info": {
    "name": "Trading Credentials API",
    "description": "API endpoints for sending trading credentials via email"
  },
  "item": [
    {
      "name": "Send Trading Credentials",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"emailID\": \"user@example.com\",\n  \"tradingID\": \"TRADER123\",\n  \"tradingPassword\": \"securepass123\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/http/trading-credentials",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["http", "trading-credentials"]
        }
      }
    },
    {
      "name": "Check Email Service Status",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:3000/http/trading-credentials/status",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["http", "trading-credentials", "status"]
        }
      }
    },
    {
      "name": "Test Email Service",
      "request": {
        "method": "POST",
        "url": {
          "raw": "http://localhost:3000/http/trading-credentials/test",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["http", "trading-credentials", "test"]
        }
      }
    }
  ]
}
```

---

## 🔌 WebSocket Communication

### **Connection**
```javascript
const ws = new WebSocket('ws://localhost:3000');
```

### **Message Format**

#### **Subscribe to Symbol**
```json
{
  "action": "subscribe",
  "symbol": "EURUSD",
  "assetType": "forex"
}
```

#### **Subscribe to Multiple Symbols**
```json
{
  "action": "subscribe", 
  "symbol": "EURUSD,XAUUSD,BTCUSD",
  "assetType": "forex"
}
```

#### **Unsubscribe**
```json
{
  "action": "unsubscribe",
  "symbol": "EURUSD",
  "assetType": "forex"
}
```

#### **Ping/Pong**
```json
{
  "action": "ping"
}
```

### **Response Messages**

#### **Subscription Confirmation**
```json
{
  "type": "subscription_confirmed",
  "symbol": "EURUSD",
  "assetType": "forex"
}
```

#### **Price Update**
```json
{
  "type": "price_update",
  "symbol": "EURUSD",
  "price": 1.0850,
  "timestamp": "2025-08-12T06:30:00.000Z"
}
```

#### **Error Message**
```json
{
  "type": "error",
  "message": "Symbol not found"
}
```

---

## 📊 Database Structure

### **Symbols Table**
```sql
CREATE TABLE symbols (
  symbol_name TEXT NOT NULL,
  symbol_type TEXT NOT NULL,
  price NUMERIC,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (symbol_name, symbol_type)
);
```

### **Sample Data**
```sql
INSERT INTO symbols VALUES
('EURUSD', 'forex', 1.0850, NOW(), NOW()),
('XAUUSD', 'forex', 2350.50, NOW(), NOW()),
('BTCUSD', 'crypto', 65000.00, NOW(), NOW());
```

---

## ⚙️ Configuration

### **Environment Variables**
```bash
# Required
ITICK_WS_AUTH_TOKEN=your_token
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Email Service Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password

# Optional
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
SUPPORT_EMAIL=support@yourcompany.com
TEST_EMAIL=test@example.com

# Alternative Email Providers (if not using Gmail)
# EMAIL_PASSWORD=your-regular-password  # For Outlook/Hotmail
# SMTP_HOST=smtp.yourprovider.com       # Custom SMTP
# SMTP_PORT=587                         # Custom SMTP port
# SMTP_SECURE=false                     # Custom SMTP security
```

### **WebSocket Configuration**
```javascript
// config/websocket.js
export const WebSocketConfig = {
  forex: {
    url: 'wss://ws.itick.com/forex',
    authToken: process.env.ITICK_WS_AUTH_TOKEN
  },
  crypto: {
    url: 'wss://ws.itick.com/crypto', 
    authToken: process.env.ITICK_WS_AUTH_TOKEN
  }
};
```

---

## 🧪 Testing

### **Test HTTP Endpoints**
```bash
# Health check
curl http://localhost:3000/health

# Get symbols
curl http://localhost:3000/http/tracked

# Get prices
curl http://localhost:3000/http/prices

# Test email service
curl http://localhost:3000/http/trading-credentials/status
```

### **Test WebSocket**
```bash
# Using wscat (install with: npm install -g wscat)
wscat -c ws://localhost:3000

# Send message
{"action": "subscribe", "symbol": "EURUSD", "assetType": "forex"}
```

### **Test Price Updates**
```bash
# Add symbol to tracking
curl -X POST http://localhost:3000/http/tracked \
  -H "Content-Type: application/json" \
  -d '{"symbol": "BTCUSD", "asset_type": "crypto"}'
```

### **Test Email Service**
```bash
# Check email service status
curl http://localhost:3000/http/trading-credentials/status

# Test email service connection
curl -X POST http://localhost:3000/http/trading-credentials/test

# Send test trading credentials
curl -X POST http://localhost:3000/http/trading-credentials \
  -H "Content-Type: application/json" \
  -d '{
    "emailID": "test@example.com",
    "tradingID": "TEST123",
    "tradingPassword": "testpass123"
  }'

# Or use npm script
npm run test-email
```

---

## 🚀 Deployment

### **Local Development**
```bash
npm start
# Server runs on http://localhost:3000
```

### **Production Deployment**
```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name "trading-server"

# Using Docker
docker build -t trading-server .
docker run -p 3000:3000 trading-server
```

### **Environment Setup**
```bash
# Production .env
NODE_ENV=production
PORT=3000
ITICK_WS_AUTH_TOKEN=your_production_token
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_key
```

---

## 🔍 Troubleshooting

### **Common Issues**

#### **1. Database Connection Failed**
```bash
Error: Database connection failed
Solution: Check Supabase credentials in .env file
```

#### **2. WebSocket Connection Failed**
```bash
Error: Could not connect to ws://localhost:3000
Solution: Ensure server is running and port 3000 is available
```

#### **3. Symbol Not Found**
```bash
Error: Symbol EURUSD not found
Solution: Add symbol to tracking first using POST /http/tracked
```

#### **4. Price Updates Not Working**
```bash
Error: column "instrument_id" of relation "trades" does not exist
Solution: Disable database triggers in Supabase (see troubleshooting section)
```

### **Database Trigger Issues**
If you encounter trigger-related errors:

```sql
-- List all triggers
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'symbols';

-- Disable problematic trigger
ALTER TABLE symbols DISABLE TRIGGER prices_update_trigger;

-- Re-enable when fixed
ALTER TABLE symbols ENABLE TRIGGER prices_update_trigger;
```

---

## 📚 Examples

### **Flutter Client Example**
```dart
import 'package:web_socket_channel/web_socket_channel.dart';

class TradingWebSocket {
  late WebSocketChannel channel;
  
  void connect() {
    channel = WebSocketChannel.connect(
      Uri.parse('ws://localhost:3000'),
    );
    
    // Subscribe to EURUSD
    channel.sink.add(jsonEncode({
      'action': 'subscribe',
      'symbol': 'EURUSD',
      'assetType': 'forex',
    }));
    
    // Listen for messages
    channel.stream.listen((message) {
      final data = jsonDecode(message);
      print('Received: $data');
    });
  }
}
```

### **JavaScript Client Example**
```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('Connected to server');
  
  // Subscribe to symbols
  ws.send(JSON.stringify({
    action: 'subscribe',
    symbol: 'EURUSD',
    assetType: 'forex'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Price update:', data);
};
```

### **cURL Examples**
```bash
# Get all tracked symbols
curl http://localhost:3000/http/tracked

# Add new symbol
curl -X POST http://localhost:3000/http/tracked \
  -H "Content-Type: application/json" \
  -d '{"symbol": "ETHUSD", "asset_type": "crypto"}'

# Get current prices
curl http://localhost:3000/http/prices

# Get candlestick data
curl "http://localhost:3000/http/candlestick?symbol=EURUSD&timeframe=1h&limit=50"
```

---

## 🎯 **Quick Reference**

### **Server Commands**
```bash
npm start          # Start server
npm run dev        # Start with nodemon
npm test           # Run tests
```

### **Key URLs**
- **Health:** `http://localhost:3000/health`
- **Symbols:** `http://localhost:3000/http/tracked`
- **Prices:** `http://localhost:3000/http/prices`
- **WebSocket:** `ws://localhost:3000`

### **Message Format**
```json
{
  "action": "subscribe|unsubscribe|ping",
  "symbol": "SYMBOL_NAME",
  "assetType": "forex|crypto|indices"
}
```

---

## 🆘 **Need Help?**

### **Check Logs**
```bash
# Server logs
npm start

# Database logs
# Check Supabase dashboard
```

### **Common Solutions**
1. **Restart server** if WebSocket connections fail
2. **Check .env file** for correct credentials
3. **Verify database tables** exist in Supabase
4. **Disable triggers** if price updates fail

### **Debug Mode**
```bash
# Enable debug logging
LOG_LEVEL=debug npm start
```

---

## 📄 **License**

This project is licensed under the MIT License.

---

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**🎉 Your real-time trading data server is now ready! Connect Flutter clients, stream live prices, and build amazing trading applications! 🚀** 
