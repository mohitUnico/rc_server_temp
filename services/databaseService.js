import { supabase } from '../config/supabase.js';

export class DatabaseService {
    static async initializeDatabase() {
        try {
            console.log('🔧 Checking database connection...');

            // Test basic connectivity without specific table requirements
            const { data, error } = await supabase
                .rpc('version');

            if (error) {
                console.error('❌ Database connection failed:', error);
                throw error;
            }

            console.log('✅ Database connection successful');
            console.log('ℹ️ Basic database connectivity established');

        } catch (err) {
            console.error('❌ Database initialization failed:', err);
            throw err;
        }
    }

    static async getTableInfo() {
        try {
            // Test basic connectivity without specific table requirements
            const { data, error } = await supabase
                .rpc('version');

            if (error) {
                return { exists: false, error: error.message };
            }

            return { exists: true, message: 'Database connection successful' };
        } catch (err) {
            return { exists: false, error: err.message };
        }
    }
}
