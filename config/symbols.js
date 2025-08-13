// config/symbols.js
// Centralized configuration for all tracked symbols

export const TRACKED_SYMBOLS = {
    forex: [
        'EURUSD',    // Euro/US Dollar
        'GBPUSD',    // British Pound/US Dollar
        'USDJPY',    // US Dollar/Japanese Yen
        'AUDUSD',    // Australian Dollar/US Dollar
        'USDCAD',    // US Dollar/Canadian Dollar
        'NZDUSD',    // New Zealand Dollar/US Dollar
        'USDCHF',    // US Dollar/Swiss Franc
        'XAUUSD',    // Gold/US Dollar
        'XAGUSD',    // Silver/US Dollar
        'EURGBP',    // Euro/British Pound
        'EURJPY',    // Euro/Japanese Yen
        'GBPJPY',    // British Pound/Japanese Yen
        'AUDJPY',    // Australian Dollar/Japanese Yen
        'CADJPY',    // Canadian Dollar/Japanese Yen
        'NZDJPY',    // New Zealand Dollar/Japanese Yen
        'GBPCAD',    // British Pound/Canadian Dollar
        'GBPCHF',    // British Pound/Swiss Franc
        'TWDUSD',    // Taiwan Dollar/US Dollar
        'USDAED'     // US Dollar/UAE Dirham
    ],

    crypto: [
        'BTCUSD',    // Bitcoin/US Dollar
        'ETHUSD',    // Ethereum/US Dollar
        'ADAUSD',    // Cardano/US Dollar
        'DOTUSD',    // Polkadot/US Dollar
        'LINKUSD',   // Chainlink/US Dollar
        'LTCUSD',    // Litecoin/US Dollar
        'BCHUSD',    // Bitcoin Cash/US Dollar
        'XRPUSD',    // Ripple/US Dollar
        'SOLUSD',    // Solana/US Dollar
        'MATICUSD',  // Polygon/US Dollar
        'AVAXUSD',   // Avalanche/US Dollar
        'UNIUSD',    // Uniswap/US Dollar
        'ATOMUSD',   // Cosmos/US Dollar
        'NEARUSD',   // NEAR Protocol/US Dollar
        'FTMUSD'     // Fantom/US Dollar
    ],

    indices: [
        'SPX500',    // S&P 500
        'NAS100',    // NASDAQ 100
        'US30',      // Dow Jones Industrial Average
        'GER30',     // DAX (Germany)
        'UK100',     // FTSE 100 (UK)
        'FRA40',     // CAC 40 (France)
        'JPN225',    // Nikkei 225 (Japan)
        'AUS200',    // ASX 200 (Australia)
        'CAN60',     // S&P/TSX 60 (Canada)
        'SWI20',     // SMI (Switzerland)
        'ITA40',     // FTSE MIB (Italy)
        'ESP35',     // IBEX 35 (Spain)
        'NLD25',     // AEX (Netherlands)
        'SWE30',     // OMX Stockholm 30
        'NOR25'      // OBX (Norway)
    ]
};

// Get all symbols as a flat array
export function getAllSymbols() {
    return Object.values(TRACKED_SYMBOLS).flat();
}

// Get symbols by asset type
export function getSymbolsByType(assetType) {
    return TRACKED_SYMBOLS[assetType] || [];
}

// Check if a symbol is tracked
export function isSymbolTracked(symbol, assetType) {
    // Handle symbols with suffixes (.a, .i, .ins)
    const cleanSymbol = symbol.split('.')[0].toUpperCase();

    // Check in the specified asset type first
    if (assetType && TRACKED_SYMBOLS[assetType]) {
        if (TRACKED_SYMBOLS[assetType].includes(cleanSymbol)) {
            return true;
        }
    }

    // If no asset type specified or not found, check all asset types
    for (const [type, symbols] of Object.entries(TRACKED_SYMBOLS)) {
        if (symbols.includes(cleanSymbol)) {
            return true;
        }
    }

    return false;
}

// Get asset type for a symbol
export function getAssetTypeForSymbol(symbol) {
    const cleanSymbol = symbol.split('.')[0].toUpperCase();

    for (const [assetType, symbols] of Object.entries(TRACKED_SYMBOLS)) {
        if (symbols.includes(cleanSymbol)) {
            return assetType;
        }
    }
    return null;
}

// Get total count of tracked symbols
export function getTotalSymbolCount() {
    return Object.values(TRACKED_SYMBOLS).reduce((total, symbols) => total + symbols.length, 0);
}

// Get symbol count by asset type
export function getSymbolCountByType(assetType) {
    return TRACKED_SYMBOLS[assetType]?.length || 0;
}

// Export default for easy importing
export default TRACKED_SYMBOLS;
