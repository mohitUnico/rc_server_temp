// Forex symbols configuration
export const forexSymbols = {
    EURUSD: "Euro vs US Dollar",
    GBPUSD: "British Pound vs US Dollar",
    USDJPY: "US Dollar vs Japanese Yen",
    AUDUSD: "Australian Dollar vs US Dollar",
    USDCAD: "US Dollar vs Canadian Dollar",
    USDCHF: "US Dollar vs Swiss Franc",
    NZDUSD: "New Zealand Dollar vs US Dollar",
    EURTRY: "Euro vs Turkish Lira",
    EURPLN: "Euro vs Polish Zloty",
    EURZAR: "Euro vs South African Rand",
    EURHUF: "Euro vs Hungarian Forint",
    EURCZK: "Euro vs Czech Koruna",
    EURSGD: "Euro vs Singapore Dollar",
    EURHKD: "Euro vs Hong Kong Dollar",
    EURRUB: "Euro vs Russian Ruble",
    EURMXN: "Euro vs Mexican Peso",
    GBPSEK: "British Pound vs Swedish Krona",
    GBPNOK: "British Pound vs Norwegian Krone",
    GBPTRY: "British Pound vs Turkish Lira",
    GBPZAR: "British Pound vs South African Rand",
    GBPPLN: "British Pound vs Polish Zloty",
    GBPHKD: "British Pound vs Hong Kong Dollar",
    GBPSGD: "British Pound vs Singapore Dollar",
    AUDHKD: "Australian Dollar vs Hong Kong Dollar",
    AUDTHB: "Australian Dollar vs Thai Baht",
    NZDSGD: "New Zealand Dollar vs Singapore Dollar",
    CADSGD: "Canadian Dollar vs Singapore Dollar",
    EURGBP: "Euro vs British Pound",
    EURCHF: "Euro vs Swiss Franc",
    EURCAD: "Euro vs Canadian Dollar",
    EURAUD: "Euro vs Australian Dollar",
    EURNZD: "Euro vs New Zealand Dollar",
    EURJPY: "Euro vs Japanese Yen",
    GBPCHF: "British Pound vs Swiss Franc",
    GBPCAD: "British Pound vs Canadian Dollar",
    GBPAUD: "British Pound vs Australian Dollar",
    GBPNZD: "British Pound vs New Zealand Dollar",
    GBPJPY: "British Pound vs Japanese Yen",
    AUDNZD: "Australian Dollar vs New Zealand Dollar",
    AUDJPY: "Australian Dollar vs Japanese Yen",
    AUDCAD: "Australian Dollar vs Canadian Dollar",
    AUDCHF: "Australian Dollar vs Swiss Franc",
    NZDJPY: "New Zealand Dollar vs Japanese Yen",
    NZDCAD: "New Zealand Dollar vs Canadian Dollar",
    NZDCHF: "New Zealand Dollar vs Swiss Franc",
    CADCHF: "Canadian Dollar vs Swiss Franc",
    CADJPY: "Canadian Dollar vs Japanese Yen",
    CHFJPY: "Swiss Franc vs Japanese Yen",
    USDARS: "US Dollar vs Argentine Peso",
    EURSEK: "Euro vs Swedish Krona",
    EURNOK: "Euro vs Norwegian Krone",
    AUDSGD: "Australian Dollar vs Singapore Dollar",
    USDSEK: "US Dollar vs Swedish Krona",
    USDNOK: "US Dollar vs Norwegian Krone",
    USDDKK: "US Dollar vs Danish Krone",
    USDSGD: "US Dollar vs Singapore Dollar",
    USDHKD: "US Dollar vs Hong Kong Dollar",
    USDZAR: "US Dollar vs South African Rand",
    USDTRY: "US Dollar vs Turkish Lira",
    USDTHB: "US Dollar vs Thai Baht",
    USDMXN: "US Dollar vs Mexican Peso",
    USDCZK: "US Dollar vs Czech Koruna",
    USDHUF: "US Dollar vs Hungarian Forint",
    USDPLN: "US Dollar vs Polish Zloty",
    USDRUB: "US Dollar vs Russian Ruble",
    USDBRL: "US Dollar vs Brazilian Real",
    USDILS: "US Dollar vs Israeli Shekel",
    USDCLP: "US Dollar vs Chilean Peso",
    USDGEL: "US Dollar vs Georgian Lari",
    CHFSGD: "Swiss Franc vs Singapore Dollar",
    XAGAUD: "Silver vs Australian Dollar",
    XAGEUR: "Silver vs Euro",
    XAGUSD: "Silver vs US Dollar",
    XAUAUD: "Gold vs Australian Dollar",
    XAUCHF: "Gold vs Swiss Franc",
    XAUEUR: "Gold vs Euro",
    XAUGBP: "Gold vs British Pound",
    XAUUSD: "Gold vs US Dollar",
    XPDUSD: "Palladium vs US Dollar",
    XPTUSD: "Platinum vs US Dollar"
};

// Get all forex symbol names as an array
export function getAllForexSymbols() {
    return Object.keys(forexSymbols);
}

// Get symbol description
export function getForexSymbolDescription(symbol) {
    return forexSymbols[symbol] || 'Unknown Forex Symbol';
}

// Helper function to check if a symbol is valid
export function isValidForexSymbol(symbol) {
    return symbol in forexSymbols;
}

// Helper function to get symbols by category
export function getForexSymbolsByCategory() {
    return {
        major: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD'],
        euro: ['EURTRY', 'EURPLN', 'EURZAR', 'EURHUF', 'EURCZK', 'EURSGD', 'EURHKD', 'EURRUB', 'EURMXN', 'EURGBP', 'EURCHF', 'EURCAD', 'EURAUD', 'EURNZD', 'EURJPY', 'EURSEK', 'EURNOK'],
        pound: ['GBPSEK', 'GBPNOK', 'GBPTRY', 'GBPZAR', 'GBPPLN', 'GBPHKD', 'GBPSGD', 'GBPCHF', 'GBPCAD', 'GBPAUD', 'GBPNZD', 'GBPJPY'],
        australian: ['AUDHKD', 'AUDTHB', 'AUDNZD', 'AUDJPY', 'AUDCAD', 'AUDCHF', 'AUDSGD'],
        newZealand: ['NZDSGD', 'NZDJPY', 'NZDCAD', 'NZDCHF'],
        canadian: ['CADSGD', 'CADCHF', 'CADJPY'],
        swiss: ['CHFJPY', 'CHFSGD'],
        usd: ['USDARS', 'USDSEK', 'USDNOK', 'USDDKK', 'USDSGD', 'USDHKD', 'USDZAR', 'USDTRY', 'USDTHB', 'USDMXN', 'USDCZK', 'USDHUF', 'USDPLN', 'USDRUB', 'USDBRL', 'USDILS', 'USDCLP', 'USDGEL'],
        commodities: ['XAGAUD', 'XAGEUR', 'XAGUSD', 'XAUAUD', 'XAUCHF', 'XAUEUR', 'XAUGBP', 'XAUUSD', 'XPDUSD', 'XPTUSD']
    };
}
