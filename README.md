# 🚀 Real-Time Market Data Server

A Node.js WebSocket server that provides real-time market data for forex, crypto, and indices. The server acts as a gateway between Flutter clients and the iTick API, offering both WebSocket streaming and HTTP REST endpoints.

## 📋 Table of Contents

- [Features](#-features)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [WebSocket Protocol](#-websocket-protocol)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

- **Multi-Asset Support**: Real-time data for forex, crypto, and indices
- **Dual Protocol**: WebSocket streaming + HTTP REST endpoints
- **Modular Architecture**: Clean, maintainable code structure
- **CORS Support**: Cross-origin requests for web clients
- **Auto-Reconnection**: Robust WebSocket connection management
- **Health Monitoring**: Built-in health checks and logging
- **Scalable**: Easy to add new asset types and features

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Flutter       │    │   Web Client    │    │   Mobile App    │
│   Client        │    │   (Browser)     │    │   (iOS/Android) │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │    Market Data Server     │
                    │    (Node.js + Express)    │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      iTick API            │
                    │   (WebSocket + REST)      │
                    └───────────────────────────┘
```

### **Core Components:**

1. **WebSocket Gateway**: Handles real-time data streaming
2. **HTTP Gateway**: Provides REST API endpoints
3. **Subscription Manager**: Manages client subscriptions
4. **WebSocket Manager**: Modular WebSocket connection handling
5. **Configuration System**: Centralized settings management

## 📁 Project Structure

```
rc_server_temp1/
├── server.js                    # 🚀 Main application entry point
├── package.json                 # 📦 Dependencies and scripts
├── .env                        # 🔐 Environment variables
├── config/
│   ├── envConfig.js            # 🔧 Environment configuration
│   └── websocket.js            # 🌐 WebSocket configuration
├── websocket/
│   └── WebSocketManager.js     # 🔌 Generic WebSocket manager
├── sockets/
│   ├── flutterClient.js        # 📱 Flutter client handler
│   ├── iTickForex.js          # 💱 Forex WebSocket connection
│   ├── iTickCrypto.js         # 🪙 Crypto WebSocket connection
│   ├── iTickIndices.js        # 📊 Indices WebSocket connection
│   └── iTick.js               # 📡 Legacy single WebSocket
├── http/
│   ├── candlestick.js         # 📈 Candlestick data endpoint
│   └── quote.js               # 💹 Real-time quote endpoint
├── utils/
│   ├── subscriptionManager.js  # 📋 Client subscription management
│   ├── ping.js                # 🏓 WebSocket ping utility
│   └── logger.js              # 📝 Logging utility
└── services/                   # 🔧 Additional services
```

## 🛠️ Installation

### **Prerequisites**
- Node.js (v16 or higher)
- npm or yarn
- iTick API credentials

### **Setup**
```bash
# Clone the repository
git clone <repository-url>
cd rc_server_temp1

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit environment variables
nano .env

# Start the server
npm start
```

## ⚙️ Configuration

### **Environment Variables (.env)**
```bash
# iTick API Configuration
ITICK_FOREX_WS_URL=wss://api.itick.org/fws
ITICK_CRYPTO_WS_URL=wss://api.itick.org/cws
ITICK_INDICES_WS_URL=wss://api.itick.org/iws
ITICK_WS_AUTH_TOKEN=your_api_token_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### **WebSocket Configuration**
The server supports three asset types with different regions:

| Asset Type | Region | Description |
|------------|--------|-------------|
| `forex`    | `gb`   | Foreign exchange pairs |
| `crypto`   | `ba`   | Cryptocurrency pairs |
| `indices`  | `gb`   | Market indices |

## 🚀 Usage

### **Starting the Server**
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start

# Check server status
curl http://localhost:3000/
```

### **Health Check**
```bash
GET http://localhost:3000/
```

**Response:**
```json
{
  "status": "running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "connections": {
    "forex": {"connected": true, "ready": true},
    "crypto": {"connected": true, "ready": true},
    "indices": {"connected": true, "ready": true}
  }
}
```

## 📡 WebSocket Protocol

### **Client Connection**
```javascript
// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:3000');
```

### **Subscription Format**
```javascript
// Subscribe to forex
{
  "data": "forex",
  "type": "subscribe", 
  "symbol": "EURUSD"
}

// Subscribe to crypto
{
  "data": "crypto",
  "type": "subscribe",
  "symbol": "BTCUSD"
}

// Subscribe to indices
{
  "data": "indices", 
  "type": "subscribe",
  "symbol": "SPX"
}

