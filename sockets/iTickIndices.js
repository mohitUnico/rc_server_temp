import WebSocket from 'ws';
import { WebSocketManager } from '../websocket/WebSocketManager.js';
import { WebSocketConfig } from '../config/websocket.js';
import { PriceUpdateService } from '../services/priceUpdateService.js';
import { getClientsForSymbol, removeClientFromSymbol } from '../utils/subscriptionManager.js';

let indicesManager = null;

export async function connectToIndices() {
    if (!indicesManager) {
        indicesManager = new WebSocketManager('indices', WebSocketConfig.indices);

        // Set up message handler for incoming data
        indicesManager.onMessage(async (message, assetType) => {
            try {
                // Extract symbol and price from message
                const symbol = message.data?.s;           // Symbol (e.g., 'SPX500')
                const lastPrice = message.data?.ld;       // Last price (e.g., 4500.00)

                if (symbol && lastPrice !== undefined) {
                    // Check if symbol is tracked and update database if needed
                    const updateResult = await PriceUpdateService.updatePrice(symbol, lastPrice, assetType);
                }

                // Always get clients subscribed to this symbol (regardless of tracking status)
                const clients = getClientsForSymbol(assetType, symbol);

                if (clients && clients.size > 0) {
                    // Send data to all subscribed clients
                    for (const client of clients) {
                        if (client.readyState === 1) { // WebSocket.OPEN
                            try {
                                client.send(JSON.stringify(message));
                            } catch (error) {
                                console.error(`Error sending message to client for ${symbol}:`, error);
                            }
                        }
                    }
                }

            } catch (error) {
                console.error(`Error processing ${assetType} message for ${symbol}:`, error);
            }
        });
    }

    return indicesManager.connect();
}

export async function subscribeSymbol(symbol) {
    if (indicesManager) {
        return await indicesManager.subscribe(symbol);
    }
    throw new Error('Indices manager not initialized');
}

export async function subscribeToAllSymbols() {
    if (indicesManager) {
        return await indicesManager.subscribeToAllSymbols();
    }
    throw new Error('Indices manager not initialized');
}

export async function unsubscribeSymbol(symbol) {
    if (indicesManager) {
        return await indicesManager.unsubscribe(symbol);
    }
    throw new Error('Indices manager not initialized');
} 