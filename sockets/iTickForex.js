import WebSocket from "ws";
import { startPing, stopPing } from "../utils/ping.js";
import { ITICK_FOREX_WS_URL, ITICK_WS_AUTH_TOKEN } from "../config/envConfig.js";
import { getAllSymbols, getClientsForSymbol } from "../utils/subscriptionManager.js";

let forexSocket = null;
let isForexReady = false;

function connectToForex() {
    forexSocket = new WebSocket(ITICK_FOREX_WS_URL, {
        headers: { token: ITICK_WS_AUTH_TOKEN }
    });

    forexSocket.on('open', () => {
        console.log('✅ Connected to Forex WebSocket');
        isForexReady = true;
        startPing(forexSocket);
        subscribeToAllSymbols();
    });

    forexSocket.on('message', (data) => {
        try {
            const raw = typeof data === 'string' ? data : data.toString();
            const message = JSON.parse(raw);
            if (message.resAc === 'ping' || message.resAc === 'pong') return;
            const symbol = message.data?.s;
            if (symbol) {
                const clients = getClientsForSymbol('forex', symbol);
                for (const client of clients) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(message));
                    }
                }
            }
        } catch (err) {
            console.error("❗ Error parsing or forwarding forex message:", err.message);
        }
    });

    forexSocket.on('close', () => {
        console.log('❌ Forex WebSocket closed. Reconnecting...');
        setTimeout(connectToForex, 5000);
    });
}

function subscribeSymbol(symbol) {
    if (forexSocket && forexSocket.readyState === WebSocket.OPEN) {
        forexSocket.send(JSON.stringify({
            ac: 'subscribe',
            params: `${symbol}$gb`,
            types: 'quote'
        }));
    }
}

function subscribeToAllSymbols() {
    const symbols = getAllSymbols('forex');
    if (symbols.length > 0) {
        const formattedSymbols = symbols.map(symbol => `${symbol}$gb`).join(',');
        const message = {
            ac: 'subscribe',
            params: formattedSymbols,
            types: 'quote'
        };
        if (forexSocket && forexSocket.readyState === WebSocket.OPEN) {
            forexSocket.send(JSON.stringify(message));
        }
    }
}

export {
    connectToForex,
    subscribeSymbol,
    subscribeToAllSymbols
}; 