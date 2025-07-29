import dotenv from 'dotenv';

dotenv.config();


export const ITICK_FOREX_WS_URL = process.env.ITICK_FOREX_WS_URL || "wss://api.itick.org/fws";
export const ITICK_CRYPTO_WS_URL = process.env.ITICK_CRYPTO_WS_URL || "wss://api.itick.org/cws";
export const ITICK_INDICES_WS_URL = process.env.ITICK_INDICES_WS_URL || "wss://api.itick.org/iws";
export const ITICK_WS_AUTH_TOKEN = process.env.ITICK_WS_AUTH_TOKEN || "e49bd6f88e1f4b21a8aee89bc6764e31d3cb7660c336480894fa3440c6bc66b2"