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
import positionCheckService from './services/positionCheckService.js';
import pendingOrderService from './services/pendingOrderService.js';
import priceCacheService from './services/priceCacheService.js';
import accountMetricsService from './services/accountMetricsService.js';
import freeMarginMonitorService from './services/freeMarginMonitorService.js';
import instrumentCacheService from './services/instrumentCacheService.js';

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
import ordersRouter from './http/orders.js';
import positionsRouter from './http/positions.js';
import tradesRouter from './http/trades.js';
import tradingAccountsRouter from './http/tradingAccounts.js';
import instrumentsRouter from './http/instruments.js';

// Apply routes to app
app.use('/http', candlestickRouter);
app.use('/http', quoteRouter);
app.use('/http', tradingCredentialsRouter);
app.use('/', ordersRouter);
app.use('/', positionsRouter);
app.use('/', tradesRouter);
app.use('/', tradingAccountsRouter);
app.use('/', instrumentsRouter);

// Graceful shutdown handling
let isShuttingDown = false;

async function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`🔄 Received ${signal}, starting graceful shutdown...`);

    // Stop trading monitor services
    try {
        positionCheckService.stop();
        logger.info('✅ Position check service stopped');
        
        pendingOrderService.stop();
        logger.info('✅ Pending order service stopped');
        
        accountMetricsService.stop();
        logger.info('✅ Account metrics service stopped');
        
        freeMarginMonitorService.stop();
        logger.info('✅ Free margin monitor service stopped');
        
        instrumentCacheService.stopAutoRefresh();
        logger.info('✅ Instrument cache service stopped');
    } catch (error) {
        logger.error('❌ Error stopping trading monitor services:', error);
    }

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
        await DatabaseService.initializeDatabase();
        logger.info('✅ Database initialized');

        // Initialize instrument cache
        await instrumentCacheService.initialize();
        logger.info('✅ Instrument cache initialized');

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
            logger.info('🎯 Architecture: Client Subscribe → iTick Data → Check Tracking → Update DB if Tracked → Send to Clients');
            logger.info('📧 New Feature: Trading Credentials Email Service Available');
            
            // Start trading monitor services
            try {
                positionCheckService.start();
                logger.info('✅ Position check service started');
                
                pendingOrderService.start();
                logger.info('✅ Pending order service started');
                
                accountMetricsService.start();
                logger.info('✅ Account metrics service started');
                
                freeMarginMonitorService.start();
                logger.info('✅ Free margin monitor service started');
                
                // Start instrument cache auto-refresh (every 5 minutes)
                instrumentCacheService.startAutoRefresh(300000);
                logger.info('✅ Instrument cache auto-refresh started');
                
                // Start price cache cleanup interval (every 30 seconds)
                setInterval(() => {
                    priceCacheService.clearStalePrices();
                }, 30000);
                logger.info('✅ Price cache cleanup interval started');
                
                logger.info('🎯 Trading monitor services: Position & Order monitoring active (using WebSocket prices)');
                logger.info('📊 Account metrics service: Real-time equity, margin, and free margin updates active');
                logger.info('🛡️ Free margin monitor service: ENABLED - Automatic position closure active');
                logger.info('📈 Instrument cache service: In-memory caching with auto-refresh every 5 minutes');
            } catch (error) {
                logger.error('❌ Failed to start trading monitor services:', error);
            }
        });

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();