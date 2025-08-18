import fetch from 'node-fetch';
import { ITICK_WS_AUTH_TOKEN } from '../config/envConfig.js';
import { Logger } from '../utils/logger.js';
import InstrumentRepository from '../repositories/InstrumentRepository.js';

const logger = new Logger('PriceService');
const instrumentRepository = new InstrumentRepository();

/**
 * Service for fetching current market prices
 */
class PriceService {
  /**
   * Get current price for an instrument by its ID
   * @param {number} instrumentId - The instrument ID
   * @returns {Promise<number>} The current price
   */
  static async getCurrentPrice(instrumentId) {
    try {
      // Get instrument details to find the symbol and category
      const instrument = await instrumentRepository.findInstrumentById(instrumentId);
      if (!instrument) {
        throw new Error(`Instrument with ID ${instrumentId} not found`);
      }

      const { symbol } = instrument;
      
      // Auto-detect category based on symbol pattern since database category is null
      let type;
      if (symbol.includes('USDT') || symbol.includes('BTC') || symbol.includes('ETH')) {
        // Crypto pairs
        type = 'crypto';
      } else if (symbol.includes('XAU') || symbol.includes('XAG') || symbol.includes('XPD') || symbol.includes('XPT')) {
        // Metals
        type = 'forex'; // Metals are typically handled by forex API
      } else if (symbol.length === 6 && symbol.match(/^[A-Z]{6}$/)) {
        // Forex pairs (6 letters like EURUSD, GBPUSD, etc.)
        type = 'forex';
      } else {
        // Default to forex for other cases
        type = 'forex';
      }
      
      logger.info(`Auto-detected category for ${symbol}: ${type}`);

      // Build the quote API URL
      const baseUrl = `https://api.itick.org/${type}/quote`;
      const region = type === 'crypto' ? 'ba' : 'gb';
      const url = `${baseUrl}?code=${symbol}&region=${region}`;

      logger.info(`Fetching price for ${symbol} (${type}) from: ${url}`);

      const response = await fetch(url, {
        headers: { token: ITICK_WS_AUTH_TOKEN }
      });

      if (!response.ok) {
        throw new Error(`Quote API responded with status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Check if the response has the expected structure
      if (responseData.code !== 0 || !responseData.data) {
        throw new Error(`API error: ${responseData.msg || 'No data returned'}`);
      }
      
      const data = responseData.data;
      
      // Extract the price from the response
      // Based on the API response, the current price is in the 'ld' field (last data)
      let price;
      if (data.ld !== undefined) {
        // 'ld' appears to be the last/current price
        price = data.ld;
      } else if (data.price !== undefined) {
        price = data.price;
      } else if (data.bid !== undefined && data.ask !== undefined) {
        // Use mid price if bid/ask are available
        price = (parseFloat(data.bid) + parseFloat(data.ask)) / 2;
      } else if (data.last !== undefined) {
        price = data.last;
      } else if (data.close !== undefined) {
        price = data.close;
      } else if (data.value !== undefined) {
        price = data.value;
      } else if (data.rate !== undefined) {
        price = data.rate;
      } else {
        logger.error(`Available fields in data: ${Object.keys(data).join(', ')}`);
        throw new Error('Unable to extract price from quote response');
      }

      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        throw new Error(`Invalid price received: ${price}`);
      }

      logger.info(`Current price for ${symbol}: ${numericPrice}`);
      return numericPrice;

    } catch (error) {
      logger.error(`Failed to get current price for instrument ${instrumentId}:`, error);
      throw new Error(`Failed to fetch current price: ${error.message}`);
    }
  }

  /**
   * Get current price for multiple instruments
   * @param {number[]} instrumentIds - Array of instrument IDs
   * @returns {Promise<Object>} Object with instrumentId as key and price as value
   */
  static async getCurrentPrices(instrumentIds) {
    const prices = {};
    const promises = instrumentIds.map(async (instrumentId) => {
      try {
        const price = await this.getCurrentPrice(instrumentId);
        prices[instrumentId] = price;
      } catch (error) {
        logger.error(`Failed to get price for instrument ${instrumentId}:`, error);
        prices[instrumentId] = null;
      }
    });

    await Promise.all(promises);
    return prices;
  }
}

export default PriceService;
