// utils/subscriptionManager.js
// Manages client subscriptions to symbols

// Three separate maps for different asset types
const forexSymbolClientMap = new Map();      // symbol → Set<WebSocket>
const cryptoSymbolClientMap = new Map();     // symbol → Set<WebSocket>
const indicesSymbolClientMap = new Map();    // symbol → Set<WebSocket>

function getMapForAssetType(assetType) {
    switch (assetType) {
        case 'forex': return forexSymbolClientMap;
        case 'crypto': return cryptoSymbolClientMap;
        case 'indices': return indicesSymbolClientMap;
        default: throw new Error(`Invalid asset type: ${assetType}`);
    }
}

export function addClientToSymbol(assetType, symbol, client) {
    const map = getMapForAssetType(assetType);

    // Get or create client set for this symbol
    if (!map.has(symbol)) {
        map.set(symbol, new Set());
    }

    const clientsSet = map.get(symbol);
    const isFirstClient = clientsSet.size === 0;

    // Add client to the set
    clientsSet.add(client);

    // Log only occasionally to reduce disk usage
    if (Math.random() < 0.1) { // Log only 10% of additions
        console.log(`📱 Client subscribed to ${symbol} (${assetType}), total clients: ${clientsSet.size}`);
    }

    return { isFirstClient };
}

export function removeClientFromSymbol(assetType, symbol, client) {
    const map = getMapForAssetType(assetType);

    if (!map.has(symbol)) {
        return { isLastClient: false };
    }

    const clientsSet = map.get(symbol);
    const wasPresent = clientsSet.delete(client);

    if (!wasPresent) {
        return { isLastClient: false };
    }

    const isLastClient = clientsSet.size === 0;

    // If no more clients, remove the symbol entry
    if (isLastClient) {
        map.delete(symbol);

        // Log only occasionally to reduce disk usage
        if (Math.random() < 0.1) { // Log only 10% of removals
            console.log(`🗑️ Removed last client from ${symbol} (${assetType})`);
        }
    }

    return { isLastClient };
}

export function removeClientFromAllSymbol(client) {
    const symbolsEmptied = [];

    // Remove from all asset type maps
    [forexSymbolClientMap, cryptoSymbolClientMap, indicesSymbolClientMap].forEach(map => {
        for (const [symbol, clientsSet] of map.entries()) {
            if (clientsSet.has(client)) {
                clientsSet.delete(client);

                // If no more clients, remove the symbol entry
                if (clientsSet.size === 0) {
                    map.delete(symbol);
                    symbolsEmptied.push(symbol);
                }
            }
        }
    });

    return symbolsEmptied;
}

export function getClientsForSymbol(assetType, symbol) {
    const map = getMapForAssetType(assetType);
    return map.get(symbol) || new Set();
}

export function getSubscriptionStats() {
    const stats = {
        forex: forexSymbolClientMap.size,
        crypto: cryptoSymbolClientMap.size,
        indices: indicesSymbolClientMap.size
    };

    stats.total = stats.forex + stats.crypto + stats.indices;
    return stats;
}

export function getAllSubscriptions() {
    const allSubscriptions = {};

    // Get forex subscriptions
    allSubscriptions.forex = {};
    for (const [symbol, clients] of forexSymbolClientMap.entries()) {
        allSubscriptions.forex[symbol] = clients.size;
    }

    // Get crypto subscriptions
    allSubscriptions.crypto = {};
    for (const [symbol, clients] of cryptoSymbolClientMap.entries()) {
        allSubscriptions.crypto[symbol] = clients.size;
    }

    // Get indices subscriptions
    allSubscriptions.indices = {};
    for (const [symbol, clients] of indicesSymbolClientMap.entries()) {
        allSubscriptions.indices[symbol] = clients.size;
    }

    return allSubscriptions;
}