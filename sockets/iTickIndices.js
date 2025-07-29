import WebSocket from "ws";
import { startPing, stopPing } from "../utils/ping.js";
import { ITICK_INDICES_WS_URL, ITICK_WS_AUTH_TOKEN } from "../config/envConfig.js";
import { getAllSymbols, getClientsForSymbol } from "../utils/subscriptionManager.js";

let indicesSocket = null;
let isIndicesReady = false;

function connectToIndices() {
    indicesSocket = new WebSocket(ITICK_INDICES_WS_URL, {
        headers: { token: ITICK_WS_AUTH_TOKEN }
    });

    indicesSocket.on('open', () => {
        console.log('✅ Connected to Indices WebSocket');
        isIndicesReady = true;
        startPing(indicesSocket);
        subscribeToAllSymbols();
    });

    indicesSocket.on('message', (data) => {
        try {
            const raw = typeof data === 'string' ? data : data.toString();
            const message = JSON.parse(raw);
            console.log("📩 Received from iTick:", message);
            if (message.resAc === 'ping' || message.resAc === 'pong') return;
            const symbol = message.data?.s;
            if (symbol) {
                const clients = getClientsForSymbol('indices', symbol);
                for (const client of clients) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(message));
                    }
                }
            }
        } catch (err) {
            console.error("❗ Error parsing or forwarding indices message:", err.message);
        }
    });

    indicesSocket.on('close', () => {
        console.log('❌ Indices WebSocket closed. Reconnecting...');
        setTimeout(connectToIndices, 5000);
    });
}

function subscribeSymbol(symbol) {
    if (indicesSocket && indicesSocket.readyState === WebSocket.OPEN) {
        indicesSocket.send(JSON.stringify({
            ac: 'subscribe',
            params: `${symbol}$gb`,
            types: 'quote'
        }));
    }
}

function subscribeToAllSymbols() {
    const symbols = getAllSymbols('indices');
    if (symbols.length > 0) {
        const formattedSymbols = symbols.map(symbol => `${symbol}$gb`).join(',');
        const message = {
            ac: 'subscribe',
            params: formattedSymbols,
            types: 'quote'
        };
        if (indicesSocket && indicesSocket.readyState === WebSocket.OPEN) {
            indicesSocket.send(JSON.stringify(message));
        }
    }
}

export {
    connectToIndices,
    subscribeSymbol,
    subscribeToAllSymbols
}; 