import express from 'express';
import fetch from 'node-fetch';
import { ITICK_WS_AUTH_TOKEN } from '../config/envConfig.js';

const router = express.Router();

router.get('/quote', async (req, res) => {
    // Set CORS headers for this specific route
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const { type, symbol } = req.query;
    let baseUrl;
    switch (type) {
        case 'forex':
            baseUrl = 'https://api.itick.org/forex/quote';
            break;
        case 'crypto':
            baseUrl = 'https://api.itick.org/crypto/quote';
            break;
        case 'indices':
            baseUrl = 'https://api.itick.org/indices/quote';
            break;
        default:
            return res.status(400).json({ error: 'Invalid type' });
    }
    let region = '';
    switch (type) {
        case 'forex':
            region = 'gb';
            break;
        case 'crypto':
            region = 'ba';
            break;
        case 'indices':
            region = 'gb';
            break;
        default:
            return res.status(400).json({ error: 'Invalid type' });
    }
    const url = `${baseUrl}?code=${symbol}&region=${region}`;
    try {
        const response = await fetch(url, {
            headers: { token: ITICK_WS_AUTH_TOKEN }
        });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router; 