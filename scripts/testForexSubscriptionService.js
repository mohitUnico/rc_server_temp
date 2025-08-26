import forexSubscriptionService from '../services/forexSubscriptionService.js';
import { getAllForexSymbols, getForexSymbolsByCategory } from '../config/forexSymbols.js';

console.log('🧪 Testing Forex Subscription Service\n');

// Test 1: Check service initialization
console.log('1️⃣ Service Status:');
const status = forexSubscriptionService.getSubscriptionStatus();
console.log(`   - Is Subscribed: ${status.isSubscribed}`);
console.log(`   - Total Symbols: ${status.totalSymbols}`);
console.log(`   - Total Batches: ${status.totalBatches}`);
console.log(`   - Current Batch Index: ${status.currentBatchIndex}\n`);

// Test 2: Check all symbols
console.log('2️⃣ All Forex Symbols:');
const allSymbols = getAllForexSymbols();
console.log(`   - Total symbols: ${allSymbols.length}`);
console.log(`   - First 10 symbols: ${allSymbols.slice(0, 10).join(', ')}`);
console.log(`   - Last 10 symbols: ${allSymbols.slice(-10).join(', ')}\n`);

// Test 3: Check symbol categories
console.log('3️⃣ Symbol Categories:');
const categories = getForexSymbolsByCategory();
Object.entries(categories).forEach(([category, symbols]) => {
    console.log(`   - ${category}: ${symbols.length} symbols`);
});
console.log('');

// Test 4: Check batch structure
console.log('4️⃣ Batch Structure:');
for (let i = 0; i < forexSubscriptionService.subscriptionBatches.length; i++) {
    const batch = forexSubscriptionService.getSymbolsByBatch(i);
    console.log(`   - Batch ${i + 1}: ${batch.length} symbols - ${batch.join(', ')}`);
}
console.log('');

// Test 5: Test subscription message format
console.log('5️⃣ Subscription Message Format:');
const firstBatch = forexSubscriptionService.getSymbolsByBatch(0);
const params = firstBatch.map(symbol => `${symbol}$gb`).join(',');
const message = {
    ac: 'subscribe',
    params: params,
    types: 'quote'
};
console.log(`   - First batch message: ${JSON.stringify(message, null, 2)}`);
console.log('');

// Test 6: Test unsubscription message format
console.log('6️⃣ Unsubscription Message Format:');
const unsubMessage = {
    ac: 'unsubscribe',
    params: params,
    types: 'quote'
};
console.log(`   - First batch unsub message: ${JSON.stringify(unsubMessage, null, 2)}`);
console.log('');

// Test 7: Service methods
console.log('7️⃣ Service Methods:');
console.log(`   - getAllSymbols(): ${forexSubscriptionService.getAllSymbols().length} symbols`);
console.log(`   - getSymbolsByBatch(0): ${forexSubscriptionService.getSymbolsByBatch(0).length} symbols`);
console.log(`   - getSymbolsByBatch(9): ${forexSubscriptionService.getSymbolsByBatch(9).length} symbols`);

console.log('\n✅ Forex Subscription Service test completed successfully!');
console.log('\n📋 Summary:');
console.log(`   - Total forex symbols: ${allSymbols.length}`);
console.log(`   - Batches: ${forexSubscriptionService.subscriptionBatches.length}`);
console.log(`   - Symbols per batch: 8`);
console.log(`   - Region: gb (Great Britain)`);
console.log(`   - Message type: quote`);
console.log(`   - Auto-subscription: After WebSocket connection`);
console.log(`   - Batch delay: 1 second between batches`);
