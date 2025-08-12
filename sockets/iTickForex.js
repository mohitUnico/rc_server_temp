import { WebSocketManager } from '../websocket/WebSocketManager.js';
import { WebSocketConfig } from '../config/websocket.js';
import { getAllSymbols, getClientsForSymbol } from "../utils/subscriptionManager.js";
import { PriceUpdateService } from '../services/priceUpdateService.js';

let forexManager = null;

function connectToForex() {
    if (!forexManager) {
        forexManager = new WebSocketManager('forex', WebSocketConfig.forex);

        // Set up message handler
        forexManager.onMessage(async (message, assetType) => {
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
    return forexManager.connect();
}

async function subscribeSymbol(symbol) {
    if (forexManager) {
        return await forexManager.subscribe(symbol);
    }
    throw new Error('Forex WebSocket manager not initialized');
}

async function subscribeToAllSymbols() {
    if (forexManager) {
        return await forexManager.subscribeToAll();
    }
    throw new Error('Forex WebSocket manager not initialized');
}

async function unsubscribeSymbol(symbol) {
    if (forexManager) {
        return await forexManager.unsubscribe(symbol);
    }
    throw new Error('Forex WebSocket manager not initialized');
}

export { connectToForex, subscribeSymbol, subscribeToAllSymbols, unsubscribeSymbol }; 