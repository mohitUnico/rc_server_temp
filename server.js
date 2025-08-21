// server.js
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { startFlutterWebSocket } from './sockets/flutterClient.js';
import { connectToForex } from './sockets/iTickForex.js';
import { connectToCrypto } from './sockets/iTickCrypto.js';
import { connectToIndices } from './sockets/iTickIndices.js';
import { DatabaseService } from './services/databaseService.js';
import { Logger } from './utils/logger.js';

const app = express();
const server = createServer(app);
const logger = new Logger('Server');

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Import HTTP routes
import candlestickRouter from './http/candlestick.js';
import quoteRouter from './http/quote.js';
import tradingCredentialsRouter from './http/tradingCredentials.js';

// Apply routes to app
app.use('/http', candlestickRouter);
app.use('/http', quoteRouter);
app.use('/http', tradingCredentialsRouter);

// Graceful shutdown handling
let isShuttingDown = false;

async function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`🔄 Received ${signal}, starting graceful shutdown...`);

    // Close HTTP server
    server.close(() => {
        logger.info('✅ HTTP server closed');
    });

    // Force exit after 5 seconds if graceful shutdown hangs
    setTimeout(() => {
        logger.error('⏰ Force exit after timeout');
        process.exit(1);
    }, 5000);

    // Exit process
    process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    logger.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Main server startup
async function startServer() {
    try {
        // Initialize database
        // await DatabaseService.initializeDatabase();
        // logger.info('✅ Database initialized');

        // Start WebSocket server for Flutter clients
        startFlutterWebSocket(server);
        logger.info('✅ Flutter WebSocket server started');

        // Connect to iTick API for market data
        logger.info('🔄 Connecting to iTick API...');

        await connectToForex();
        logger.info('✅ Connected to iTick Forex');

        // await connectToCrypto();
        // logger.info('✅ Connected to iTick Crypto');

        // await connectToIndices();
        // logger.info('✅ Connected to iTick Indices');

        // Start HTTP server
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info('🎯 Architecture: Client Subscribe → iTick Data → Forward to Clients');
            logger.info('📧 New Feature: Trading Credentials Email Service Available');
        });

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();