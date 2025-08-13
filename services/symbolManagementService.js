import { supabase } from '../config/supabase.js';
import { TRACKED_SYMBOLS, isSymbolTracked, getSymbolsByType, getAllSymbols } from '../config/symbols.js';

export class SymbolManagementService {
    // Check if symbol is being tracked (now uses hardcoded config)
    static async isSymbolTracked(symbol, assetType) {
        return isSymbolTracked(symbol, assetType);
    }

    // Get all tracked symbols (now uses hardcoded config)
    static async getAllTrackedSymbols() {
        try {
            // Get symbols from hardcoded config
            const configSymbols = getAllSymbols();

            // Get existing symbols from database to check prices
            const { data: dbSymbols, error } = await supabase
                .from('symbols')
                .select('*')
                .order('symbol_type')
                .order('symbol_name');

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            // Create a map of existing symbols for quick lookup
            const existingSymbolsMap = new Map();
            if (dbSymbols) {
                dbSymbols.forEach(symbol => {
                    existingSymbolsMap.set(`${symbol.symbol_name}_${symbol.symbol_type}`, symbol);
                });
            }

            // Merge hardcoded config with database data
            const mergedSymbols = [];

            for (const [assetType, symbols] of Object.entries(TRACKED_SYMBOLS)) {
                for (const symbolName of symbols) {
                    const key = `${symbolName}_${assetType}`;
                    const existingSymbol = existingSymbolsMap.get(key);

                    if (existingSymbol) {
                        // Use existing database record
                        mergedSymbols.push(existingSymbol);
                    } else {
                        // Create new record structure (will be inserted later)
                        mergedSymbols.push({
                            symbol_name: symbolName,
                            symbol_type: assetType,
                            price: null,
                            added_at: new Date().toISOString(),
                            last_updated: new Date().toISOString()
                        });
                    }
                }
            }

            return mergedSymbols;
        } catch (err) {
            throw err;
        }
    }

    // Get tracked symbols by asset type (now uses hardcoded config)
    static async getTrackedSymbolsByType(assetType) {
        try {
            // Get symbols from hardcoded config
            const configSymbols = getSymbolsByType(assetType);

            // Get existing symbols from database for this asset type
            const { data: dbSymbols, error } = await supabase
                .from('symbols')
                .select('*')
                .eq('symbol_type', assetType)
                .order('symbol_name');

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            // Create a map of existing symbols for quick lookup
            const existingSymbolsMap = new Map();
            if (dbSymbols) {
                dbSymbols.forEach(symbol => {
                    existingSymbolsMap.set(symbol.symbol_name, symbol);
                });
            }

            // Merge hardcoded config with database data
            const mergedSymbols = [];

            for (const symbolName of configSymbols) {
                const existingSymbol = existingSymbolsMap.get(symbolName);

                if (existingSymbol) {
                    // Use existing database record
                    mergedSymbols.push(existingSymbol);
                } else {
                    // Create new record structure (will be inserted later)
                    mergedSymbols.push({
                        symbol_name: symbolName,
                        symbol_type: assetType,
                        price: null,
                        added_at: new Date().toISOString(),
                        last_updated: new Date().toISOString()
                    });
                }
            }

            return mergedSymbols;
        } catch (err) {
            throw err;
        }
    }

    // Get specific tracked symbol
    static async getTrackedSymbol(symbol, assetType) {
        try {
            // First check if symbol is in hardcoded config
            if (!isSymbolTracked(symbol, assetType)) {
                return null;
            }

            // Get from database
            const { data, error } = await supabase
                .from('symbols')
                .select('*')
                .eq('symbol_name', symbol)
                .eq('symbol_type', assetType)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned, symbol doesn't exist in database yet
                    return null;
                }
                throw new Error(`Database error: ${error.message}`);
            }

            return data;
        } catch (err) {
            throw err;
        }
    }

    // Add tracked symbol (now validates against hardcoded config)
    static async addTrackedSymbol(symbol, assetType) {
        try {
            // Validate asset type
            if (!['forex', 'crypto', 'indices'].includes(assetType)) {
                throw new Error('Invalid asset type. Must be forex, crypto, or indices');
            }

            // Check if symbol is in hardcoded config
            if (!isSymbolTracked(symbol, assetType)) {
                throw new Error(`Symbol ${symbol} is not in the tracked symbols list for ${assetType}`);
            }

            // Check if symbol already exists in database
            const existing = await this.getTrackedSymbol(symbol, assetType);
            if (existing) {
                throw new Error(`Symbol ${symbol} is already in the database for ${assetType}`);
            }

            // Add to database
            const { data, error } = await supabase
                .from('symbols')
                .insert({
                    symbol_name: symbol.toUpperCase(),
                    symbol_type: assetType,
                    price: null,
                    added_at: new Date().toISOString(),
                    last_updated: new Date().toISOString()
                });

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            return { symbol_name: symbol, symbol_type: assetType, price: null };
        } catch (err) {
            throw err;
        }
    }

    // Update tracked symbol
    static async updateTrackedSymbol(symbol, assetType, updates) {
        try {
            // Check if symbol is in hardcoded config
            if (!isSymbolTracked(symbol, assetType)) {
                throw new Error(`Symbol ${symbol} is not in the tracked symbols list for ${assetType}`);
            }

            const { data, error } = await supabase
                .from('symbols')
                .update(updates)
                .eq('symbol_name', symbol.toUpperCase())
                .eq('symbol_type', assetType);

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            return data;
        } catch (err) {
            throw err;
        }
    }

    // Remove tracked symbol (now validates against hardcoded config)
    static async removeTrackedSymbol(symbol, assetType) {
        try {
            // Check if symbol is in hardcoded config
            if (!isSymbolTracked(symbol, assetType)) {
                throw new Error(`Symbol ${symbol} is not in the tracked symbols list for ${assetType}`);
            }

            const { data, error } = await supabase
                .from('symbols')
                .delete()
                .eq('symbol_name', symbol.toUpperCase())
                .eq('symbol_type', assetType);

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            return data;
        } catch (err) {
            throw err;
        }
    }

    // Get tracking statistics
    static async getTrackingStats() {
        try {
            const totalConfigSymbols = getAllSymbols().length;
            const forexCount = getSymbolCountByType('forex');
            const cryptoCount = getSymbolCountByType('crypto');
            const indicesCount = getSymbolCountByType('indices');

            // Get database statistics
            const { data: dbSymbols, error } = await supabase
                .from('symbols')
                .select('symbol_type');

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            const dbStats = {
                forex: 0,
                crypto: 0,
                indices: 0
            };

            if (dbSymbols) {
                dbSymbols.forEach(symbol => {
                    if (dbStats.hasOwnProperty(symbol.symbol_type)) {
                        dbStats[symbol.symbol_type]++;
                    }
                });
            }

            return {
                config: {
                    total: totalConfigSymbols,
                    forex: forexCount,
                    crypto: cryptoCount,
                    indices: indicesCount
                },
                database: {
                    total: Object.values(dbStats).reduce((a, b) => a + b, 0),
                    forex: dbStats.forex,
                    crypto: dbStats.crypto,
                    indices: dbStats.indices
                }
            };
        } catch (err) {
            throw err;
        }
    }

    // Get all symbols (now uses hardcoded config)
    static async getAllSymbols() {
        return getAllSymbols();
    }
}
