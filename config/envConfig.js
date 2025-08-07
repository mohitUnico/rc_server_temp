import dotenv from 'dotenv';

dotenv.config();


export const ITICK_FOREX_WS_URL = process.env.ITICK_FOREX_WS_URL || "wss://api.itick.org/fws";
export const ITICK_CRYPTO_WS_URL = process.env.ITICK_CRYPTO_WS_URL || "wss://api.itick.org/cws";
export const ITICK_INDICES_WS_URL = process.env.ITICK_INDICES_WS_URL || "wss://api.itick.org/iws";
export const ITICK_WS_AUTH_TOKEN = process.env.ITICK_WS_AUTH_TOKEN || "a8da4be1aab640ffa229080adb141ea6f0c47d22ce7e4a349ac6cfffd1de825b"