import express from 'express';
import { WebSocketServer } from "ws";
import candlestickRouter from '../http/candlestick.js';
import quoteRouter from '../http/quote.js';
import { addClientToSymbol, removeClientFromSymbol, removeClientFromAllSymbol } from "../utils/subscriptionManager.js";
import { subscribeSymbol as subscribeForex, subscribeToAllSymbols as subscribeAllForex } from "./iTickForex.js";
import { subscribeSymbol as subscribeCrypto, subscribeToAllSymbols as subscribeAllCrypto } from "./iTickCrypto.js";
import { subscribeSymbol as subscribeIndices, subscribeToAllSymbols as subscribeAllIndices } from "./iTickIndices.js";

const subscribeFns = {
    forex: subscribeForex,
    crypto: subscribeCrypto,
    indices: subscribeIndices
};
const subscribeAllFns = {
    forex: subscribeAllForex,
    crypto: subscribeAllCrypto,
    indices: subscribeAllIndices
};

const app = express();

// CORS middleware to allow cross-origin requests
app.use((req, res, next) => {
    // Allow requests from any origin (you can restrict this to specific domains)
    res.header('Access-Control-Allow-Origin', '*');

    // Allow specific HTTP methods
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    // Allow specific headers
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json());

// Attach your HTTP routers
app.use('/http', candlestickRouter);
app.use('/http', quoteRouter);

// Optionally, add a health check or root endpoint
app.get('/', (req, res) => res.send('Flutter HTTP+WebSocket Gateway Running'));

// WebSocket server setup
function startFlutterWebSocket(server) {
    let wss;
    if (server) {
        wss = new WebSocketServer({ server });
        console.log("🚀 Flutter WebSocket server running (attached to HTTP server)");
    } else {
        wss = new WebSocketServer({ port: 3000 });
        console.log("🚀 Flutter WebSocket server running on ws://localhost:3000");
    }

    wss.on('connection', (client) => {
        console.log('🔌 Client connected');
        client.on('message', (msg) => {
            try {
                const data = JSON.parse(msg);
                console.log(`Request from flutter client: ${msg.toString()}`);
                const { data: assetType = 'forex', type: action, symbol } = data;
                if (!action || !symbol) {
                    console.warn('⚠️ Invalid request: missing type or symbol');
                    return;
                }
                if (!['forex', 'crypto', 'indices'].includes(assetType)) {
                    console.warn('⚠️ Invalid asset type:', assetType);
                    return;
                }
                const symbols = symbol.split(',');
                if (action === 'subscribe') {
                    for (const sym of symbols) {
                        addClientToSymbol(assetType, sym, client);
                    }
                    if (symbols.length > 1) {
                        console.log(`📡 Multiple symbols (${symbols.length}) - subscribing via subscribeToAllSymbols for ${assetType}`);
                        subscribeAllFns[assetType]();
                    } else if (symbols.length === 1) {
                        console.log(`📡 Single symbol - subscribing to ${symbols[0]} for ${assetType}`);
                        subscribeFns[assetType](symbols[0]);
                    }
                } else if (action === 'unsubscribe') {
                    for (const sym of symbols) {
                        const isLastClient = removeClientFromSymbol(assetType, sym, client);
                        if (isLastClient) {
                            console.log(`❌ No clients for ${sym} (${assetType}), removed from map`);
                        }
                    }
                } else {
                    console.warn('⚠️ Unknown action:', action);
                }
            } catch (error) {
                console.error('❗ Invalid message from client', error);
            }
        });
        client.on('close', () => {
            console.log('🔌 Client disconnected');
            // Remove from all asset types
            ['forex', 'crypto', 'indices'].forEach(type => removeClientFromAllSymbol(type, client));
        });
    });
}

export { app, startFlutterWebSocket };