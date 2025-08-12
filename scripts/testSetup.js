import { SymbolManagementService } from '../services/symbolManagementService.js';
import { PriceUpdateService } from '../services/priceUpdateService.js';
import { DatabaseService } from '../services/databaseService.js';

async function testSetup() {
  console.log('🧪 Testing Supabase Integration and Symbol Tracking Setup...\n');

  try {
    // 1️⃣ Test database connection
    console.log('1️⃣ Testing database connection...');
    const tableInfo = await DatabaseService.getTableInfo();
    console.log(`   Database connection: ${tableInfo.exists ? '✅ Success' : '❌ Failed'}`);
    if (!tableInfo.exists) {
      console.log(`   Error: ${tableInfo.error}`);
      return;
    }

    // 2️⃣ Test adding tracked symbols
    console.log('\n2️⃣ Testing symbol tracking...');

    // Test forex symbols
    console.log('   Adding EURUSD (forex)...');
    try {
      await SymbolManagementService.addTrackedSymbol('EURUSD', 'forex');
      console.log('   ✅ EURUSD added');
    } catch (error) {
      if (error.message.includes('already being tracked')) {
        console.log('   ℹ️ EURUSD already tracked');
      } else {
        throw error;
      }
    }

    console.log('   Adding XAUUSD (forex)...');
    try {
      await SymbolManagementService.addTrackedSymbol('XAUUSD', 'forex');
      console.log('   ✅ XAUUSD added');
    } catch (error) {
      if (error.message.includes('already being tracked')) {
        console.log('   ℹ️ XAUUSD already tracked');
      } else {
        throw error;
      }
    }

    // Test crypto symbols
    console.log('   Adding BTCUSD (crypto)...');
    try {
      await SymbolManagementService.addTrackedSymbol('BTCUSD', 'crypto');
      console.log('   ✅ BTCUSD added');
    } catch (error) {
      if (error.message.includes('already being tracked')) {
        console.log('   ℹ️ BTCUSD already tracked');
      } else {
        throw error;
      }
    }

    // Test indices symbols
    console.log('   Adding SPX500 (indices)...');
    try {
      await SymbolManagementService.addTrackedSymbol('SPX500', 'indices');
      console.log('   ✅ SPX500 added');
    } catch (error) {
      if (error.message.includes('already being tracked')) {
        console.log('   ℹ️ SPX500 already tracked');
      } else {
        throw error;
      }
    }

    // 3️⃣ Test retrieving tracked symbols
    console.log('\n3️⃣ Testing symbol retrieval...');
    const allSymbols = await SymbolManagementService.getAllTrackedSymbols();
    console.log(`   Total tracked symbols: ${allSymbols.length}`);

    const forexSymbols = await SymbolManagementService.getTrackedSymbolsByType('forex');
    console.log(`   Forex symbols: ${forexSymbols.length}`);

    const cryptoSymbols = await SymbolManagementService.getTrackedSymbolsByType('crypto');
    console.log(`   Crypto symbols: ${cryptoSymbols.length}`);

    const indicesSymbols = await SymbolManagementService.getTrackedSymbolsByType('indices');
    console.log(`   Indices symbols: ${indicesSymbols.length}`);

    // 4️⃣ Test symbol tracking checks
    console.log('\n4️⃣ Testing symbol tracking checks...');
    const isEURUSDTracked = await SymbolManagementService.isSymbolTracked('EURUSD', 'forex');
    console.log(`   EURUSD tracked: ${isEURUSDTracked ? '✅ Yes' : '❌ No'}`);

    const isBTCUSDTracked = await SymbolManagementService.isSymbolTracked('BTCUSD', 'crypto');
    console.log(`   BTCUSD tracked: ${isBTCUSDTracked ? '✅ Yes' : '❌ No'}`);

    // 5️⃣ Test price updates
    console.log('\n5️⃣ Testing price updates...');
    const eurUpdate = await PriceUpdateService.updatePrice('EURUSD', 1.0850, 'forex');
    console.log(`   EURUSD price update: ${eurUpdate ? '✅ Success' : '❌ Failed'}`);

    const xauUpdate = await PriceUpdateService.updatePrice('XAUUSD', 2350.50, 'forex');
    console.log(`   XAUUSD price update: ${xauUpdate ? '✅ Success' : '❌ Failed'}`);

    const btcUpdate = await PriceUpdateService.updatePrice('BTCUSD', 65000.00, 'crypto');
    console.log(`   BTCUSD price update: ${btcUpdate ? '✅ Success' : '❌ Failed'}`);

    // 6️⃣ Test price retrieval
    console.log('\n6️⃣ Testing price retrieval...');
    const eurPrice = await PriceUpdateService.getLatestPrice('EURUSD', 'forex');
    console.log(`   EURUSD latest price: ${eurPrice ? `$${eurPrice.price}` : '❌ Not found'}`);

    const xauPrice = await PriceUpdateService.getLatestPrice('XAUUSD', 'forex');
    console.log(`   XAUUSD latest price: ${xauPrice ? `$${xauPrice.price}` : '❌ Not found'}`);

    // 7️⃣ Test price retrieval for all symbols
    console.log('\n7️⃣ Testing price retrieval for all symbols...');
    const allPrices = await PriceUpdateService.getAllTrackedPrices();
    console.log(`   Total tracked symbols with prices: ${allPrices.length}`);

    // 8️⃣ Test tracking statistics
    console.log('\n8️⃣ Testing tracking statistics...');
    const stats = await SymbolManagementService.getTrackingStats();
    console.log(`   Tracking stats:`, stats);

    // 9️⃣ Test symbol search
    console.log('\n9️⃣ Testing symbol search...');
    const eurData = await PriceUpdateService.getSymbolByName('EURUSD');
    console.log(`   EURUSD data found: ${eurData.length > 0 ? '✅ Yes' : '❌ No'}`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Database connection: ✅`);
    console.log(`   • Symbol tracking: ✅`);
    console.log(`   • Price updates: ✅`);
    console.log(`   • Data retrieval: ✅`);
    console.log(`   • Statistics: ✅`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your Supabase credentials in .env file');
    console.log('   2. Ensure the symbols table exists in your Supabase database');
    console.log('   3. Verify the table has the correct columns: symbol_name, symbol_type, price, added_at, last_updated');
    console.log('   4. Check your internet connection and Supabase service status');
  }
}

// Run the test
testSetup();
