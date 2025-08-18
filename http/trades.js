import express from 'express';
import TradeController from '../controllers/TradeController.js';

const router = express.Router();

router.get('/trades/:id', (req, res) => TradeController.getById(req, res));
router.get('/accounts/:accountId/trades', (req, res) => TradeController.getByAccount(req, res));
router.get('/orders/:orderId/trades', (req, res) => TradeController.getByOrder(req, res));
router.get('/accounts/:accountId/symbols/:symbolId/trades', (req, res) => TradeController.getBySymbol(req, res));

export default router;


