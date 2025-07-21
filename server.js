const WebSocket = require('ws');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const ITICK_WS_URL = process.env.ITICK_WS_URL;
const ITICK_WS_AUTH_TOKEN = process.env.ITICK_WS_AUTH_TOKEN;

// Setup connection to iTick
let iTickSocket = null;
let isItickReady = false;
const pendingSubscriptions = new Set();
const flutterClients = new Set();
let pingInterval;

function startPing() {
    clearInterval(pingInterval); // Clear any existing interval
    pingInterval = setInterval(() => {
        const timestamp = Date.now();
        const pingPayload = {
            ac: "ping",
            params: timestamp.toString()
        };
        if (iTickSocket && iTickSocket.readyState === WebSocket.OPEN) {
            iTickSocket.send(JSON.stringify(pingPayload));
            // Optional: console.log('⏱ Sent ping to iTick');
        }
    }, 5000); // Ping every 5 seconds
}
function connectToITick() {
    iTickSocket = new WebSocket(ITICK_WS_URL, {
        headers: {
            'token': ITICK_WS_AUTH_TOKEN
        }
    });
    iTickSocket.on('open', () => {
        console.log('✅ Connected to iTick WebSocket');
        isItickReady = true;

        // Start sending heartbeat pings
        startPing();

        // Send all pending subscriptions
        pendingSubscriptions.forEach(symbol => {
            subscribeToItick(symbol);
        });
    });

    iTickSocket.on('message', (data) => {
        const message = JSON.parse(data);
        // console.log("message", message);

        // Filter out non-data messages (like pong, auth confirmations, etc.)
        const isPong = message.resAc === 'pong';
        const isPing = message.resAc === 'ping';
        // const isAuth = message.resAc === 'auth';
        // const isCodeOnly = message.code === 1 && !message.resAc;

        if (!isPong && !isPing) {
            flutterClients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(message));
                }
            });
        }
    });

    iTickSocket.on('close', () => {
        console.log('❌ iTick connection closed. Reconnecting in 3s...');
        isItickReady = false;
        clearInterval(pingInterval); // Stop sending pings
        setTimeout(connectToITick, 3000);
    });

    iTickSocket.on('error', (err) => {
        console.error('⚠️ iTick error:', err.message);
    });
}

function subscribeToItick(symbol) {
    const params = `${symbol}$gb`;

    const subscriptionMsg = {
        ac: 'subscribe',
        params,
        types: 'quote'
    };

    if (isItickReady) {
        iTickSocket.send(JSON.stringify(subscriptionMsg));
    } else {
        pendingSubscriptions.add(symbol);
    }
}

// Flutter-facing WebSocket Server
const flutterWSServer = new WebSocket.Server({ port: 3000 }, () => {
    console.log('🚀 Flutter WebSocket server running on ws://localhost:3000');
});

flutterWSServer.on('connection', (client) => {
    console.log('📲 Flutter client connected');
    flutterClients.add(client);

    client.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);
            if (data.type === 'subscribe' && data.symbol) {
                console.log('🔔 Subscribe request from Flutter:', data.symbol);
                subscribeToItick(data.symbol);
            }
        } catch (err) {
            console.error('❌ Invalid message from Flutter:', msg);
        }
    });

    client.on('close', () => {
        flutterClients.delete(client);
        console.log('❎ Flutter client disconnected');
    });
});

// Start iTick connection
connectToITick();