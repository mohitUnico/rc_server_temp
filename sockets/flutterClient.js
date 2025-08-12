import express from 'express';
import { WebSocketServer } from 'ws';
import { addClientToSymbol, removeClientFromSymbol, removeClientFromAllSymbol } from "../utils/subscriptionManager.js";
import { subscribeSymbol as subscribeForex, subscribeToAllSymbols as subscribeAllForex } from "./iTickForex.js";
import { subscribeSymbol as subscribeCrypto, subscribeToAllSymbols as subscribeAllCrypto } from "./iTickCrypto.js";
import { subscribeSymbol as subscribeIndices, subscribeToAllSymbols as subscribeAllIndices } from "./iTickIndices.js";

const app = express();

// WebSocket server for Flutter clients
let flutterWss = null;

export function startFlutterWebSocket(server) {
    if (flutterWss) {
        console.log('⚠️ Flutter WebSocket server already running');
        return;
    }

    // Create WebSocket server without path restriction for better compatibility
    flutterWss = new WebSocketServer({
        server: server
        // Removed path: '/flutter' to accept connections on root path
    });

    console.log('🚀 Flutter WebSocket server started on root path (ws://localhost:3000)');

    flutterWss.on('connection', (ws, req) => {
        console.log('📱 New Flutter client connected');

        // Store client info
        ws.isAlive = true;
        ws.subscribedSymbols = new Set();

        // Handle incoming messages from Flutter client
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                console.log('📨 Received from Flutter client:', data);

                await handleFlutterMessage(ws, data);
            } catch (error) {
                console.error('❌ Error parsing Flutter message:', error);
                sendError(ws, 'Invalid message format');
            }
        });

        // Handle client disconnect
        ws.on('close', () => {
            console.log('📱 Flutter client disconnected');
            handleClientDisconnect(ws);
        });

        // Handle ping/pong for connection health
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        // Send welcome message
        sendMessage(ws, {
            type: 'connection',
            status: 'connected',
            message: 'Welcome to Real-time Market Data Server'
        });
    });

    // Set up ping interval to check connection health
    const interval = setInterval(() => {
        flutterWss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                console.log('💀 Terminating inactive connection');
                return ws.terminate();
            }

            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    flutterWss.on('close', () => {
        clearInterval(interval);
    });
}

async function handleFlutterMessage(ws, data) {
    // Support both old and new message formats
    const action = data.action || data.type;
    const symbol = data.symbol;
    const assetType = data.assetType || data.data;

    if (!action) {
        sendError(ws, 'Missing action/type field');
        return;
    }

    switch (action) {
        case 'subscribe':
            if (!symbol || !assetType) {
                sendError(ws, 'Missing symbol or assetType for subscription');
                return;
            }

            // Handle multiple symbols (comma-separated)
            const symbols = symbol.split(',').map(s => s.trim());

            for (const sym of symbols) {
                if (sym) {
                    await handleSubscribe(ws, sym, assetType);
                }
            }
            break;

        case 'unsubscribe':
            if (!symbol || !assetType) {
                sendError(ws, 'Missing symbol or assetType for unsubscription');
                return;
            }

            // Handle multiple symbols (comma-separated)
            const unsubSymbols = symbol.split(',').map(s => s.trim());

            for (const sym of unsubSymbols) {
                if (sym) {
                    await handleUnsubscribe(ws, sym, assetType);
                }
            }
            break;

        case 'ping':
            sendMessage(ws, { type: 'pong', timestamp: Date.now() });
            break;

        default:
            sendError(ws, `Unknown action: ${action}. Supported actions: subscribe, unsubscribe, ping`);
    }
}