// Multiple symbols
{
  "data": "forex",
  "type": "subscribe",
  "symbol": "EURUSD,GBPUSD,USDJPY"
}
```

### **Unsubscription**
```javascript
{
  "data": "forex",
  "type": "unsubscribe",
  "symbol": "EURUSD"
}
```

### **Real-Time Data Format**
```json
{
  "data": {
    "s": "EURUSD",
    "b": "1.0850",
    "a": "1.0851",
    "t": 1704067200000
  }
}
```

## 🌐 HTTP API Reference

### **Candlestick Data**
```bash
GET /http/candlestick?type=forex&code=EURUSD&kType=1&et=1753695900000&limit=50
```

**Parameters:**
- `type`: Asset type (`forex`, `crypto`, `indices`)
- `code`: Symbol code (e.g., `EURUSD`)
- `kType`: Timeframe type (`1` = 1 minute)
- `et`: End timestamp (milliseconds)
- `limit`: Number of candles (max 1000)

**Response:**
```json
{
  "code": 0,
  "msg": null,
  "data": [
    {
      "tu": 1426.336458,
      "c": 1.16762,
      "t": 1753692900000,
      "v": 1221.7,
      "h": 1.16763,
      "l": 1.1674,
      "o": 1.16743
    }
  ]
}
```

### **Real-Time Quote**
```bash
GET /http/quote?type=forex&symbol=EURUSD
```

**Parameters:**
- `type`: Asset type (`forex`, `crypto`, `indices`)
- `symbol`: Symbol name (e.g., `EURUSD`)

**Response:**
```json
{
  "code": 0,
  "msg": null,
  "data": {
    "symbol": "EURUSD",
    "bid": "1.0850",
    "ask": "1.0851",
    "timestamp": 1704067200000
  }
}
```

## 🔧 Development

### **Project Architecture**

#### **1. WebSocket Manager (`websocket/WebSocketManager.js`)**
- Generic WebSocket connection handler
- Automatic reconnection logic
- Message routing and error handling
- Supports multiple asset types

#### **2. Subscription Manager (`utils/subscriptionManager.js`)**
- Manages client subscriptions per asset type
- Tracks symbol-client mappings
- Handles client disconnections
- Provides subscription statistics

#### **3. Flutter Client Handler (`sockets/flutterClient.js`)**
- Handles incoming WebSocket connections
- Parses client subscription requests
- Routes messages to appropriate asset types
- Manages CORS for web clients

#### **4. HTTP Controllers (`http/`)**
- REST API endpoints for historical data
- CORS support for cross-origin requests
- Error handling and validation
- Proxies requests to iTick API

### **Adding New Asset Types**

1. **Update Configuration:**
```javascript
// config/websocket.js
export const WebSocketConfig = {
  // ... existing config
  newAsset: {
    url: 'wss://api.itick.org/new',
    region: 'gb',
    authToken: ITICK_WS_AUTH_TOKEN
  }
};
```

2. **Create WebSocket Handler:**
```javascript
// sockets/iTickNewAsset.js
import { WebSocketManager } from '../websocket/WebSocketManager.js';
import { WebSocketConfig } from '../config/websocket.js';

let newAssetManager = null;

function connectToNewAsset() {
  if (!newAssetManager) {
    newAssetManager = new WebSocketManager('newAsset', WebSocketConfig.newAsset);
    // Set up message handler...
  }
  return newAssetManager.connect();
}

export { connectToNewAsset, subscribeSymbol, subscribeToAllSymbols };
```

3. **Update Server:**
```javascript
// server.js
import { connectToNewAsset } from './sockets/iTickNewAsset.js';

// Add to startServices function
await connectToNewAsset();
```

### **Logging System**

The project uses a structured logging system:

```javascript
import { Logger } from './utils/logger.js';

const logger = new Logger('ComponentName');

logger.info('Information message');
logger.warn('Warning message');
logger.error('Error message');
logger.debug('Debug message'); // Only in development
```

## 🐛 Troubleshooting

### **Common Issues**

#### **1. WebSocket Connection Failed**
```bash
# Check environment variables
echo $ITICK_WS_AUTH_TOKEN

# Verify API credentials
curl -H "token: $ITICK_WS_AUTH_TOKEN" https://api.itick.org/forex/quote?code=EURUSD&region=gb
```

#### **2. CORS Errors**
- Ensure CORS middleware is enabled
- Check client origin in browser console
- Verify preflight requests are handled

#### **3. Subscription Not Working**
```bash
# Check server logs
npm start

# Verify WebSocket connection
wscat -c ws://localhost:3000
```

#### **4. HTTP Endpoints Not Responding**
```bash
# Test health endpoint
curl http://localhost:3000/

# Test candlestick endpoint
curl "http://localhost:3000/http/candlestick?type=forex&code=EURUSD&kType=1&et=1753695900000&limit=10"
```

### **Debug Mode**
```bash
# Enable debug logging
NODE_ENV=development npm start
```

### **Performance Monitoring**
```bash
# Check subscription stats
curl http://localhost:3000/ | jq '.subscriptions'

# Monitor WebSocket connections
curl http://localhost:3000/ | jq '.websocket'
```

## 📊 Monitoring & Metrics

### **Health Endpoints**
- `GET /` - Server status and connection info
- WebSocket connection status per asset type
- Subscription statistics
- Error rates and response times

### **Log Analysis**
```bash
# Filter forex logs
npm start 2>&1 | grep "WebSocket:forex"

# Monitor errors
npm start 2>&1 | grep "ERROR"
```

## 🔒 Security Considerations

1. **API Token Protection**: Store tokens in environment variables
2. **CORS Configuration**: Restrict origins in production
3. **Rate Limiting**: Implement rate limiting for HTTP endpoints
4. **Input Validation**: Validate all client inputs
5. **Error Handling**: Don't expose sensitive information in errors

## 📈 Performance Optimization

1. **Connection Pooling**: Reuse WebSocket connections
2. **Message Batching**: Batch multiple symbols in single request
3. **Caching**: Cache frequently requested data
4. **Load Balancing**: Distribute load across multiple instances

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs
3. Test with minimal configuration
4. Create an issue with detailed information

---

**Happy Trading! 📈** 
