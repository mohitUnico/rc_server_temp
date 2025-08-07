import dotenv from 'dotenv';

dotenv.config();


export const ITICK_FOREX_WS_URL = process.env.ITICK_FOREX_WS_URL || "wss://api.itick.org/fws";
export const ITICK_CRYPTO_WS_URL = process.env.ITICK_CRYPTO_WS_URL || "wss://api.itick.org/cws";
export const ITICK_INDICES_WS_URL = process.env.ITICK_INDICES_WS_URL || "wss://api.itick.org/iws";
export const ITICK_WS_AUTH_TOKEN = process.env.ITICK_WS_AUTH_TOKEN || "544958c208ed4dc08f165bd20f0a48a04e256ac825c0406dbf1d880ae151b1b8"