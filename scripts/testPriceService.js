import PriceService from '../services/priceService.js';
import { Logger } from '../utils/logger.js';
import InstrumentRepository from '../repositories/InstrumentRepository.js';

const logger = new Logger('PriceServiceTest');
const instrumentRepository = new InstrumentRepository();

async function testPriceService() {
  try {
    logger.info('Testing PriceService...');
    
    // First, let's see what instruments are available
    logger.info('Fetching all instruments...');
    const instruments = await instrumentRepository.getAllInstruments();
    logger.info(`Found ${instruments.length} instruments`);
    
    if (instruments.length === 0) {
      logger.error('No instruments found in database');
      return;
    }
    
    // Try different types of instruments
    const testInstruments = [
      instruments.find(instr => instr.symbol === 'BTCUSDT'), // Crypto
      instruments.find(instr => instr.symbol === 'EURUSD'),  // Forex
      instruments.find(instr => instr.symbol === 'XAUUSD'),  // Metal
      instruments.find(instr => instr.symbol === 'GBPUSD'),  // Forex
      instruments.find(instr => instr.symbol === 'ETHUSDT')  // Crypto
    ].filter(Boolean); // Remove undefined entries
    
    logger.info(`Testing with ${testInstruments.length} instruments:`);
    testInstruments.forEach(instr => {
      logger.info(`- ${instr.symbol} (ID: ${instr.id})`);
    });
    
    for (const testInstrument of testInstruments) {
      try {
        logger.info(`\n=== Testing ${testInstrument.symbol} ===`);
        const price = await PriceService.getCurrentPrice(testInstrument.id);
        logger.info(`✅ Success! Current price for ${testInstrument.symbol}: ${price}`);
      } catch (error) {
        logger.error(`❌ Failed to get price for ${testInstrument.symbol}: ${error.message}`);
      }
    }
    
  } catch (error) {
    logger.error('Test failed:', error);
  }
}

// Run the test
testPriceService();
