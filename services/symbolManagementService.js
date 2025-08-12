import { supabase } from '../config/supabase.js';

export class SymbolManagementService {
    // CREATE - Add new symbol to tracking
    static async addTrackedSymbol(symbol, assetType) {
        try {
            // Validate asset type
            if (!['forex', 'crypto', 'indices'].includes(assetType)) {
                throw new Error('Invalid asset type. Must be forex, crypto, or indices');
            }

            // Check if symbol already exists
            const existing = await this.getTrackedSymbol(symbol, assetType);
            if (existing) {
                throw new Error(`Symbol ${symbol} is already being tracked for ${assetType}`);
            }

            // Add to tracked symbols using upsert to avoid trigger issues
            const { data, error } = await supabase
                .from('symbols')
                .upsert({
                    symbol_name: symbol.toUpperCase(),
                    symbol_type: assetType,
                    price: null,
                    added_at: new Date().toISOString(),
                    last_updated: new Date().toISOString()
                }, {
                    onConflict: 'symbol_name,symbol_type' // Use composite key
                });

            if (error) {
                console.error(`Failed to add tracked symbol ${symbol}:`, error);
                throw new Error(`Database error: ${error.message}`);
            }

            console.log(`✅ Symbol ${symbol} added to ${assetType} tracking`);
            return { symbol_name: symbol, symbol_type: assetType, price: null };
        } catch (err) {
            console.error(`Error adding tracked symbol ${symbol}:`, err);
            throw err;
        }
    }

    // READ - Get all tracked symbols
    static async getAllTrackedSymbols() {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .select('*')
                .order('symbol_type')
                .order('symbol_name');

            if (error) {
                console.error('Failed to get tracked symbols:', error);
                throw new Error(`Database error: ${error.message}`);
            }

            return data || [];
        } catch (err) {
            console.error('Error getting tracked symbols:', err);
            throw err;
        }
    }

    // READ - Get tracked symbols by asset type
    static async getTrackedSymbolsByType(assetType) {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .select('*')
                .eq('symbol_type', assetType)
                .order('symbol_name');

            if (error) {
                console.error(`Failed to get ${assetType} symbols:`, error);
                throw new Error(`Database error: ${error.message}`);
            }

            return data || [];
        } catch (err) {
            console.error(`Error getting ${assetType} symbols:`, err);
            throw err;
        }
    }

    // READ - Get specific tracked symbol
    static async getTrackedSymbol(symbol, assetType) {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .select('*')
                .eq('symbol_name', symbol.toUpperCase())
                .eq('symbol_type', assetType)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error(`Failed to get symbol ${symbol}:`, error);
                throw new Error(`Database error: ${error.message}`);
            }

            return data || null;
        } catch (err) {
            console.error(`Error getting symbol ${symbol}:`, err);
            throw err;
        }
    }

    // UPDATE - Update symbol details
    static async updateTrackedSymbol(symbol, assetType, updates) {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .update({
                    ...updates,
                    last_updated: new Date().toISOString()
                })
                .eq('symbol_name', symbol.toUpperCase())
                .eq('symbol_type', assetType);

            if (error) {
                console.error(`Failed to update symbol ${symbol}:`, error);
                throw new Error(`Database error: ${error.message}`);
            }

            console.log(`✅ Symbol ${symbol} updated successfully`);
            return true;
        } catch (err) {
            console.error(`Error updating symbol ${symbol}:`, err);
            throw err;
        }
    }

    // DELETE - Remove symbol from tracking
    static async removeTrackedSymbol(symbol, assetType) {
        try {
            const { error } = await supabase
                .from('symbols')
                .delete()
                .eq('symbol_name', symbol.toUpperCase())
                .eq('symbol_type', assetType);

            if (error) {
                console.error(`Failed to remove symbol ${symbol}:`, error);
                throw new Error(`Database error: ${error.message}`);
            }

            console.log(`✅ Symbol ${symbol} removed from tracking`);
            return true;
        } catch (err) {
            console.error(`Error removing symbol ${symbol}:`, err);
            throw err;
        }
    }

    // UTILITY - Check if symbol is tracked
    static async isSymbolTracked(symbol, assetType) {
        try {
            const trackedSymbol = await this.getTrackedSymbol(symbol, assetType);
            return !!trackedSymbol;
        } catch (err) {
            return false;
        }
    }

    // UTILITY - Get tracking statistics
    static async getTrackingStats() {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .select('symbol_type');

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            const stats = {
                forex: 0,
                crypto: 0,
                indices: 0,
                total: 0
            };

            data.forEach(item => {
                stats[item.symbol_type]++;
                stats.total++;
            });

            return stats;
        } catch (err) {
            console.error('Error getting tracking stats:', err);
            throw err;
        }
    }

    // UTILITY - Get all symbols (for any asset type)
    static async getAllSymbols() {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .select('symbol_name')
                .order('symbol_name');

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            return data.map(item => item.symbol_name);
        } catch (err) {
            console.error('Error getting all symbols:', err);
            throw err;
        }
    }
}
