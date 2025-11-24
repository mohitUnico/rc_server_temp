import { Logger } from '../utils/logger.js';
import { getAllForexSymbols } from '../config/forexSymbols.js';

export class ForexSubscriptionService {
    constructor() {
        this.logger = new Logger('ForexSubscriptionService');
        this.isSubscribed = false;
        this.allSymbols = [];
        this.periodicTimer = null;
        this.forexManager = null;

        // Initialize forex symbols (TEMPORARY: Limited to 3 symbols for testing)
        this.initializeForexSymbols();
    }

    initializeForexSymbols() {
        // TEMPORARY: Limit to 3 symbols for testing
        // TODO: Revert this change to use all symbols
        // Original code: this.allSymbols = getAllForexSymbols();
        this.allSymbols = ['XAUUSD', 'EURUSD', 'USDJPY']; // Only 3 symbols for testing (including XAUUSD)

        // Get all 80 forex symbols from configuration (COMMENTED OUT - TEMPORARY)
        // this.allSymbols = getAllForexSymbols();

        this.logger.info(`Initialized ${this.allSymbols.length} forex symbols for single subscription (TEMPORARY: Limited to 3 symbols)`);
    }

    async subscribeToAllSymbols(forexManager) {
        if (!forexManager) {
            this.logger.error('Forex manager not provided for subscription');
            return false;
        }

        if (this.isSubscribed) {
            this.logger.info('Already subscribed to all forex symbols');
            return true;
        }

        try {
            this.logger.info('Starting subscription to all forex symbols...');

            // Store forex manager reference for periodic subscriptions
            this.forexManager = forexManager;

            // Send initial subscription message
            await this.sendSubscriptionMessage();

            this.isSubscribed = true;
            this.logger.info(`Successfully subscribed to all ${this.allSymbols.length} forex symbols in a single message`);

            // Start periodic subscription every 1 minute
            this.startPeriodicSubscription();

            return true;

        } catch (error) {
            this.logger.error('Failed to subscribe to all forex symbols:', error);
            return false;
        }
    }



    async unsubscribeFromAllSymbols(forexManager) {
        if (!forexManager) {
            this.logger.error('Forex manager not provided for unsubscription');
            return false;
        }

        if (!this.isSubscribed) {
            this.logger.info('Not currently subscribed to any symbols');
            return true;
        }

        try {
            this.logger.info('Starting unsubscription from all forex symbols...');

            // Stop periodic subscription
            this.stopPeriodicSubscription();

            // Create the unsubscription message with all symbols
            const params = this.allSymbols.map(symbol => `${symbol}$gb`).join(',');
            const message = {
                ac: 'unsubscribe',
                params: params,
                types: 'quote'
            };

            // Send unsubscription message
            forexManager.socket.send(JSON.stringify(message));

            this.isSubscribed = false;
            this.forexManager = null;
            this.logger.info(`Successfully unsubscribed from all ${this.allSymbols.length} forex symbols in a single message`);
            return true;

        } catch (error) {
            this.logger.error('Failed to unsubscribe from all forex symbols:', error);
            return false;
        }
    }

    sendSubscriptionMessage() {
        if (!this.forexManager || !this.forexManager.socket) {
            this.logger.error('Forex manager or socket not available for subscription');
            return false;
        }

        try {
            // Create the subscription message with all symbols
            const params = this.allSymbols.map(symbol => `${symbol}$gb`).join(',');
            const message = {
                ac: 'subscribe',
                params: params,
                types: 'quote'
            };

            // Send subscription message
            this.forexManager.socket.send(JSON.stringify(message));
            this.logger.debug(`Sent periodic subscription for ${this.allSymbols.length} symbols`);
            return true;

        } catch (error) {
            this.logger.error('Failed to send subscription message:', error);
            return false;
        }
    }

    startPeriodicSubscription() {
        // Clear any existing timer
        this.stopPeriodicSubscription();

        // Set up periodic subscription every 1 minute (60000 ms)
        this.periodicTimer = setInterval(() => {
            if (this.isSubscribed && this.forexManager) {
                this.logger.info('Sending periodic subscription to maintain connection...');
                this.sendSubscriptionMessage();
            }
        }, 60000); // 1 minute

        this.logger.info('Started periodic subscription every 1 minute');
    }

    stopPeriodicSubscription() {
        if (this.periodicTimer) {
            clearInterval(this.periodicTimer);
            this.periodicTimer = null;
            this.logger.info('Stopped periodic subscription');
        }
    }

    getSubscriptionStatus() {
        return {
            isSubscribed: this.isSubscribed,
            totalSymbols: this.allSymbols.length
        };
    }

    getAllSymbols() {
        return this.allSymbols;
    }

    reset() {
        this.stopPeriodicSubscription();
        this.isSubscribed = false;
        this.forexManager = null;
        this.logger.info('Forex subscription service reset');
    }
}

// Export singleton instance
const forexSubscriptionService = new ForexSubscriptionService();
export default forexSubscriptionService;
