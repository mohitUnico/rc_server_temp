import WebSocket from 'ws';
import { WebSocketManager } from '../websocket/WebSocketManager.js';
import { WebSocketConfig } from '../config/websocket.js';
import { getClientsForSymbol, removeClientFromSymbol } from '../utils/subscriptionManager.js';
import priceCacheService from '../services/priceCacheService.js';
import forexSubscriptionService from '../services/forexSubscriptionService.js';

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

                    // Log successful price update (but keep it minimal to avoid console overload)
                    if (forexManager.logger) {
                        forexManager.logger.debug(`Updated price for ${symbol}: ${lastPrice}`);
                    }
                } else {
                    // Log message structure for debugging if symbol or price is missing
                    if (forexManager.logger) {
                        forexManager.logger.debug(`Received message without symbol/price: ${JSON.stringify(message).substring(0, 200)}...`);
                    }
                }

                // Always broadcast to all clients subscribed to this symbol
                // This ensures all Flutter clients receive data for symbols they're interested in
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

                    // Log broadcast information
                    if (forexManager.logger) {
                        forexManager.logger.debug(`Broadcasted ${symbol} data to ${clients.size} clients`);
                    }
                } else {
                    // Log when no clients are subscribed to a symbol (for monitoring)
                    if (forexManager.logger) {
                        forexManager.logger.debug(`No clients subscribed to ${symbol} - data cached but not forwarded`);
                    }
                }

            } catch (error) {
                console.error(`Error processing ${assetType} message for ${symbol}:`, error);
            }
        });

        // Connect to forex WebSocket
        await forexManager.connect();

        // After successful connection, subscribe to all forex symbols
        try {
            await forexSubscriptionService.subscribeToAllSymbols(forexManager);
        } catch (error) {
            console.error('Failed to subscribe to forex symbols:', error);
        }
    }

    return forexManager;
}

export async function subscribeSymbol(symbol) {
    if (forexManager) {
        return await forexManager.subscribe(symbol);
    }
    throw new Error('Forex manager not initialized');
}

export async function subscribeToAllSymbols() {
    if (forexManager) {
        return await forexSubscriptionService.subscribeToAllSymbols(forexManager);
    }
    throw new Error('Forex manager not initialized');
}

export async function unsubscribeSymbol(symbol) {
    if (forexManager) {
        return await forexManager.unsubscribe(symbol);
    }
    throw new Error('Forex manager not initialized');
}

export async function unsubscribeFromAllSymbols() {
    if (forexManager) {
        return await forexSubscriptionService.unsubscribeFromAllSymbols(forexManager);
    }
    throw new Error('Forex manager not initialized');
}

export function getForexSubscriptionStatus() {
    return forexSubscriptionService.getSubscriptionStatus();
} 