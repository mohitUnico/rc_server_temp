import { supabase } from '../config/supabase.js';
import { SymbolManagementService } from './symbolManagementService.js';

export class PriceUpdateService {
    static async updatePrice(symbol, lastPrice, assetType) {
        try {
            // Check if symbol is being tracked
            let isTracked = await SymbolManagementService.isSymbolTracked(symbol, assetType);

            if (!isTracked) {
                // Symbol not tracked, skip it to avoid trigger issues
                console.log(`⚠️ Symbol ${symbol} not tracked for ${assetType}, skipping price update`);
                return false;
            }

            // Update the price in symbols table
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
                return false;
            }

            // Only log price updates occasionally (removed constant logging)
            return true;
        } catch (err) {
            console.error(`Error updating price for ${symbol}:`, err);
            return false;
        }
    }

    static async getLatestPrice(symbol, assetType) {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .select('price, last_updated')
                .eq('symbol_name', symbol)
                .eq('symbol_type', assetType)
                .single();

            if (error) {
                console.error(`Failed to get price for ${symbol}:`, error);
                return null;
            }

            return data;
        } catch (err) {
            console.error(`Error getting price for ${symbol}:`, err);
            return null;
        }
    }

    // Get all tracked symbols with their current prices
    static async getAllTrackedPrices() {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .select('symbol_name, symbol_type, price, last_updated')
                .order('symbol_type')
                .order('symbol_name');

            if (error) {
                console.error('Failed to get tracked prices:', error);
                return [];
            }

            return data || [];
        } catch (err) {
            console.error('Error getting tracked prices:', err);
            return [];
        }
    }

    // Get prices for specific asset type
    static async getPricesByAssetType(assetType) {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .select('symbol_name, price, last_updated')
                .eq('symbol_type', assetType)
                .order('symbol_name');

            if (error) {
                console.error(`Failed to get ${assetType} prices:`, error);
                return [];
            }

            return data || [];
        } catch (err) {
            console.error(`Error getting ${assetType} prices:`, err);
            return [];
        }
    }

    // Get symbol by name (any asset type)
    static async getSymbolByName(symbolName) {
        try {
            const { data, error } = await supabase
                .from('symbols')
                .select('*')
                .eq('symbol_name', symbolName.toUpperCase())
                .order('symbol_type');

            if (error) {
                console.error(`Failed to get symbol ${symbolName}:`, error);
                return [];
            }

            return data || [];
        } catch (err) {
            console.error(`Error getting symbol ${symbolName}:`, err);
            return [];
        }
    }
}
