import { WebSocketManager } from '../websocket/WebSocketManager.js';
import { WebSocketConfig } from '../config/websocket.js';
import { getAllSymbols, getClientsForSymbol } from "../utils/subscriptionManager.js";

let cryptoManager = null;

function connectToCrypto() {
    if (!cryptoManager) {
        cryptoManager = new WebSocketManager('crypto', WebSocketConfig.crypto);

        // Set up message handler
        cryptoManager.onMessage((message, assetType) => {
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

    return cryptoManager.connect();
}

function subscribeSymbol(symbol) {
    if (cryptoManager && cryptoManager.isConnected()) {
        cryptoManager.subscribe(symbol);
    }
}

function subscribeToAllSymbols() {
    const symbols = getAllSymbols('crypto');
    symbols.forEach(symbol => {
        subscribeSymbol(symbol);
    });
}

export { connectToCrypto, subscribeSymbol, subscribeToAllSymbols }; 