import { supabase } from '../config/supabase.js';

export class DatabaseService {
    static async initializeDatabase() {
        try {
            console.log('🔧 Checking database connection...');

            const { data, error } = await supabase
                .from('symbols') // Use the existing symbols table
                .select('*')
                .limit(1);

            if (error) {
                console.error('❌ Database connection failed:', error);
                throw error;
            }

            console.log('✅ Database connection successful');
            console.log('ℹ️ Using existing symbols table structure');

        } catch (err) {
            console.error('❌ Database initialization failed:', err);
            throw err;
        }
    }

    static async getTableInfo() {
        try {
            const { data, error } = await supabase
                .from('symbols') // Use the existing symbols table
                .select('*')
                .limit(1);

            if (error) {
                return { exists: false, error: error.message };
            }

            return { exists: true, count: data.length };
        } catch (err) {
            return { exists: false, error: err.message };
        }
    }
}
