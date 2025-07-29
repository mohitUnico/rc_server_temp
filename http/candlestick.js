import express from 'express';
import fetch from 'node-fetch';
import { ITICK_WS_AUTH_TOKEN } from '../config/envConfig.js';

const router = express.Router();

router.get('/candlestick', async (req, res) => {
    const { type, code, kType, et, limit } = req.query;
    let baseUrl;
    switch (type) {
        case 'forex':
            baseUrl = 'https://api.itick.org/forex/kline';
            break;
        case 'crypto':
            baseUrl = 'https://api.itick.org/crypto/kline';
            break;
        case 'indices':
            baseUrl = 'https://api.itick.org/indices/kline';
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
    // Construct URL with the new parameter format
    const url = `${baseUrl}?region=${region}&code=${code}&kType=${kType}&et=${et}&limit=${limit}`;

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