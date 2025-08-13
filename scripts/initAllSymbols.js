#!/usr/bin/env node

// scripts/initAllSymbols.js
// Initialize all hardcoded symbols in the database

import { TRACKED_SYMBOLS, getAllSymbols, getSymbolsByType } from '../config/symbols.js';
import { supabase } from '../config/supabase.js';

async function initializeAllSymbols() {
    console.log('🚀 Initializing all tracked symbols in database...');
    console.log('📊 Total symbols to initialize:', getAllSymbols().length);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    try {
        // Process each asset type
        for (const [assetType, symbols] of Object.entries(TRACKED_SYMBOLS)) {
            console.log(`\n📈 Processing ${assetType.toUpperCase()} symbols (${symbols.length} symbols):`);

            for (const symbol of symbols) {
                try {
                    // Check if symbol already exists
                    const { data: existing, error: checkError } = await supabase
                        .from('symbols')
                        .select('symbol_name')
                        .eq('symbol_name', symbol)
                        .eq('symbol_type', assetType)
                        .single();

                    if (checkError && checkError.code !== 'PGRST116') {
                        // Real error occurred
                        throw checkError;
                    }

                    if (existing) {
                        console.log(`  ℹ️  ${symbol} already exists, skipping`);
                        skipCount++;
                        continue;
                    }

                    // Insert new symbol
                    const { error: insertError } = await supabase
                        .from('symbols')
                        .insert({
                            symbol_name: symbol,
                            symbol_type: assetType,
                            price: null,
                            added_at: new Date().toISOString(),
                            last_updated: new Date().toISOString()
                        });

                    if (insertError) {
                        console.error(`  ❌ Failed to insert ${symbol}:`, insertError.message);
                        errorCount++;
                    } else {
                        console.log(`  ✅ Added ${symbol}`);
                        successCount++;
                    }

                } catch (err) {
                    console.error(`  ❌ Error processing ${symbol}:`, err.message);
                    errorCount++;
                }
            }
        }

        // Summary
        console.log('\n🎉 Symbol initialization completed!');
        console.log('📊 Summary:');
        console.log(`  ✅ Successfully added: ${successCount}`);
        console.log(`  ℹ️  Already existed: ${skipCount}`);
        console.log(`  ❌ Errors: ${errorCount}`);
        console.log(`  📈 Total processed: ${successCount + skipCount + errorCount}`);

        // Verify final count
        const { data: finalCount, error: countError } = await supabase
            .from('symbols')
            .select('symbol_name', { count: 'exact' });

        if (!countError) {
            console.log(`  🗄️  Total symbols in database: ${finalCount.length}`);
        }

    } catch (err) {
        console.error('❌ Fatal error during initialization:', err);
        process.exit(1);
    }
}

// Run the initialization
initializeAllSymbols().catch(console.error);
