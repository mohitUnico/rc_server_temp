import express from 'express';
import InstrumentController from '../controllers/InstrumentController.js';

const router = express.Router();

// Test endpoint
router.get('/instruments/test', (req, res) => {
  res.json({ message: 'Instruments router is working!' });
});

// Get all instruments
router.get('/instruments', (req, res) => InstrumentController.getAll(req, res));

// Get all categories (must come before /:id route)
router.get('/instruments/categories', (req, res) => InstrumentController.getCategories(req, res));

// Get instruments by category (must come before /:id route)
router.get('/instruments/category/:category', (req, res) => InstrumentController.getByCategory(req, res));

// Get instrument by symbol (must come before /:id route)
router.get('/instruments/symbol/:symbol', (req, res) => InstrumentController.getBySymbol(req, res));

// Get instrument by ID (must come last)
router.get('/instruments/:id', (req, res) => InstrumentController.getById(req, res));

export default router;
