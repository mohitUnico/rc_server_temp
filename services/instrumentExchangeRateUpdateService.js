import { supabase } from '../config/supabase.js';
import exchangeRateService, { SUPPORTED_CURRENCIES } from './exchangeRateService.js';
import instrumentCacheService from './instrumentCacheService.js';
import { Logger } from '../utils/logger.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WEEK_IN_MS = 7 * DAY_IN_MS;

class InstrumentExchangeRateUpdateService {
  constructor() {
    this.logger = new Logger('InstrumentExchangeRateUpdateService');
    this.intervalId = null;
    this.isUpdating = false;
    this.updateIntervalMs = WEEK_IN_MS;
  }

  setUpdateInterval(intervalMs) {
    this.updateIntervalMs = intervalMs;
    if (this.intervalId) {
      this.stop();
      this.start(intervalMs);
    }
  }

  areNumbersClose(a, b, tolerance = 1e-9) {
    if (typeof a !== 'number' || typeof b !== 'number') {
      return false;
    }
    return Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));
  }

  calculatePipValue({ pipSize, exchangeRate, contractSize }) {
    const pip = Number(pipSize);
    const rate = Number(exchangeRate);
    const contract = Number(contractSize);

    if (
      !Number.isFinite(pip) ||
      !Number.isFinite(rate) ||
      !Number.isFinite(contract) ||
      rate <= 0 ||
      contract <= 0 ||
      pip <= 0
    ) {
      return null;
    }

    const pipValue = (pip / rate) * contract;
    return Number.isFinite(pipValue) ? pipValue : null;
  }

  parseCurrencyPair(symbol = '') {
    const sanitized = symbol.toUpperCase();
    const matches = sanitized.match(/[A-Z]{3}/g);

    if (!matches || matches.length < 2) {
      return null;
    }

    return {
      base: matches[0],
      quote: matches[1]
    };
  }

  isPairSupported(pair) {
    if (!pair) {
      return false;
    }

    return SUPPORTED_CURRENCIES.has(pair.base) && SUPPORTED_CURRENCIES.has(pair.quote);
  }

  async fetchInstruments() {
    const { data, error } = await supabase
      .from('instruments')
      .select('id, symbol, exchange_rate, pip_size, contract_size, pip_value');

    if (error) {
      throw new Error(`Failed to fetch instruments: ${error.message}`);
    }

    return data || [];
  }

  async updateInstrumentFields(instrumentId, fields) {
    const { error } = await supabase
      .from('instruments')
      .update(fields)
      .eq('id', instrumentId);

    if (error) {
      throw new Error(`Failed to update instrument ${instrumentId}: ${error.message}`);
    }
  }

  async runUpdate() {
    if (this.isUpdating) {
      this.logger.warn('Exchange rate update already in progress, skipping this run');
      return;
    }

    this.isUpdating = true;
    const startTime = Date.now();
    this.logger.info('Starting scheduled exchange rate update...');

    try {
      const instruments = await this.fetchInstruments();
      if (instruments.length === 0) {
        this.logger.warn('No instruments available for exchange rate update');
        return;
      }

      const rateCache = new Map();
      let exchangeRateUpdates = 0;
      let pipValueUpdates = 0;
      let skipped = 0;
      let unsupported = 0;
      let usdQuoteSkipped = 0;
      let failed = 0;

      for (const instrument of instruments) {
        const pair = this.parseCurrencyPair(instrument.symbol);

        if (!pair) {
          skipped++;
          continue;
        }

        if (!this.isPairSupported(pair)) {
          unsupported++;
          continue;
        }

        if (pair.quote === 'USD') {
          usdQuoteSkipped++;
          continue;
        }

        const cacheKey = `${pair.base}/${pair.quote}`;
        if (!rateCache.has(cacheKey)) {
          try {
            const rate = await exchangeRateService.getConversionRate(pair.base, pair.quote);
            rateCache.set(cacheKey, rate);
          } catch (error) {
            failed++;
            rateCache.set(cacheKey, null);
            this.logger.error(`Failed to fetch rate for ${cacheKey}:`, error);
            continue;
          }
        }

        const cachedRate = rateCache.get(cacheKey);
        if (typeof cachedRate !== 'number' || Number.isNaN(cachedRate)) {
          skipped++;
          continue;
        }

        const newPipValue = this.calculatePipValue({
          pipSize: instrument.pip_size,
          exchangeRate: cachedRate,
          contractSize: instrument.contract_size
        });

        const hasExchangeRateChange = !this.areNumbersClose(instrument.exchange_rate ?? null, cachedRate);
        const hasPipValueChange =
          typeof newPipValue === 'number' &&
          !this.areNumbersClose(instrument.pip_value ?? null, newPipValue);

        if (!hasExchangeRateChange && !hasPipValueChange) {
          skipped++;
          continue;
        }

        const updatePayload = {};
        if (hasExchangeRateChange) {
          updatePayload.exchange_rate = cachedRate;
        }
        if (hasPipValueChange) {
          updatePayload.pip_value = newPipValue;
        }

        try {
          await this.updateInstrumentFields(instrument.id, updatePayload);
          if (hasExchangeRateChange) exchangeRateUpdates++;
          if (hasPipValueChange) pipValueUpdates++;
        } catch (error) {
          failed++;
          this.logger.error(`Failed to update instrument ${instrument.id}:`, error);
        }
      }

      if (instrumentCacheService?.isInitialized) {
        try {
          await instrumentCacheService.refresh();
        } catch (cacheError) {
          this.logger.error('Failed to refresh instrument cache after exchange rate update:', cacheError);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.info(
        `Exchange rate update finished in ${duration}ms (exchangeRateUpdates=${exchangeRateUpdates}, pipValueUpdates=${pipValueUpdates}, skipped=${skipped}, unsupported=${unsupported}, usdQuoteSkipped=${usdQuoteSkipped}, failed=${failed})`
      );
    } catch (error) {
      this.logger.error('Unexpected error during exchange rate update:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  start(intervalMs = this.updateIntervalMs) {
    if (this.intervalId) {
      this.logger.warn('Exchange rate update service already running');
      return;
    }

    this.logger.info(`Starting exchange rate update service with interval ${intervalMs}ms`);
    this.intervalId = setInterval(() => {
      this.runUpdate().catch(err => {
        this.logger.error('Exchange rate update run failed:', err);
      });
    }, intervalMs);

    // Run immediately on start
    this.runUpdate().catch(err => {
      this.logger.error('Initial exchange rate update failed:', err);
    });
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.info('Exchange rate update service stopped');
    }
  }
}

const instrumentExchangeRateUpdateService = new InstrumentExchangeRateUpdateService();

export default instrumentExchangeRateUpdateService;

