import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    'ITICK_WS_AUTH_TOKEN',
    'ITICK_FOREX_WS_URL',
    'ITICK_CRYPTO_WS_URL',
    'ITICK_INDICES_WS_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

export const ITICK_FOREX_WS_URL = process.env.ITICK_FOREX_WS_URL;
export const ITICK_CRYPTO_WS_URL = process.env.ITICK_CRYPTO_WS_URL;
export const ITICK_INDICES_WS_URL = process.env.ITICK_INDICES_WS_URL;
export const ITICK_WS_AUTH_TOKEN = process.env.ITICK_WS_AUTH_TOKEN;
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY; 