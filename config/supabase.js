// config/supabase.js
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './envConfig.js';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
    },
    db: {
        schema: 'public'
    }
});

// Test the connection
export async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('symbols')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Supabase connection test failed:', error);
            return false;
        }

        console.log('✅ Supabase connection successful');
        return true;
    } catch (err) {
        console.error('❌ Supabase connection error:', err);
        return false;
    }
}