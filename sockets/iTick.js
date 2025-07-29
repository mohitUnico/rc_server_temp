import WebSocket from "ws";
import { startPing, stopPing } from "../utils/ping.js";
import { ITICK_CRYPTO_WS_URL, ITICK_FOREX_WS_URL, ITICK_INDICES_WS_URL, ITICK_WS_AUTH_TOKEN } from "../config/envConfig.js";
import { getAllSymbols, getClientsForSymbol } from "../utils/subscriptionManager.js";
let iTickSocket = null;
let isItickReady = false;
function connectToITick() {
    iTickSocket = new WebSocket(ITICK_FOREX_WS_URL, {
        headers: {
            token: ITICK_WS_AUTH_TOKEN
        }
    });

    iTickSocket.on('open', () => {
        console.log('✅ Connected to iTick WebSocket');
        isItickReady = true;
        startPing(iTickSocket);
        subscribeToAllSymbols();
    });

    iTickSocket.on('message', (data) => {
        try {
            const raw = typeof data === 'string' ? data : data.toString();
            const message = JSON.parse(raw);
            console.log("📩 Received from iTick:", message);

            // Skip ping/pong types (if present)
            if (message.resAc === 'ping' || message.resAc === 'pong') return;

            const symbol = message.data?.s;
            if (symbol) {
                const clients = getClientsForSymbol(symbol);
                // console.log(`📡 Forwarding update for ${symbol} to ${clients.length} clients`);
                for (const client of clients) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(message));
                    } else {
                        console.warn("⚠️ Client not open, skipping...");
                    }
                }
            } else {
                // console.warn("⚠️ No symbol (data.s) found in message");
            }
        } catch (err) {
            console.error("❗ Error parsing or forwarding message:", err.message);
        }
    });

    iTickSocket.on('close', () => {
        console.log('❌ iTick WebSocket closed. Reconnecting...');
        setTimeout(connectToITick, 5000);
    });

}

function subscribeSymbol(symbol) {
    if (iTickSocket && iTickSocket.readyState === WebSocket.OPEN) {
        iTickSocket.send(JSON.stringify({
            ac: 'subscribe',
            params: `${symbol}$gb`,
            types: 'quote'
        }))
    }
}

function subscribeToAllSymbols() {
    const symbols = getAllSymbols();
    console.log(`📥 Retrieved all symbols: ${JSON.stringify(symbols)}`);

    if (symbols.length > 0) {
        const formattedSymbols = symbols.map(symbol => `${symbol}$gb`).join(',');
        const message = {
            ac: 'subscribe',
            params: formattedSymbols,
            types: 'quote'
        };

        console.log(`📤 Sending subscription request to iTick: ${JSON.stringify(message)}`);

        if (iTickSocket && iTickSocket.readyState === WebSocket.OPEN) {
            iTickSocket.send(JSON.stringify(message));
            console.log("message for multiple subscription sent successfully");

        } else {
            console.warn('⚠️ iTick socket not open, could not send subscription request.');
        }
    } else {
        console.warn('⚠️ No symbols found to subscribe.');
    }
}

export {
    connectToITick,
    subscribeSymbol,
    subscribeToAllSymbols
};