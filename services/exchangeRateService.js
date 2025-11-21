import fetch from 'node-fetch';
import { EXCHANGE_RATE_API_KEY } from '../config/envConfig.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('ExchangeRateService');
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

const SUPPORTED_CURRENCIES = new Set([
  'AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN','BAM','BBD','BDT','BGN','BHD','BIF','BMD','BND','BOB','BRL','BSD','BTN','BWP','BYN','BZD','CAD','CDF','CHF','CLP','CNY','COP','CRC','CUP','CVE','CZK','DJF','DKK','DOP','DZD','EGP','ERN','ETB','EUR','FJD','FKP','FOK','GBP','GEL','GGP','GHS','GIP','GMD','GNF','GTQ','GYD','HKD','HNL','HRK','HTG','HUF','IDR','ILS','IMP','INR','IQD','IRR','ISK','JEP','JMD','JOD','JPY','KES','KGS','KHR','KID','KMF','KRW','KWD','KYD','KZT','LAK','LBP','LKR','LRD','LSL','LYD','MAD','MDL','MGA','MKD','MMK','MNT','MOP','MRU','MUR','MVR','MWK','MXN','MYR','MZN','NAD','NGN','NIO','NOK','NPR','NZD','OMR','PAB','PEN','PGK','PHP','PKR','PLN','PYG','QAR','RON','RSD','RUB','RWF','SAR','SBD','SCR','SDG','SEK','SGD','SHP','SLE','SOS','SRD','SSP','STN','SYP','SZL','THB','TJS','TMT','TND','TOP','TRY','TTD','TVD','TWD','TZS','UAH','UGX','USD','UYU','UZS','VES','VND','VUV','WST','XAF','XCD','XDR','XOF','XPF','YER','ZAR','ZMW','ZWL'
]);

class ExchangeRateService {
  constructor() {
    if (!EXCHANGE_RATE_API_KEY) {
      throw new Error('Missing EXCHANGE_RATE_API_KEY environment variable');
    }
  }

  sanitizeCurrency(code) {
    return (code || '').trim().toUpperCase();
  }

  isCurrencySupported(code) {
    const normalized = this.sanitizeCurrency(code);
    return SUPPORTED_CURRENCIES.has(normalized);
  }

  buildPairUrl(baseCurrency, targetCurrency, amount) {
    const normalizedBase = this.sanitizeCurrency(baseCurrency);
    const normalizedTarget = this.sanitizeCurrency(targetCurrency);

    if (!this.isCurrencySupported(normalizedBase) || !this.isCurrencySupported(normalizedTarget)) {
      throw new Error(`Unsupported currency pair: ${normalizedBase}/${normalizedTarget}`);
    }

    const amountSegment = typeof amount === 'number' ? `/${amount}` : '';
    return `${BASE_URL}/${EXCHANGE_RATE_API_KEY}/pair/${normalizedBase}/${normalizedTarget}${amountSegment}`;
  }

  async fetchPairRate(baseCurrency, targetCurrency, amount) {
    const url = this.buildPairUrl(baseCurrency, targetCurrency, amount);
    logger.info(`Fetching exchange rate for ${baseCurrency}/${targetCurrency}`);

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Exchange Rate API error: HTTP ${response.status} - ${body}`);
    }

    const data = await response.json();
    if (data.result !== 'success') {
      throw new Error(`Exchange Rate API responded with error: ${data['error-type'] || 'unknown-error'}`);
    }

    return {
      conversionRate: data.conversion_rate,
      conversionResult: data.conversion_result ?? null,
      base: data.base_code,
      target: data.target_code,
      raw: data
    };
  }

  async getConversionRate(baseCurrency, targetCurrency) {
    const result = await this.fetchPairRate(baseCurrency, targetCurrency);
    return result.conversionRate;
  }
}

const exchangeRateService = new ExchangeRateService();

export { exchangeRateService as default, SUPPORTED_CURRENCIES };


