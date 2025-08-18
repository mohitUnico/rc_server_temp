import { Logger } from '../utils/logger.js';
import TradeRepository from '../repositories/TradeRepository.js';

const logger = new Logger('TradeController');
const tradeRepository = new TradeRepository();

class TradeController {
	// Get trade by ID
	static async getById(req, res) {
		try {
			const { id } = req.params;
			if (!id) return res.status(400).json({ error: 'id is required' });
			const trade = await tradeRepository.findTradeById(id);
			if (!trade) return res.status(404).json({ error: 'Trade not found' });
			return res.json(trade);
		} catch (error) {
			logger.error('getById failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	// Get trades by account
	static async getByAccount(req, res) {
		try {
			const { accountId } = req.params;
			if (!accountId) return res.status(400).json({ error: 'accountId is required' });
			const trades = await tradeRepository.findTradesByAccountId(accountId);
			return res.json(trades);
		} catch (error) {
			logger.error('getByAccount failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	// Get trades by order
	static async getByOrder(req, res) {
		try {
			const { orderId } = req.params;
			if (!orderId) return res.status(400).json({ error: 'orderId is required' });
			const trades = await tradeRepository.findTradesByOrderId(orderId);
			return res.json(trades);
		} catch (error) {
			logger.error('getByOrder failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	// Get trades by symbol
	static async getBySymbol(req, res) {
		try {
			const { accountId, symbolId } = req.params;
			if (!accountId || !symbolId) return res.status(400).json({ error: 'accountId and symbolId are required' });
			const trades = await tradeRepository.findTradesBySymbolId(accountId, symbolId);
			return res.json(trades);
		} catch (error) {
			logger.error('getBySymbol failed', error);
			return res.status(400).json({ error: error.message });
		}
	}
}

export default TradeController;


