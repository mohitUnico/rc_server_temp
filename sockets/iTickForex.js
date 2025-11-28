import WebSocket from 'ws';
import { WebSocketManager } from '../websocket/WebSocketManager.js';
import { WebSocketConfig } from '../config/websocket.js';
import { getClientsForSymbol, removeClientFromSymbol, getAllSubscriptions } from '../utils/subscriptionManager.js';
import priceCacheService from '../services/priceCacheService.js';
import forexSubscriptionService from '../services/forexSubscriptionService.js';

// Threshold after which we consider that no new data is coming from iTick
const INACTIVITY_THRESHOLD_MS = 5000; // 5 seconds
// How often we will push cached data to Flutter clients while upstream is idle
const CACHE_BROADCAST_INTERVAL_MS = 1000; // 1 second

let forexManager = null;
let lastMessageTime = null;
let cacheBroadcastInterval = null;

export async function connectToForex() {
    if (!forexManager) {
        forexManager = new WebSocketManager('forex', WebSocketConfig.forex);

        // Set up message handler for incoming data
        forexManager.onMessage(async (message, assetType) => {
            let symbol;
            try {
                // Extract symbol and price from message
                symbol = message.data?.s;           // Symbol (e.g., 'EURUSD')
                const lastPrice = message.data?.ld; // Last price (e.g., 1.0850)

                if (symbol && lastPrice !== undefined) {
                    // Update "last live message" timestamp
                    lastMessageTime = Date.now();

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
                        if (client.readyState === WebSocket.OPEN) {
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

        // Start cache-based broadcast loop so Flutter clients keep receiving data
        // even when iTick temporarily stops sending updates
        if (!cacheBroadcastInterval) {
            cacheBroadcastInterval = setInterval(() => {
                broadcastCachedPricesWhenIdle();
            }, CACHE_BROADCAST_INTERVAL_MS);
        }
    }

    return forexManager;
}

/**
 * When the iTick WebSocket is idle for a period of time, use the last
 * cached prices from priceCacheService and stream them to all subscribed
 * Flutter clients. This ensures clients still get data if upstream is quiet.
 */
function broadcastCachedPricesWhenIdle() {
    const now = Date.now();

    // If we've seen a live tick recently, skip cache broadcasting
    if (lastMessageTime && (now - lastMessageTime) < INACTIVITY_THRESHOLD_MS) {
        return;
    }

    const subscriptions = getAllSubscriptions();
    const forexSubscriptions = subscriptions.forex || {};

    // For each subscribed forex symbol, push the last known cached value
    for (const [symbol, clientCount] of Object.entries(forexSubscriptions)) {
        if (!symbol || clientCount <= 0) continue;

        // Get the last known price data from cache (without staleness checks)
        const priceData = priceCacheService.getPriceData('forex', symbol);
        if (!priceData || priceData.price === undefined || priceData.price === null) {
            continue;
        }

        const clients = getClientsForSymbol('forex', symbol);
        if (!clients || clients.size === 0) continue;

        // Build a message that is compatible with the live iTick payload,
        // but explicitly marked as coming from cache.
        const message = {
            resAc: 'quote',
            source: 'cache',
            assetType: 'forex',
            data: {
                // Preserve original data if we have it
                ...(priceData.data || {}),
                s: symbol,
                ld: priceData.price,
                ts: priceData.timestamp
            }
        };

        for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(JSON.stringify(message));
                } catch (error) {
                    console.error(`Error sending cached message to client for ${symbol}:`, error);
                }
            }
        }

        if (forexManager && forexManager.logger) {
            forexManager.logger.debug(`Broadcasted cached ${symbol} data to ${clients.size} clients (upstream idle)`);
        }
    }
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