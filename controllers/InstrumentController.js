import { Logger } from '../utils/logger.js';
import InstrumentRepository from '../repositories/InstrumentRepository.js';

const logger = new Logger('InstrumentController');
const instrumentRepository = new InstrumentRepository();

class InstrumentController {
  // Get all instruments
  static async getAll(req, res) {
    try {
      const instruments = await instrumentRepository.getAllInstruments();
      return res.json({ data: instruments });
    } catch (error) {
      logger.error('getAll failed', error);
      return res.status(400).json({ error: error.message });
    }
  }

  // Get instrument by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'id is required' });
      
      const instrument = await instrumentRepository.findInstrumentById(id);
      if (!instrument) return res.status(404).json({ error: 'Instrument not found' });
      
      return res.json({ data: instrument });
    } catch (error) {
      logger.error('getById failed', error);
      return res.status(400).json({ error: error.message });
    }
  }

  // Get instruments by category
  static async getByCategory(req, res) {
    try {
      const { category } = req.params;
      if (!category) return res.status(400).json({ error: 'category is required' });
      
      const instruments = await instrumentRepository.findInstrumentsByCategory(category);
      return res.json({ data: instruments });
    } catch (error) {
      logger.error('getByCategory failed', error);
      return res.status(400).json({ error: error.message });
    }
  }

  // Get instrument by symbol
  static async getBySymbol(req, res) {
    try {
      const { symbol } = req.params;
      if (!symbol) return res.status(400).json({ error: 'symbol is required' });
      
      const instrument = await instrumentRepository.findInstrumentBySymbol(symbol);
      if (!instrument) return res.status(404).json({ error: 'Instrument not found' });
      
      return res.json({ data: instrument });
    } catch (error) {
      logger.error('getBySymbol failed', error);
      return res.status(400).json({ error: error.message });
    }
  }

  // Get all categories
  static async getCategories(req, res) {
    try {
      const categories = await instrumentRepository.getAllCategories();
      return res.json({ data: categories });
    } catch (error) {
      logger.error('getCategories failed', error);
      return res.status(400).json({ error: error.message });
    }
  }
}

export default InstrumentController;
