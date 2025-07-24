import WebSocket from 'ws';
let pingInterval;

function startPing(socket) {
    clearInterval(pingInterval);
    pingInterval = setInterval(() => {
        const timestamp = Date.now();
        const pingPayload = {
            ac: 'ping',
            params: timestamp.toString(),
        };
        if (socket && socket.readyState == WebSocket.OPEN) {
            socket.send(JSON.stringify(pingPayload));
        }
    }, 20000)
}

function stopPing() {
    clearInterval(pingInterval);
}

export { startPing, stopPing };