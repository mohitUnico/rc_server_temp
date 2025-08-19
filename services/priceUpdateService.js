import { supabase } from '../config/supabase.js';
import { isSymbolTracked } from '../config/symbols.js';

export class PriceUpdateService {
    static async updatePrice(symbol, lastPrice, assetType) {
        try {
            // Check if symbol is in the hardcoded tracked symbols list
            if (!isSymbolTracked(symbol, assetType)) {
                // Symbol not tracked, don't update database but return true for client delivery
                return { shouldUpdateDatabase: false, shouldSendToClient: true };
            }

            // Symbol is tracked, update the price in symbols table
            const { data, error } = await supabase
                .from('symbols')
                .update({
                    price: parseFloat(lastPrice),
                    last_updated: new Date().toISOString()
                })
                .eq('symbol_name', symbol)
                .eq('symbol_type', assetType);

            if (error) {
                console.error(`Failed to update price for ${symbol}:`, error);
                return { shouldUpdateDatabase: false, shouldSendToClient: true };
            }

            return { shouldUpdateDatabase: true, shouldSendToClient: true };
        } catch (err) {
            console.error(`Error updating price for ${symbol}:`, err);
            return { shouldUpdateDatabase: false, shouldSendToClient: true };
        }
    }

    // Get latest price for a symbol
    static async getLatestPrice(symbol, assetType) {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .select('price, last_updated')
                .eq('symbol_name', symbol)
                .eq('symbol_type', assetType)
                .single();

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            return data;
        } catch (err) {
            throw err;
        }
    }

    // Get all tracked prices
    static async getAllTrackedPrices() {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .select('*')
                .order('symbol_type')
                .order('symbol_name');

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            return data || [];
        } catch (err) {
            throw err;
        }
    }

    // Get prices by asset type
    static async getPricesByAssetType(assetType) {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .select('*')
                .eq('symbol_type', assetType)
                .order('symbol_name');

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            return data || [];
        } catch (err) {
            throw err;
        }
    }

    // Get symbol by name
    static async getSymbolByName(symbolName) {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .select('*')
                .eq('symbol_name', symbolName)
                .order('symbol_type');

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            return data || [];
        } catch (err) {
            throw err;
        }
    }
}


