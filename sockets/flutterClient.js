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
                const { type, ac, symbol } = data;
                if (!type || !ac || !symbol) {
                    console.warn('⚠️ Invalid request: missing type, ac, or symbol');
                    return;
                }
                if (!['forex', 'crypto', 'indices'].includes(type)) {
                    console.warn('⚠️ Invalid asset type:', type);
                    return;
                }
                const symbols = symbol.split(',');
                if (ac === 'subscribe') {
                    for (const sym of symbols) {
                        addClientToSymbol(type, sym, client);
                    }
                    if (symbols.length > 1) {
                        console.log(`📡 Multiple symbols (${symbols.length}) - subscribing via subscribeToAllSymbols for ${type}`);
                        subscribeAllFns[type]();
                    } else if (symbols.length === 1) {
                        console.log(`📡 Single symbol - subscribing to ${symbols[0]} for ${type}`);
                        subscribeFns[type](symbols[0]);
                    }
                } else if (ac === 'unsubscribe') {
                    for (const sym of symbols) {
                        const isLastClient = removeClientFromSymbol(type, sym, client);
                        if (isLastClient) {
                            console.log(`❌ No clients for ${sym} (${type}), removed from map`);
                        }
                    }
                } else {
                    console.warn('⚠️ Unknown action:', ac);
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