import { WebSocketServer } from "ws";
import { addClientToSymbol, removeClientFromSymbol, removeClientFromAllSymbol } from "../utils/subscriptionManager.js";
import { subscribeSymbol, subscribeToAllSymbols } from "./iTick.js"

function startFlutterWebSocket() {
    const server = new WebSocketServer({ port: 3000 });

    console.log("🚀 Flutter WebSocket server running on ws://localhost:3000");

    server.on('connection', (client) => {
        console.log('🔌 Client connected');
        client.on('message', (msg) => {
            try {
                const data = JSON.parse(msg)
                console.log(`subscribe request from flutter client: ${msg.toString()}`)
                if (data.type === 'subscribe' && data.symbol) {

                    const symbols = data.symbol.split(',');

                    for (const symbol of symbols) {
                        addClientToSymbol(symbol, client);
                    }

                    if (symbols.length > 1) {
                        console.log(`📡 Multiple symbols (${symbols.length}) - subscribing via subscribeToAllSymbols`);
                        subscribeToAllSymbols();
                    } else if (symbols.length === 1) {
                        console.log(`📡 Single symbol - subscribing to ${symbols[0]}`);
                        subscribeSymbol(symbols[0]);
                    }
                }
                if (data.type === 'unsubscribe' && data.symbol) {
                    const symbols = data.symbol.split(',');
                    for (const symbol of symbols) {
                        const isLastClient = removeClientFromSymbol(symbol, client);
                        if (isLastClient) {
                            console.log(`❌ No clients for ${symbol}, removed from map`)
                        }
                    }
                }
            } catch (error) {
                console.error('❗ Invalid message from client', error);
            }
        });
        client.on('close', () => {
            console.log('🔌 Client disconnected');
            removeClientFromAllSymbol(client);
        });
    })

}

export { startFlutterWebSocket };