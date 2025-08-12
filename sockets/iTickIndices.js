import { WebSocketManager } from '../websocket/WebSocketManager.js';
import { WebSocketConfig } from '../config/websocket.js';
import { getAllSymbols, getClientsForSymbol } from "../utils/subscriptionManager.js";
import { PriceUpdateService } from '../services/priceUpdateService.js';

let indicesManager = null;

function connectToIndices() {
    if (!indicesManager) {
        indicesManager = new WebSocketManager('indices', WebSocketConfig.indices);

        // Set up message handler
        indicesManager.onMessage(async (message, assetType) => {
            const symbol = message.data?.s;
            if (!symbol) return;

            // Update price in Supabase for tracked symbols
            const lastPrice = message.data?.ld;
            if (lastPrice !== undefined) {
                await PriceUpdateService.updatePrice(symbol, lastPrice, assetType);
            }

            const clients = getClientsForSymbol(assetType, symbol);
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
    return indicesManager.connect();
}

async function subscribeSymbol(symbol) {
    if (indicesManager) {
        return await indicesManager.subscribe(symbol);
    }
    throw new Error('Indices WebSocket manager not initialized');
}

async function subscribeToAllSymbols() {
    if (indicesManager) {
        return await indicesManager.subscribeToAll();
    }
    throw new Error('Indices WebSocket manager not initialized');
}

async function unsubscribeSymbol(symbol) {
    if (indicesManager) {
        return await indicesManager.unsubscribe(symbol);
    }
    throw new Error('Indices WebSocket manager not initialized');
}

export { connectToIndices, subscribeSymbol, subscribeToAllSymbols, unsubscribeSymbol }; 