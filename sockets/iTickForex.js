import WebSocket from 'ws';
import { WebSocketManager } from '../websocket/WebSocketManager.js';
import { WebSocketConfig } from '../config/websocket.js';
import { PriceUpdateService } from '../services/priceUpdateService.js';
import { getClientsForSymbol, removeClientFromSymbol } from '../utils/subscriptionManager.js';
import priceCacheService from '../services/priceCacheService.js';

let forexManager = null;

export async function connectToForex() {
    if (!forexManager) {
        forexManager = new WebSocketManager('forex', WebSocketConfig.forex);

        // Set up message handler for incoming data
        forexManager.onMessage(async (message, assetType) => {
            try {
                // Extract symbol and price from message
                const symbol = message.data?.s;           // Symbol (e.g., 'EURUSD')
                const lastPrice = message.data?.ld;       // Last price (e.g., 1.0850)

                if (symbol && lastPrice !== undefined) {
                    // Update price cache for trading monitor services
                    priceCacheService.updatePrice(assetType, symbol, lastPrice, message.data);
                    
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

    return forexManager.connect();
}

export async function subscribeSymbol(symbol) {
    if (forexManager) {
        return await forexManager.subscribe(symbol);
    }
    throw new Error('Forex manager not initialized');
}

export async function subscribeToAllSymbols() {
    if (forexManager) {
        return await forexManager.subscribeToAllSymbols();
    }
    throw new Error('Forex manager not initialized');
}

export async function unsubscribeSymbol(symbol) {
    if (forexManager) {
        return await forexManager.unsubscribe(symbol);
    }
    throw new Error('Forex manager not initialized');
} 