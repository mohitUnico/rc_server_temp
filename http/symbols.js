import express from 'express';
import { SymbolManagementService } from '../services/symbolManagementService.js';
import { PriceUpdateService } from '../services/priceUpdateService.js';

const router = express.Router();

// CREATE - Add new tracked symbol
router.post('/tracked', async (req, res) => {
    try {
        const { symbol, asset_type } = req.body;

        if (!symbol || !asset_type) {
            return res.status(400).json({
                error: 'Missing required fields: symbol and asset_type'
            });
        }

        const result = await SymbolManagementService.addTrackedSymbol(symbol, asset_type);
        res.status(201).json({
            message: 'Symbol added successfully',
            data: result
        });
    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
});

// READ - Get all tracked symbols
router.get('/tracked', async (req, res) => {
    try {
        const symbols = await SymbolManagementService.getAllTrackedSymbols();
        const stats = await SymbolManagementService.getTrackingStats();

        res.json({
            symbols: symbols,
            statistics: stats,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// READ - Get tracked symbols by asset type
router.get('/tracked/:assetType', async (req, res) => {
    try {
        const { assetType } = req.params;
        const symbols = await SymbolManagementService.getTrackedSymbolsByType(assetType);

        res.json({
            asset_type: assetType,
            symbols: symbols,
            count: symbols.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// READ - Get specific tracked symbol
router.get('/tracked/symbol/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const symbolData = await PriceUpdateService.getSymbolByName(symbol);

        if (symbolData.length === 0) {
            return res.status(404).json({
                error: `Symbol ${symbol} not found in tracking`
            });
        }

        res.json({
            symbol: symbol,
            data: symbolData,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// UPDATE - Update symbol details
router.put('/tracked/:symbol/:assetType', async (req, res) => {
    try {
        const { symbol, assetType } = req.params;
        const updates = req.body;

        // Remove fields that shouldn't be updated
        delete updates.symbol_name;
        delete updates.symbol_type;
        delete updates.added_at;

        const result = await SymbolManagementService.updateTrackedSymbol(symbol, assetType, updates);

        res.json({
            message: 'Symbol updated successfully',
            symbol: symbol,
            asset_type: assetType,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
});

// DELETE - Remove symbol from tracking
router.delete('/tracked/:symbol/:assetType', async (req, res) => {
    try {
        const { symbol, assetType } = req.params;
        await SymbolManagementService.removeTrackedSymbol(symbol, assetType);

        res.json({
            message: 'Symbol removed from tracking successfully',
            symbol: symbol,
            asset_type: assetType,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
});

// UTILITY - Check if symbol is tracked
router.get('/tracked/check/:symbol/:assetType', async (req, res) => {
    try {
        const { symbol, assetType } = req.params;
        const isTracked = await SymbolManagementService.isSymbolTracked(symbol, assetType);

        res.json({
            symbol: symbol,
            asset_type: assetType,
            is_tracked: isTracked,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// UTILITY - Get tracking statistics
router.get('/tracked/stats/summary', async (req, res) => {
    try {
        const stats = await SymbolManagementService.getTrackingStats();

        res.json({
            statistics: stats,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// Get current prices for tracked symbols
router.get('/prices', async (req, res) => {
    try {
        const prices = await PriceUpdateService.getAllTrackedPrices();

        res.json({
            prices: prices,
            count: prices.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// Get current prices for specific asset type
router.get('/prices/:assetType', async (req, res) => {
    try {
        const { assetType } = req.params;
        const prices = await PriceUpdateService.getPricesByAssetType(assetType);

        res.json({
            asset_type: assetType,
            prices: prices,
            count: prices.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// Get symbol by name (any asset type)
router.get('/symbol/:symbolName', async (req, res) => {
    try {
        const { symbolName } = req.params;
        const symbolData = await PriceUpdateService.getSymbolByName(symbolName);

        res.json({
            symbol: symbolName,
            data: symbolData,
            count: symbolData.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

export default router;
