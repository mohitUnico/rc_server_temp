import { OrderType } from '../enums/orderEnums.js';
import TradingAccountRepository from '../repositories/TradingAccountRepository.js';
import InstrumentRepository from '../repositories/InstrumentRepository.js';
import PriceService from '../services/priceService.js';
import { Logger } from '../utils/logger.js';

const tradingAccountRepository = new TradingAccountRepository();
const instrumentRepository = new InstrumentRepository();
const logger = new Logger('OrderValidators');

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

// Ensure free margin is positive for the account UID (basic check)
export async function validateFreeMarginPositive(req, res, next) {
	try {
		const { accountId } = req.body || {};
		if (!accountId) {
			return res.status(400).json({ error: 'accountId is required' });
		}

		const account = await tradingAccountRepository.findTradingAccountByUid(accountId);
		if (!account) {
			return res.status(404).json({ error: 'Trading account not found' });
		}

		if (!(account.freeMargin > 0)) {
			return res.status(400).json({ error: 'Insufficient free margin' });
		}

		return next();
	} catch (error) {
		return res.status(400).json({ error: error.message });
	}
}

/**
 * Calculate required margin for an order
 * @param {number} lotSize - Lot size of the order
 * @param {number} price - Current price of the instrument
 * @param {number} leverage - Account leverage (default: 100)
 * @param {number} contractSize - Contract size of the instrument (default: 100000 for forex)
 * @returns {number} Required margin amount
 */
function calculateRequiredMargin(lotSize, price, leverage = 100, contractSize = 100000) {
	try {
		// Calculate the notional value of the position
		const notionalValue = lotSize * contractSize * price;
		
		// Calculate required margin based on leverage
		// Leverage of 100 means 1% margin requirement
		const marginRequirement = notionalValue / leverage;
		
		logger.debug(`Margin calculation: lotSize=${lotSize}, price=${price}, leverage=${leverage}, contractSize=${contractSize}, notionalValue=${notionalValue}, requiredMargin=${marginRequirement}`);
		
		return marginRequirement;
	} catch (error) {
		logger.error('Error calculating required margin:', error);
		return 0;
	}
}

// Comprehensive margin validation that calculates required margin for the specific order
export async function validateSufficientMargin(req, res, next) {
	try {
		const { accountId, instrumentId, lotSize, side } = req.body || {};
		
		if (!accountId || !instrumentId || !lotSize) {
			return res.status(400).json({ 
				error: 'Missing required fields: accountId, instrumentId, lotSize' 
			});
		}

		// Get account details
		const account = await tradingAccountRepository.findTradingAccountByUid(accountId);
		if (!account) {
			return res.status(404).json({ error: 'Trading account not found' });
		}

		// Get instrument details
		const instrument = await instrumentRepository.findInstrumentById(instrumentId);
		if (!instrument) {
			return res.status(404).json({ error: 'Instrument not found' });
		}

		// Get current price for margin calculation
		let currentPrice;
		try {
			currentPrice = await PriceService.getCurrentPrice(instrumentId);
			logger.debug(`Current price for instrument ${instrumentId}: ${currentPrice}`);
		} catch (error) {
			logger.error(`Failed to fetch current price for instrument ${instrumentId}:`, error);
			return res.status(400).json({ 
				error: `Failed to fetch current price for margin calculation: ${error.message}` 
			});
		}

		// Calculate required margin
		const leverage = account.leverage || 100;
		const contractSize = instrument.contractSize || 100000; // Default for forex
		const requiredMargin = calculateRequiredMargin(lotSize, currentPrice, leverage, contractSize);

		// Check if account has sufficient free margin
		if (account.freeMargin < requiredMargin) {
			const marginDeficit = requiredMargin - account.freeMargin;
			logger.warn(`Insufficient margin for order: account=${accountId}, required=${requiredMargin}, available=${account.freeMargin}, deficit=${marginDeficit}`);
			
			return res.status(400).json({
				error: 'Insufficient free margin for this order',
				details: {
					requiredMargin: requiredMargin.toFixed(2),
					availableMargin: account.freeMargin.toFixed(2),
					marginDeficit: marginDeficit.toFixed(2),
					lotSize,
					currentPrice,
					leverage,
					contractSize
				}
			});
		}

		logger.info(`Margin validation passed: account=${accountId}, required=${requiredMargin}, available=${account.freeMargin}`);
		
		// Add calculated values to request for potential use in controller
		req.marginValidation = {
			requiredMargin,
			currentPrice,
			leverage,
			contractSize
		};

		return next();
	} catch (error) {
		logger.error('Error in validateSufficientMargin:', error);
		return res.status(400).json({ error: error.message });
	}
}


