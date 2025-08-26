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

/**
 * Calculate required margin for an order based on lot size, price, and leverage
 */
async function calculateRequiredMargin(lotSize, price, leverage = 100.0, instrumentId = null) {
	try {
		let contractSize = 100000.0; // Default for Forex
		
		// Try to get the actual contract size from the instrument if available
		if (instrumentId) {
			try {
				const instrument = await instrumentRepository.findInstrumentById(instrumentId);
				if (instrument && instrument.contractSize) {
					contractSize = instrument.contractSize;
					logger.debug(`Using contract size from instrument ${instrumentId}: ${contractSize}`);
				} else if (instrument && instrument.category) {
					// Use category-based defaults if contract size not available
					switch (instrument.category) {
						case 'forex':
							contractSize = 100000.0;
							break;
						case 'metal':
							contractSize = 100.0;
							break;
						case 'crypto':
							contractSize = 1.0;
							break;
						default:
							contractSize = 1.0;
							break;
					}
					logger.debug(`Using category-based contract size for ${instrument.category}: ${contractSize}`);
				}
			} catch (error) {
				logger.warn(`Failed to get instrument details for margin calculation, using default contract size: ${error.message}`);
			}
		}

		// Calculate the total position value
		const positionValue = lotSize * contractSize * price;
		
		// Calculate required margin: position value / leverage
		const requiredMargin = positionValue / leverage;
		
		logger.debug(`Margin calculation: lotSize=${lotSize}, contractSize=${contractSize}, price=${price}, leverage=${leverage}, positionValue=${positionValue}, requiredMargin=${requiredMargin}`);
		
		return Math.max(0, requiredMargin);
	} catch (error) {
		logger.error('Error calculating required margin:', error);
		return 0;
	}
}

// Ensure sufficient free margin is available for the specific order
export async function validateFreeMarginPositive(req, res, next) {
	try {
		const { accountId, instrumentId, lotSize, orderType } = req.body || {};
		if (!accountId) {
			return res.status(400).json({ error: 'accountId is required' });
		}

		// Get trading account
		const account = await tradingAccountRepository.findTradingAccountByUid(accountId);
		if (!account) {
			return res.status(404).json({ error: 'Trading account not found' });
		}

		// For market orders, we need to calculate required margin based on current price
		const isMarketOrder = orderType === OrderType.MARKET_BUY || orderType === OrderType.MARKET_SELL;
		
		let requiredMargin = 0;
		let currentPrice = null;

		if (isMarketOrder && instrumentId && lotSize) {
			try {
				// Get current price for margin calculation
				logger.info(`Fetching current price for margin calculation - instrumentId: ${instrumentId}`);
				currentPrice = await PriceService.getCurrentPrice(instrumentId);
				logger.info(`Current price fetched for margin calculation: ${currentPrice}`);

				// Calculate required margin
				requiredMargin = await calculateRequiredMargin(lotSize, currentPrice, account.leverage, instrumentId);
				logger.info(`Required margin calculated: ${requiredMargin} (lotSize: ${lotSize}, price: ${currentPrice}, leverage: ${account.leverage})`);
			} catch (error) {
				logger.error('Failed to fetch current price for margin calculation:', error);
				return res.status(400).json({ 
					error: `Failed to calculate required margin: ${error.message}` 
				});
			}
		} else if (lotSize) {
			// For non-market orders, we'll use a conservative estimate
			// You might want to implement a different strategy for limit/stop orders
			logger.info(`Non-market order detected, using basic margin check`);
			requiredMargin = lotSize * 1000; // Conservative estimate
		}

		// Check if account has sufficient free margin
		if (account.freeMargin < requiredMargin) {
			const marginDeficit = requiredMargin - account.freeMargin;
			logger.warn(`Insufficient free margin for order - Required: ${requiredMargin}, Available: ${account.freeMargin}, Deficit: ${marginDeficit}`);
			
			return res.status(400).json({ 
				error: 'Insufficient free margin for this order',
				details: {
					requiredMargin: requiredMargin.toFixed(2),
					availableMargin: account.freeMargin.toFixed(2),
					marginDeficit: marginDeficit.toFixed(2),
					lotSize: lotSize,
					currentPrice: currentPrice,
					leverage: account.leverage
				}
			});
		}

		logger.info(`Free margin validation passed - Required: ${requiredMargin}, Available: ${account.freeMargin}`);
		return next();
	} catch (error) {
		logger.error('validateFreeMarginPositive failed:', error);
		return res.status(400).json({ error: error.message });
	}
}


