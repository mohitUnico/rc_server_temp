import { WebSocketManager } from '../websocket/WebSocketManager.js';
import { WebSocketConfig } from '../config/websocket.js';
import { getAllSymbols, getClientsForSymbol } from "../utils/subscriptionManager.js";

let forexManager = null;

function connectToForex() {
    if (!forexManager) {
        forexManager = new WebSocketManager('forex', WebSocketConfig.forex);

        // Set up message handler
        forexManager.onMessage((message, assetType) => {
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

    return forexManager.connect();
}

function subscribeSymbol(symbol) {
    if (forexManager && forexManager.isConnected()) {
        forexManager.subscribe(symbol);
    }
}

function subscribeToAllSymbols() {
    const symbols = getAllSymbols('forex');
    symbols.forEach(symbol => {
        subscribeSymbol(symbol);
    });
}

export { connectToForex, subscribeSymbol, subscribeToAllSymbols }; 