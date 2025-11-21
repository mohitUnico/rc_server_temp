import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    'ITICK_WS_AUTH_TOKEN',
    'ITICK_FOREX_WS_URL',
    'ITICK_CRYPTO_WS_URL',
    'ITICK_INDICES_WS_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SENDGRID_API_KEY',
    'FROM_EMAIL',
    'EXCHANGE_RATE_API_KEY'
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
export const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;

// SendGrid email configuration
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
export const FROM_EMAIL = process.env.FROM_EMAIL;
export const LOGO_PATH = process.env.LOGO_PATH; 