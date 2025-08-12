import { WebSocketManager } from '../websocket/WebSocketManager.js';
import { WebSocketConfig } from '../config/websocket.js';
import { getAllSymbols, getClientsForSymbol } from "../utils/subscriptionManager.js";
import { PriceUpdateService } from '../services/priceUpdateService.js';

let cryptoManager = null;

function connectToCrypto() {
    if (!cryptoManager) {
        cryptoManager = new WebSocketManager('crypto', WebSocketConfig.crypto);

        // Set up message handler
        cryptoManager.onMessage(async (message, assetType) => {
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
    return cryptoManager.connect();
}

async function subscribeSymbol(symbol) {
    if (cryptoManager) {
        return await cryptoManager.subscribe(symbol);
    }
    throw new Error('Crypto WebSocket manager not initialized');
}

async function subscribeToAllSymbols() {
    if (cryptoManager) {
        return await cryptoManager.subscribeToAll();
    }
    throw new Error('Crypto WebSocket manager not initialized');
}

async function unsubscribeSymbol(symbol) {
    if (cryptoManager) {
        return await cryptoManager.unsubscribe(symbol);
    }
    throw new Error('Crypto WebSocket manager not initialized');
}

export { connectToCrypto, subscribeSymbol, subscribeToAllSymbols, unsubscribeSymbol }; 