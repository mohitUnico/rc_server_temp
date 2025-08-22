import express from 'express';
import PositionController from '../controllers/PositionController.js';

const router = express.Router();

// Test endpoint to verify routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Positions routes are working!', timestamp: new Date().toISOString() });
});

// Specific routes must come before parameterized routes
router.get('/accounts/:accountId/positions/open', (req, res) => PositionController.getOpenByAccount(req, res));
router.get('/accounts/:accountId/positions/closed', (req, res) => PositionController.getClosedByAccount(req, res));

// General routes
router.get('/accounts/:accountId/positions', (req, res) => PositionController.getByAccount(req, res));
router.get('/positions/:id', (req, res) => PositionController.getById(req, res));
router.put('/positions/:id', (req, res) => PositionController.modify(req, res));
router.post('/positions/:id/close', (req, res) => PositionController.close(req, res));

export default router;


