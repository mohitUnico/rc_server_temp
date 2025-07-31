import { ITICK_FOREX_WS_URL, ITICK_CRYPTO_WS_URL, ITICK_INDICES_WS_URL, ITICK_WS_AUTH_TOKEN } from './envConfig.js';

export const WebSocketConfig = {
    forex: {
        url: ITICK_FOREX_WS_URL,
        region: 'gb',
        authToken: ITICK_WS_AUTH_TOKEN
    },
    crypto: {
        url: ITICK_CRYPTO_WS_URL,
        region: 'ba',
        authToken: ITICK_WS_AUTH_TOKEN
    },
    indices: {
        url: ITICK_INDICES_WS_URL,
        region: 'gb',
        authToken: ITICK_WS_AUTH_TOKEN
    }
}; 