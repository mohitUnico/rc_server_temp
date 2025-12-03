import { Logger } from './logger.js';
import priceCacheService from '../services/priceCacheService.js';

const logger = new Logger('FxConversion');

/**
 * Build a simple symbol -> price map for forex quotes
 * based on the in-memory price cache.
 */
export function getForexQuotes() {
  try {
    const forexPrices = priceCacheService.getAllPrices('forex') || {};
    const quotes = {};

    for (const [symbol, priceData] of Object.entries(forexPrices)) {
      if (!priceData || typeof priceData.price !== 'number') {
        continue;
      }
      const numericPrice = Number(priceData.price);
      if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        continue;
      }
      quotes[symbol.toUpperCase()] = numericPrice;
    }

    return quotes;
  } catch (error) {
    logger.error('Error building forex quotes map from cache:', error);
    return {};
  }
}

/**
 * Internal helper that implements conversion logic using a provided quotes map.
 * quotes: { 'EURUSD': 1.0850, 'USDJPY': 155.32, ... }
 */
function getConversionRateInternal(from, to, quotes) {
  const baseFrom = (from || '').trim().toUpperCase();
  const baseTo = (to || '').trim().toUpperCase();

  if (!baseFrom || !baseTo) {
    throw new Error(`Invalid currencies for conversion: from='${from}' to='${to}'`);
  }

  if (baseFrom === baseTo) {
    return 1;
  }

  const direct = `${baseFrom}${baseTo}`;
  const inverse = `${baseTo}${baseFrom}`;

  if (Object.prototype.hasOwnProperty.call(quotes, direct)) {
    return quotes[direct];
  }

  if (Object.prototype.hasOwnProperty.call(quotes, inverse)) {
    const rate = quotes[inverse];
    if (rate && Number.isFinite(rate) && rate > 0) {
      return 1 / rate;
    }
  }

  // Fallback via USD bridge: from -> USD -> to
  if (baseFrom !== 'USD' && baseTo !== 'USD') {
    const r1 = getConversionRateInternal(baseFrom, 'USD', quotes);
    const r2 = getConversionRateInternal('USD', baseTo, quotes);
    return r1 * r2;
  }

  throw new Error(`No FX conversion path from ${baseFrom} to ${baseTo}`);
}

/**
 * Public helper: get FX conversion rate from one currency to another using
 * the latest cached forex quotes.
 *
 * Example:
 *   const R = getConversionRate('JPY', 'USD'); // uses USDJPY or JPYUSD quotes
 */
export function getConversionRate(from, to, quotesOverride = null) {
  const quotes = quotesOverride || getForexQuotes();

  try {
    return getConversionRateInternal(from, to, quotes);
  } catch (error) {
    logger.error(
      `Failed to get conversion rate from ${from} to ${to}: ${error.message}`
    );
    throw error;
  }
}


