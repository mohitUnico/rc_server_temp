import dotenv from 'dotenv';

dotenv.config();


export const ITICK_FOREX_WS_URL = process.env.ITICK_FOREX_WS_URL || "wss://api.itick.org/fws";
export const ITICK_CRYPTO_WS_URL = process.env.ITICK_CRYPTO_WS_URL || "wss://api.itick.org/cws";
export const ITICK_INDICES_WS_URL = process.env.ITICK_INDICES_WS_URL || "wss://api.itick.org/iws";
export const ITICK_WS_AUTH_TOKEN = process.env.ITICK_WS_AUTH_TOKEN || "4b13a6174f5040ea9f29d041052352af39c22525e5d347198a8611c07629f211"