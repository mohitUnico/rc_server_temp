import { OrderType } from '../enums/orderEnums.js';
import TradingAccountRepository from '../repositories/TradingAccountRepository.js';
import PriceService from '../services/priceService.js';
import accountMetricsService from '../services/accountMetricsService.js';
import InstrumentRepository from '../repositories/InstrumentRepository.js';

const tradingAccountRepository = new TradingAccountRepository();
const instrumentRepository = new InstrumentRepository();

// Ensure required fields for a new order
export async function validateNewOrderPayload(req, res, next) {
	try {
		const { accountId, instrumentId, orderType, lotSize, price } = req.body || {};

		if (!accountId || !instrumentId || !orderType || !lotSize) {
			return res.status(400).json({
				error: 'Missing required fields: accountId, instrumentId, orderType, lotSize'
			});
		}

		if (typeof lotSize !== 'number' || lotSize <= 0) {
			return res.status(400).json({ error: 'lotSize must be a number greater than 0' });
		}

		// Price field is no longer required for any order type
		// Market orders will fetch price automatically
		// Limit/Stop orders will be placed as pending with price = null

		return next();
	} catch (error) {
		return res.status(400).json({ error: error.message });
	}
}

// Ensure free margin is positive for the account UID
export async function validateFreeMarginPositive(req, res, next) {
	try {
		const { accountId, instrumentId, lotSize, orderType } = req.body || {};
		if (!accountId) {
			return res.status(400).json({ error: 'accountId is required' });
		}

		if (!instrumentId || typeof lotSize !== 'number' || lotSize <= 0) {
			return res.status(400).json({ error: 'instrumentId and valid lotSize are required to check margin' });
		}

		const account = await tradingAccountRepository.findTradingAccountByUid(accountId);
		if (!account) {
			return res.status(404).json({ error: 'Trading account not found' });
		}


		// Get instrument for contract size
		const instrument = await instrumentRepository.findInstrumentById(instrumentId);
		const contractSize = instrument?.contractSize || 100000; // sensible default for FX

		// Get a working price for required margin calculation
		// For market orders we use current market price; for limit orders we use limit_value
		let price;
		const isLimitOrder = orderType === OrderType.BUY_LIMIT || orderType === OrderType.SELL_LIMIT || 
			orderType === OrderType.BUY_STOP || orderType === OrderType.SELL_STOP;

		if (isLimitOrder) {
			// For limit orders, use the limit_value as the execution price
			const { limitValue } = req.body || {};
			if (!limitValue || typeof limitValue !== 'number' || limitValue <= 0) {
				return res.status(400).json({ error: 'limitValue is required for limit orders' });
			}
			price = limitValue;
		} else {
			// For market orders, fetch current price
			try {
				price = await PriceService.getCurrentPrice(instrumentId);
				if (!price || !(price > 0)) {
					return res.status(400).json({ error: 'Unable to fetch current price for margin check' });
				}
			} catch (e) {
				return res.status(400).json({ error: `Failed to fetch price for margin check: ${e.message}` });
			}
		}

		// Calculate required margin using account leverage (fallback to 100x if missing)
		const leverage = Number(account.leverage) > 0 ? Number(account.leverage) : 100;
		// Formula: Margin = (Lot Size × Contract Size × Price in account currency) / Leverage
		const requiredMargin = (lotSize * contractSize * price) / leverage;

		// Update metrics and check sufficiency against up-to-date free margin
		try {
			const marginCheck = await accountMetricsService.checkMarginSufficiency(accountId, requiredMargin);
			if (!marginCheck.hasSufficientMargin) {
				return res.status(301).json({
					error: 'Insufficient free margin',
					details: {
						requiredMargin: marginCheck.requiredMargin,
						freeMargin: marginCheck.freeMargin,
						marginDeficit: marginCheck.marginDeficit
					}
				});
			}
		} catch (e) {
			return res.status(301).json({ error: `Margin check failed: ${e.message}` });
		}

		return next();
	} catch (error) {
		return res.status(301).json({ error: error.message });
	}
}


