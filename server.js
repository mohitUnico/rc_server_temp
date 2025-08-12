// server.js
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { Logger } from './utils/logger.js';
import { DatabaseService } from './services/databaseService.js';
import { startFlutterWebSocket } from './sockets/flutterClient.js';

// Create logger instance
const logger = new Logger('Server');

// Import WebSocket connections
import { connectToForex } from './sockets/iTickForex.js';
// import { connectToCrypto } from './sockets/iTickCrypto.js';
// import { connectToIndices } from './sockets/iTickIndices.js';

// Import HTTP routers
import candlestickRouter from './http/candlestick.js';
import quoteRouter from './http/quote.js';
import symbolRouter from './http/symbols.js';

const app = express();
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/http', candlestickRouter);
app.use('/http', quoteRouter);
app.use('/http', symbolRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Start services
async function startServices() {
    try {
        // Initialize database first
        logger.info('🔧 Initializing database...');
        await DatabaseService.initializeDatabase();
        logger.info('✅ Database initialized successfully');

        // Start Flutter WebSocket server
        startFlutterWebSocket(server);
        logger.info('✅ Flutter WebSocket server started');

        // Then start WebSocket connections
        await connectToForex();
        // await connectToCrypto();
        // await connectToIndices();
        logger.info('✅ All WebSocket services started');
    } catch (error) {
        logger.error('❌ Failed to start services:', error);
        process.exit(1);
    }
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    startServices();
});

// Improved graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal) {
    if (isShuttingDown) {
        logger.info('🔄 Shutdown already in progress...');
        return;
    }

    isShuttingDown = true;
    logger.info(`🛑 ${signal} received, shutting down gracefully...`);

    try {
        // Close HTTP server
        server.close(() => {
            logger.info('✅ HTTP server closed');
        });

        // Force close after 5 seconds if graceful shutdown fails
        setTimeout(() => {
            logger.warn('⚠️ Force closing server...');
            process.exit(1);
        }, 5000);

        // Exit process
        process.exit(0);

    } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
}

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});