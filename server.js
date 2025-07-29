// server.js
import http from 'http';
import { app, startFlutterWebSocket } from './sockets/flutterClient.js';
import { connectToForex } from './sockets/iTickForex.js';
import { connectToCrypto } from './sockets/iTickCrypto.js';
import { connectToIndices } from './sockets/iTickIndices.js';

// Create HTTP server with Express app
const server = http.createServer(app);

// Start all services
connectToForex();
// connectToCrypto();
// connectToIndices();
startFlutterWebSocket(server);

// Start the server
server.listen(3000, () => {
    console.log('HTTP and WebSocket server running on port 3000');
});