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
    map.get(symbol).add(client);
    const clientsSet = map.get(symbol);
    console.log(`➕ Client added to ${assetType} symbol: ${symbol}`);
    console.log(`📊 Total clients for ${symbol}: ${clientsSet.size}`);
    let index = 1;
    for (const c of clientsSet) {
        console.log(`  Client ${index++}: readyState = ${c.readyState}`);
    }
}

function removeClientFromSymbol(assetType, symbol, client) {
    const map = getMapForAssetType(assetType);
    const clients = map.get(symbol);
    if (!clients) return;
    clients.delete(client);
    if (clients.size == 0) {
        map.delete(symbol);
        return true;
    }
    return false;
}

function getClientsForSymbol(assetType, symbol) {
    const map = getMapForAssetType(assetType);
    return map.get(symbol) || new Set();
}

function getAllSymbols(assetType) {
    const map = getMapForAssetType(assetType);
    return Array.from(map.keys());
}

function removeClientFromAllSymbol(assetType, client) {
    const map = getMapForAssetType(assetType);
    for (const [symbol, clients] of map.entries()) {
        clients.delete(client);
        if (clients.size == 0) {
            map.delete(symbol);
        }
    }
}

export {
    addClientToSymbol,
    removeClientFromSymbol,
    removeClientFromAllSymbol,
    getClientsForSymbol,
    getAllSymbols
};