async function handleSubscribe(ws, symbol, assetType) {
    try {
        console.log(`📱 Flutter client subscribing to ${symbol} (${assetType})`);

        // Add client to symbol subscription
        const { isFirstClient } = addClientToSymbol(assetType, symbol, ws);

        // Add to client's subscribed symbols
        ws.subscribedSymbols.add(`${assetType}:${symbol}`);

        // Subscribe to upstream if this is the first client
        if (isFirstClient) {
            console.log(`🔗 First client for ${symbol}, subscribing to upstream`);
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

        console.log(`✅ Flutter client subscribed to ${symbol} (${assetType})`);

    } catch (error) {
        console.error(`❌ Error subscribing to ${symbol}:`, error);
        sendError(ws, `Failed to subscribe to ${symbol}: ${error.message}`);
    }
}

async function handleUnsubscribe(ws, symbol, assetType) {
    try {
        console.log(`📱 Flutter client unsubscribing from ${symbol} (${assetType})`);

        // Remove client from symbol subscription
        const { isLastClient } = removeClientFromSymbol(assetType, symbol, ws);

        // Remove from client's subscribed symbols
        ws.subscribedSymbols.delete(`${assetType}:${symbol}`);

        // Unsubscribe from upstream if this is the last client
        if (isLastClient) {
            console.log(`🔗 Last client for ${symbol}, unsubscribing from upstream`);
            const unsubscribeFn = getUnsubscribeFunction(assetType);
            if (unsubscribeFn) {
                await unsubscribeFn(symbol);
            }
        }

        sendMessage(ws, {
            type: 'unsubscription',
            status: 'success',
            symbol: symbol,
            assetType: assetType,
            message: `Successfully unsubscribed from ${symbol}`
        });

        console.log(`✅ Flutter client unsubscribed from ${symbol} (${assetType})`);

    } catch (error) {
        console.error(`❌ Error unsubscribing from ${symbol}:`, error);
        sendError(ws, `Failed to unsubscribe from ${symbol}: ${error.message}`);
    }
}

function handleClientDisconnect(ws) {
    try {
        // Remove client from all symbol subscriptions
        const symbolsEmptied = removeClientFromAllSymbol(ws);

        // Unsubscribe from upstream for symbols that no longer have clients
        symbolsEmptied.forEach(async ({ assetType, symbol }) => {
            console.log(`🔗 No more clients for ${symbol}, unsubscribing from upstream`);
            const unsubscribeFn = getUnsubscribeFunction(assetType);
            if (unsubscribeFn) {
                await unsubscribeFn(symbol);
            }
        });

        console.log(`✅ Client disconnected and cleaned up from ${ws.subscribedSymbols.size} symbols`);

    } catch (error) {
        console.error('❌ Error handling client disconnect:', error);
    }
}

function getSubscribeFunction(assetType) {
    const subscribeFns = {
        'forex': subscribeForex,
        'crypto': subscribeCrypto,
        'indices': subscribeIndices
    };
    return subscribeFns[assetType];
}

function getUnsubscribeFunction(assetType) {
    const unsubscribeFns = {
        'forex': (symbol) => {
            // Note: iTick doesn't support unsubscribing from individual symbols
            // They only support unsubscribing from all symbols
            console.log(`⚠️ Cannot unsubscribe from individual ${assetType} symbol: ${symbol}`);
            return Promise.resolve();
        },
        'crypto': (symbol) => {
            console.log(`⚠️ Cannot unsubscribe from individual ${assetType} symbol: ${symbol}`);
            return Promise.resolve();
        },
        'indices': (symbol) => {
            console.log(`⚠️ Cannot unsubscribe from individual ${assetType} symbol: ${symbol}`);
            return Promise.resolve();
        }
    };
    return unsubscribeFns[assetType];
}

function sendMessage(ws, data) {
    if (ws.readyState === 1) { // WebSocket.OPEN
        try {
            ws.send(JSON.stringify(data));
        } catch (error) {
            console.error('❌ Error sending message to client:', error);
        }
    }
}

function sendError(ws, message) {
    sendMessage(ws, {
        type: 'error',
        status: 'error',
        message: message,
        timestamp: Date.now()
    });
}

// Export the Express app for use in server.js
export { app };