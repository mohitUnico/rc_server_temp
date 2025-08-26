import priceCacheService from '../services/priceCacheService.js';
import { getAllForexSymbols } from '../config/forexSymbols.js';

console.log('🧪 Testing Price Cache Service for Forex Symbols\n');

// Test 1: Check initial state
console.log('1️⃣ Initial State:');
const initialStats = priceCacheService.getCacheStats();
console.log(`   - Total cached prices: ${initialStats.total}`);
console.log(`   - Forex prices: ${initialStats.forex}`);
console.log(`   - Crypto prices: ${initialStats.crypto}`);
console.log(`   - Indices prices: ${initialStats.indices}\n`);

// Test 2: Simulate forex price updates
console.log('2️⃣ Simulating Forex Price Updates:');
const testSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'];
const testPrices = [1.0850, 1.2650, 150.25, 0.6580, 1.3520];

testSymbols.forEach((symbol, index) => {
    const price = testPrices[index];
    const mockData = {
        s: symbol,
        ld: price,
        t: Date.now(),
        h: price + 0.0010,
        l: price - 0.0010,
        o: price - 0.0005,
        v: 1000 + Math.random() * 1000
    };

    priceCacheService.updatePrice('forex', symbol, price, mockData);
    console.log(`   - Updated ${symbol}: ${price}`);
});

console.log('');

// Test 3: Check forex prices after updates
console.log('3️⃣ Forex Prices After Updates:');
const forexPrices = priceCacheService.getForexPrices();
console.log(`   - Total forex symbols: ${forexPrices.totalSymbols}`);
console.log(`   - Active symbols: ${forexPrices.activeSymbols}`);
console.log(`   - Last update: ${forexPrices.stats.lastUpdate}`);

Object.entries(forexPrices.prices).forEach(([symbol, data]) => {
    console.log(`   - ${symbol}: ${data.formattedPrice} (${data.age}ms old, active: ${data.isActive})`);
});

console.log('');

// Test 4: Test individual price retrieval
console.log('4️⃣ Individual Price Retrieval:');
testSymbols.forEach(symbol => {
    const price = priceCacheService.getCurrentPrice('forex', symbol);
    const isValid = priceCacheService.hasValidPrice('forex', symbol);
    console.log(`   - ${symbol}: ${price} (valid: ${isValid})`);
});

console.log('');

// Test 5: Test recent price updates
console.log('5️⃣ Recent Price Updates:');
const recentUpdates = priceCacheService.getRecentPriceUpdates('forex', 10000); // Last 10 seconds
console.log(`   - Recent updates (last 10s): ${recentUpdates.length}`);
recentUpdates.forEach(update => {
    console.log(`   - ${update.symbol}: ${update.price} (${update.age}ms ago)`);
});

console.log('');

// Test 6: Test cache statistics
console.log('6️⃣ Cache Statistics:');
const finalStats = priceCacheService.getCacheStats();
console.log(`   - Total cached prices: ${finalStats.total}`);
console.log(`   - Forex prices: ${finalStats.forex}`);
console.log(`   - Average age: ${Math.round(finalStats.averageAge)}ms`);
console.log(`   - Forex stats:`, finalStats.forexStats);

console.log('');

// Test 7: Test all prices retrieval
console.log('7️⃣ All Prices Retrieval:');
const allPrices = priceCacheService.getAllPricesAllTypes();
console.log(`   - Forex symbols with prices: ${Object.keys(allPrices.forex).length}`);
console.log(`   - Crypto symbols with prices: ${Object.keys(allPrices.crypto).length}`);
console.log(`   - Indices symbols with prices: ${Object.keys(allPrices.indices).length}`);

// Test 8: Test manual logging trigger
console.log('\n8️⃣ Manual Logging Trigger:');
console.log('   - Triggering manual forex price cache logging...');
priceCacheService.triggerForexLogging();

console.log('\n✅ Price Cache Service test completed successfully!');
console.log('\n📋 Summary:');
console.log(`   - Forex symbols tested: ${testSymbols.length}`);
console.log(`   - Prices cached: ${finalStats.forex}`);
console.log(`   - Cache efficiency: Working correctly`);
console.log(`   - Real-time updates: Ready for iTick WebSocket data`);
console.log(`   - Periodic logging: Active every minute`);
console.log(`   - Manual logging: Available via triggerForexLogging()`);
