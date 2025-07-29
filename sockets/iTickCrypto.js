import WebSocket from "ws";
import { startPing, stopPing } from "../utils/ping.js";
import { ITICK_CRYPTO_WS_URL, ITICK_WS_AUTH_TOKEN } from "../config/envConfig.js";
import { getAllSymbols, getClientsForSymbol } from "../utils/subscriptionManager.js";

let cryptoSocket = null;
let isCryptoReady = false;

function connectToCrypto() {
    cryptoSocket = new WebSocket(ITICK_CRYPTO_WS_URL, {
        headers: { token: ITICK_WS_AUTH_TOKEN }
    });

    cryptoSocket.on('open', () => {
        console.log('✅ Connected to Crypto WebSocket');
        isCryptoReady = true;
        startPing(cryptoSocket);
        subscribeToAllSymbols();
    });

    cryptoSocket.on('message', (data) => {
        try {
            const raw = typeof data === 'string' ? data : data.toString();
            const message = JSON.parse(raw);
            if (message.resAc === 'ping' || message.resAc === 'pong') return;
            const symbol = message.data?.s;
            if (symbol) {
                const clients = getClientsForSymbol('crypto', symbol);
                for (const client of clients) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(message));
                    }
                }
            }
        } catch (err) {
            console.error("❗ Error parsing or forwarding crypto message:", err.message);
        }
    });

    cryptoSocket.on('close', () => {
        console.log('❌ Crypto WebSocket closed. Reconnecting...');
        setTimeout(connectToCrypto, 5000);
    });
}

function subscribeSymbol(symbol) {
    if (cryptoSocket && cryptoSocket.readyState === WebSocket.OPEN) {
        cryptoSocket.send(JSON.stringify({
            ac: 'subscribe',
            params: `${symbol}$gb`,
            types: 'quote'
        }));
    }
}

function subscribeToAllSymbols() {
    const symbols = getAllSymbols('crypto');
    if (symbols.length > 0) {
        const formattedSymbols = symbols.map(symbol => `${symbol}$gb`).join(',');
        const message = {
            ac: 'subscribe',
            params: formattedSymbols,
            types: 'quote'
        };
        if (cryptoSocket && cryptoSocket.readyState === WebSocket.OPEN) {
            cryptoSocket.send(JSON.stringify(message));
        }
    }
}

export {
    connectToCrypto,
    subscribeSymbol,
    subscribeToAllSymbols
}; 