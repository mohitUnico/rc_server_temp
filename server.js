// server.js
import http from 'http';
import { app, startFlutterWebSocket } from './sockets/flutterClient.js';
import { connectToForex } from './sockets/iTickForex.js';
import { connectToCrypto } from './sockets/iTickCrypto.js';
import { connectToIndices } from './sockets/iTickIndices.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('Server');

// Create HTTP server with Express app
const server = http.createServer(app);

// Start all services
async function startServices() {
    try {
        // await connectToForex();
        await connectToCrypto();
        // await connectToIndices();
        logger.info('✅ All WebSocket services started');
    } catch (error) {
        logger.error('❌ Failed to start WebSocket services:', error);
    }
}

startServices();
startFlutterWebSocket(server);

// Start the server
server.listen(3000, () => {
    logger.info('🚀 HTTP and WebSocket server running on port 3000');
});