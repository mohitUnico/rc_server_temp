import { SymbolManagementService } from '../services/symbolManagementService.js';

const defaultSymbols = {
    forex: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'XAUUSD', 'XAGUSD'],
    crypto: ['BTCUSD', 'ETHUSD', 'ADAUSD', 'DOTUSD', 'LINKUSD', 'LTCUSD', 'BCHUSD'],
    indices: ['SPX500', 'NAS100', 'DOW30', 'FTSE100', 'DAX30', 'NIK225', 'ASX200']
};

async function initializeDefaultSymbols() {
    try {
        console.log('🚀 Initializing default symbols...');
        let totalAdded = 0;

        for (const [assetType, symbols] of Object.entries(defaultSymbols)) {
            console.log(`📊 Processing ${assetType} symbols...`);

            for (const symbol of symbols) {
                try {
                    await SymbolManagementService.addTrackedSymbol(symbol, assetType);
                    totalAdded++;
                    console.log(`   ✅ ${symbol} added to ${assetType}`);
                } catch (error) {
                    if (error.message.includes('already being tracked')) {
                        console.log(`   ℹ️ ${symbol} already tracked in ${assetType}`);
                    } else {
                        console.error(`   ❌ Failed to add ${symbol}: ${error.message}`);
                    }
                }
            }
        }

        console.log(`🎉 Initialization complete! Total symbols added: ${totalAdded}`);

        // Show final statistics
        const stats = await SymbolManagementService.getTrackingStats();
        console.log('📊 Final tracking statistics:', stats);

    } catch (error) {
        console.error('❌ Initialization failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Check your Supabase credentials in .env file');
        console.log('   2. Ensure the symbols table exists in your Supabase database');
        console.log('   3. Verify the table has the correct columns: symbol_name, symbol_type, price, added_at, last_updated');
        console.log('   4. Check your internet connection and Supabase service status');
    }
}

// Run the initialization
initializeDefaultSymbols();
