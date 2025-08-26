import { Logger } from '../utils/logger.js';
import { getAllForexSymbols } from '../config/forexSymbols.js';

export class ForexSubscriptionService {
    constructor() {
        this.logger = new Logger('ForexSubscriptionService');
        this.isSubscribed = false;
        this.subscriptionBatches = [];
        this.currentBatchIndex = 0;

        // Initialize all 80 forex symbols
        this.initializeForexSymbols();
    }

    initializeForexSymbols() {
        // Get all 80 forex symbols from configuration
        const allSymbols = getAllForexSymbols();

        // Create batches of 8 symbols each (total 10 batches)
        for (let i = 0; i < allSymbols.length; i += 8) {
            const batch = allSymbols.slice(i, i + 8);
            this.subscriptionBatches.push(batch);
        }

        this.logger.info(`Initialized ${allSymbols.length} forex symbols in ${this.subscriptionBatches.length} batches`);
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

            // Subscribe to all batches with a small delay between each
            for (let i = 0; i < this.subscriptionBatches.length; i++) {
                const batch = this.subscriptionBatches[i];
                await this.subscribeBatch(forexManager, batch, i + 1);

                // Add delay between batches to avoid overwhelming the server
                if (i < this.subscriptionBatches.length - 1) {
                    await this.delay(1000); // 1 second delay between batches
                }
            }

            this.isSubscribed = true;
            this.logger.info('Successfully subscribed to all forex symbols');
            return true;

        } catch (error) {
            this.logger.error('Failed to subscribe to all forex symbols:', error);
            return false;
        }
    }

    async subscribeBatch(forexManager, symbols, batchNumber) {
        try {
            // Create the subscription message with all symbols in the batch
            const params = symbols.map(symbol => `${symbol}$gb`).join(',');
            const message = {
                ac: 'subscribe',
                params: params,
                types: 'quote'
            };

            // Send subscription message
            forexManager.socket.send(JSON.stringify(message));

            this.logger.info(`Batch ${batchNumber}/${this.subscriptionBatches.length}: Subscribed to ${symbols.length} symbols`);
            this.logger.debug(`Batch ${batchNumber} symbols: ${symbols.join(', ')}`);

        } catch (error) {
            this.logger.error(`Failed to subscribe batch ${batchNumber}:`, error);
            throw error;
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

            // Unsubscribe from all batches
            for (let i = 0; i < this.subscriptionBatches.length; i++) {
                const batch = this.subscriptionBatches[i];
                await this.unsubscribeBatch(forexManager, batch, i + 1);

                // Add delay between batches
                if (i < this.subscriptionBatches.length - 1) {
                    await this.delay(500); // 0.5 second delay between batches
                }
            }

            this.isSubscribed = false;
            this.logger.info('Successfully unsubscribed from all forex symbols');
            return true;

        } catch (error) {
            this.logger.error('Failed to unsubscribe from all forex symbols:', error);
            return false;
        }
    }

    async unsubscribeBatch(forexManager, symbols, batchNumber) {
        try {
            // Create the unsubscription message
            const params = symbols.map(symbol => `${symbol}$gb`).join(',');
            const message = {
                ac: 'unsubscribe',
                params: params,
                types: 'quote'
            };

            // Send unsubscription message
            forexManager.socket.send(JSON.stringify(message));

            this.logger.info(`Batch ${batchNumber}/${this.subscriptionBatches.length}: Unsubscribed from ${symbols.length} symbols`);

        } catch (error) {
            this.logger.error(`Failed to unsubscribe batch ${batchNumber}:`, error);
            throw error;
        }
    }

    getSubscriptionStatus() {
        return {
            isSubscribed: this.isSubscribed,
            totalSymbols: this.subscriptionBatches.flat().length,
            totalBatches: this.subscriptionBatches.length,
            currentBatchIndex: this.currentBatchIndex
        };
    }

    getAllSymbols() {
        return this.subscriptionBatches.flat();
    }

    getSymbolsByBatch(batchIndex) {
        if (batchIndex >= 0 && batchIndex < this.subscriptionBatches.length) {
            return this.subscriptionBatches[batchIndex];
        }
        return [];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reset() {
        this.isSubscribed = false;
        this.currentBatchIndex = 0;
        this.logger.info('Forex subscription service reset');
    }
}

// Export singleton instance
const forexSubscriptionService = new ForexSubscriptionService();
export default forexSubscriptionService;
