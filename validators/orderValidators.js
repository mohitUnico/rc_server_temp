import { OrderType } from '../enums/orderEnums.js';
import TradingAccountRepository from '../repositories/TradingAccountRepository.js';

const tradingAccountRepository = new TradingAccountRepository();

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


