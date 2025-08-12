// Multi-asset symbol-client maps
const forexSymbolClientMap = new Map();
const cryptoSymbolClientMap = new Map();
const indicesSymbolClientMap = new Map();

function getMapForAssetType(assetType) {
    switch (assetType) {
        case 'forex': return forexSymbolClientMap;
        case 'crypto': return cryptoSymbolClientMap;
        case 'indices': return indicesSymbolClientMap;
        default: throw new Error(`Unknown asset type: ${assetType}`);
    }
}

function addClientToSymbol(assetType, symbol, client) {
    const map = getMapForAssetType(assetType);
    if (!map.has(symbol)) {
        map.set(symbol, new Set());
    }
    const clientsSet = map.get(symbol);
    const isFirstClient = clientsSet.size === 0;
    clientsSet.add(client);

    console.log(`➕ Client added to ${assetType} symbol: ${symbol}`);
    console.log(`📊 Total clients for ${symbol}: ${clientsSet.size}`);
    let index = 1;
    for (const c of clientsSet) {
        console.log(`  Client ${index++}: readyState = ${c.readyState}`);
    }

    return { isFirstClient };
}

function removeClientFromSymbol(assetType, symbol, client) {
    const map = getMapForAssetType(assetType);
    const clients = map.get(symbol);
    if (!clients) return { isLastClient: false };

    const wasLastClient = clients.size === 1;
    clients.delete(client);

    if (clients.size === 0) {
        map.delete(symbol);
        return { isLastClient: true };
    }

    return { isLastClient: false };
}

function getClientsForSymbol(assetType, symbol) {
    const map = getMapForAssetType(assetType);
    return map.get(symbol) || new Set();
}

function getAllSymbols(assetType) {
    const map = getMapForAssetType(assetType);
    return Array.from(map.keys());
}

function removeClientFromAllSymbol(client) {
    const symbolsEmptied = [];

    // Check all asset types
    const assetTypes = ['forex', 'crypto', 'indices'];

    for (const assetType of assetTypes) {
        const map = getMapForAssetType(assetType);
        for (const [symbol, clients] of map.entries()) {
            if (clients.has(client)) {
                clients.delete(client);
                if (clients.size === 0) {
                    map.delete(symbol);
                    symbolsEmptied.push({ assetType, symbol });
                }
            }
        }
    }

    return symbolsEmptied;
}

export {
    addClientToSymbol,
    removeClientFromSymbol,
    removeClientFromAllSymbol,
    getClientsForSymbol,
    getAllSymbols
};