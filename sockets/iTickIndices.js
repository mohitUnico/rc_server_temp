import { WebSocketManager } from '../websocket/WebSocketManager.js';
import { WebSocketConfig } from '../config/websocket.js';
import { getAllSymbols, getClientsForSymbol } from "../utils/subscriptionManager.js";

let indicesManager = null;

function connectToIndices() {
    if (!indicesManager) {
        indicesManager = new WebSocketManager('indices', WebSocketConfig.indices);

        // Set up message handler
        indicesManager.onMessage((message, assetType) => {
            const symbol = message.data?.s;
            if (!symbol) return;

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

    return indicesManager.connect();
}

function subscribeSymbol(symbol) {
    if (indicesManager && indicesManager.isConnected()) {
        indicesManager.subscribe(symbol);
    }
}

function subscribeToAllSymbols() {
    const symbols = getAllSymbols('indices');
    symbols.forEach(symbol => {
        subscribeSymbol(symbol);
    });
}

export { connectToIndices, subscribeSymbol, subscribeToAllSymbols }; 