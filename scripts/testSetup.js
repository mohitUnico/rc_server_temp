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

    console.log('\n🎉 Setup check completed!');
    console.log('\n📋 Summary:');
    console.log(`   • Database connection: ✅`);

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
