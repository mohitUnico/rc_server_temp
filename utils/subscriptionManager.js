const symbolClientMap = new Map();

function addClientToSymbol(symbol, client) {
    if (!symbolClientMap.has(symbol)) {
        symbolClientMap.set(symbol, new Set());
    }
    symbolClientMap.get(symbol).add(client);

    const clientsSet = symbolClientMap.get(symbol);
    console.log(`➕ Client added to symbol: ${symbol}`);
    console.log(`📊 Total clients for ${symbol}: ${clientsSet.size}`);

    // Log a unique ID or status for each client (if available)
    let index = 1;
    for (const c of clientsSet) {
        console.log(`  Client ${index++}: readyState = ${c.readyState}`);
    }
}

function removeClientFromSymbol(symbol, client) {
    const clients = symbolClientMap.get(symbol);

    if (!clients) return;

    clients.delete(client);

    if (clients.size == 0) {
        symbolClientMap.delete(symbol);
        return true;
    }

    return false;
}

function getClientsForSymbol(symbol) {
    return symbolClientMap.get(symbol) || new Set();
};

function getAllSymbols() {
    return Array.from(symbolClientMap.keys());
};

function removeClientFromAllSymbol(client) {
    for (const [symbol, clients] of symbolClientMap.entries()) {
        clients.delete(client);
        if (clients.size == 0) {
            symbolClientMap.delete(symbol);
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