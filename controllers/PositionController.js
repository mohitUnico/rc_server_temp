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

	// Close position fully or partially
	static async close(req, res) {
		try {
			const { id } = req.params;
			const { lotSize } = req.body || {};
			
			if (!id) {
				return res.status(400).json({ error: 'positionId is required' });
			}

			// Get the position from database
			const position = await positionRepository.findPositionById(id);
			if (!position) {
				return res.status(404).json({ error: 'Position not found' });
			}

			// Check if position is already closed
			if (position.status === 'closed') {
				return res.status(400).json({ error: 'Position is already closed' });
			}

			// Get current price for the instrument
			const PriceService = (await import('../services/priceService.js')).default;
			let exitPrice;
			try {
				exitPrice = await PriceService.getCurrentPrice(position.instrumentId);
				logger.info(`Fetched exit price for position ${id}: ${exitPrice}`);
			} catch (error) {
				logger.error('Failed to fetch current price:', error);
				return res.status(400).json({ 
					error: `Failed to fetch current price: ${error.message}` 
				});
			}

			// Determine if this is a full close or partial close
			const isFullClose = !lotSize || lotSize >= position.lotSize;
			const closeLotSize = isFullClose ? position.lotSize : lotSize;

			// Validate partial close
			if (!isFullClose && (closeLotSize <= 0 || closeLotSize >= position.lotSize)) {
				return res.status(400).json({ 
					error: 'Partial close lot size must be greater than 0 and less than current position lot size' 
				});
			}

			let result;
			if (isFullClose) {
				// Full close - update the existing position
				logger.info(`Closing entire position ${id} at price ${exitPrice}`);
				result = await positionRepository.closePosition({ 
					positionId: id, 
					exitPrice, 
					pnl: undefined // Let repository calculate PnL
				});
				
				return res.json({
					message: 'Position closed successfully',
					position: result,
					exitPrice,
					closedLotSize: closeLotSize
				});
			} else {
				// Partial close - create new closed position and update original
				logger.info(`Partially closing position ${id}: ${closeLotSize} lots at price ${exitPrice}`);
				result = await positionRepository.partialClosePosition({
					originalPosition: position,
					closeLotSize,
					exitPrice,
					pnl: undefined // Let repository calculate PnL
				});
				
				return res.json({
					message: 'Position partially closed successfully',
					closedPosition: result.closedPosition,
					remainingPosition: result.openPosition,
					exitPrice,
					closedLotSize: closeLotSize
				});
			}
		} catch (error) {
			logger.error('close failed', error);
			return res.status(400).json({ error: error.message });
		}
	}

	// Note: partialClose method removed - use the close method with lotSize parameter for partial closes
}

export default PositionController;


