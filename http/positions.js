import express from 'express';
import PositionController from '../controllers/PositionController.js';

const router = express.Router();

router.get('/positions/:id', (req, res) => PositionController.getById(req, res));
router.get('/accounts/:accountId/positions', (req, res) => PositionController.getByAccount(req, res));
router.get('/accounts/:accountId/positions/open', (req, res) => PositionController.getOpenByAccount(req, res));
router.put('/positions/:id', (req, res) => PositionController.modify(req, res));
router.post('/positions/:id/close', (req, res) => PositionController.close(req, res));
router.post('/positions/:id/partial-close', (req, res) => PositionController.partialClose(req, res));

export default router;


