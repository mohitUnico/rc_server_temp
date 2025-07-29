import dotenv from 'dotenv';

dotenv.config();


export const ITICK_FOREX_WS_URL = process.env.ITICK_FOREX_WS_URL || "wss://api.itick.org/fws";
export const ITICK_CRYPTO_WS_URL = process.env.ITICK_CRYPTO_WS_URL || "wss://api.itick.org/cws";
export const ITICK_INDICES_WS_URL = process.env.ITICK_INDICES_WS_URL || "wss://api.itick.org/iws";
export const ITICK_WS_AUTH_TOKEN = process.env.ITICK_WS_AUTH_TOKEN || "1b32e677c3cb46da878dff1a7ecdb9ae46d3043991ff48d2b92a74272b4e17c8"