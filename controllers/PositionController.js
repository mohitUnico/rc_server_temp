import { Logger } from '../utils/logger.js';
import PositionRepository from '../repositories/PositionRepository.js';

const logger = new Logger('PositionController');
const positionRepository = new PositionRepository();

class PositionController {
	// Get position by ID
	static async getById(req, res) {
		try {
			const { id } = req.params;
			if (!id) return res.status(400).json({ error: 'id is required' });
			const position = await positionRepository.findPositionById(id);
			if (!position) return res.status(404).json({ error: 'Position not found' });
			return res.json(position);
		} catch (error) {
			logger.error('getById failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	// Get positions by account
	static async getByAccount(req, res) {
		try {
			const { accountId } = req.params;
			if (!accountId) return res.status(400).json({ error: 'accountId is required' });
			const positions = await positionRepository.findPositionsByAccountId(accountId);
			return res.json(positions);
		} catch (error) {
			logger.error('getByAccount failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	// Get open positions by account
	static async getOpenByAccount(req, res) {
		try {
			const { accountId } = req.params;
			if (!accountId) return res.status(400).json({ error: 'accountId is required' });
			const positions = await positionRepository.findOpenPositionsByAccountId(accountId);
			return res.json(positions);
		} catch (error) {
			logger.error('getOpenByAccount failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	// Modify position SL/TP
	static async modify(req, res) {
		try {
			const { id } = req.params;
			if (!id) return res.status(400).json({ error: 'id is required' });
			const updates = {};
			if (req.body?.slPrice !== undefined) updates.sl_price = req.body.slPrice;
			if (req.body?.tpPrice !== undefined) updates.tp_price = req.body.tpPrice;
			const updated = await positionRepository.updatePosition(id, updates);
			return res.json(updated);
		} catch (error) {
			logger.error('modify failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	// Close position fully
	static async close(req, res) {
		try {
			const { id } = req.params;
			const { exitPrice, pnl } = req.body || {};
			if (!id || exitPrice === undefined) {
				return res.status(400).json({ error: 'id and exitPrice are required' });
			}
			const closed = await positionRepository.closePosition({ positionId: id, exitPrice, pnl });
			return res.json(closed);
		} catch (error) {
			logger.error('close failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	// Partial close position
	static async partialClose(req, res) {
		try {
			const { id } = req.params;
			const { closeLotSize, exitPrice, pnl } = req.body || {};
			if (!id || !closeLotSize || exitPrice === undefined) {
				return res.status(400).json({ error: 'id, closeLotSize, exitPrice are required' });
			}
			const position = await positionRepository.findPositionById(id);
			if (!position) return res.status(404).json({ error: 'Position not found' });
			const result = await positionRepository.partialClosePosition({
				originalPosition: position,
				closeLotSize,
				exitPrice,
				pnl
			});
			return res.json(result);
		} catch (error) {
			logger.error('partialClose failed', error);
			return res.status(400).json({ error: error.message });
		}
	}
}

export default PositionController;


