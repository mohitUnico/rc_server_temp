#!/usr/bin/env node

// scripts/manageSymbols.js
// Manage symbols in the hardcoded configuration

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYMBOLS_FILE = path.join(__dirname, '../config/symbols.js');

function readSymbolsFile() {
    try {
        const content = fs.readFileSync(SYMBOLS_FILE, 'utf8');
        return content;
    } catch (err) {
        console.error('❌ Error reading symbols file:', err.message);
        process.exit(1);
    }
}

function writeSymbolsFile(content) {
    try {
        fs.writeFileSync(SYMBOLS_FILE, content, 'utf8');
        console.log('✅ Symbols file updated successfully');
    } catch (err) {
        console.error('❌ Error writing symbols file:', err.message);
        process.exit(1);
    }
}

function addSymbol(symbol, assetType) {
    if (!['forex', 'crypto', 'indices'].includes(assetType)) {
        console.error('❌ Invalid asset type. Must be forex, crypto, or indices');
        process.exit(1);
    }

    const content = readSymbolsFile();

    // Check if symbol already exists
    if (content.includes(`'${symbol.toUpperCase()}'`)) {
        console.log(`ℹ️  Symbol ${symbol.toUpperCase()} already exists in ${assetType}`);
        return;
    }

    // Find the array for the asset type
    const assetTypePattern = new RegExp(`(${assetType}:\\s*\\[)([^\\]]*)(\\])`, 's');
    const match = content.match(assetTypePattern);

    if (!match) {
        console.error(`❌ Could not find ${assetType} array in symbols file`);
        process.exit(1);
    }

    // Add the new symbol
    const newSymbol = `        '${symbol.toUpperCase()}'`;
    const updatedContent = content.replace(
        assetTypePattern,
        `$1$2,\n${newSymbol}$3`
    );

    writeSymbolsFile(updatedContent);
    console.log(`✅ Added ${symbol.toUpperCase()} to ${assetType}`);
}

function removeSymbol(symbol, assetType) {
    if (!['forex', 'crypto', 'indices'].includes(assetType)) {
        console.error('❌ Invalid asset type. Must be forex, crypto, or indices');
        process.exit(1);
    }

    const content = readSymbolsFile();

    // Check if symbol exists
    if (!content.includes(`'${symbol.toUpperCase()}'`)) {
        console.log(`ℹ️  Symbol ${symbol.toUpperCase()} not found in ${assetType}`);
        return;
    }

    // Remove the symbol
    const symbolPattern = new RegExp(`\\s*'${symbol.toUpperCase()}'\\s*,?\\s*\\n?`, 'g');
    const updatedContent = content.replace(symbolPattern, '');

    // Clean up trailing commas
    const cleanContent = updatedContent.replace(/,\s*]/g, ']');

    writeSymbolsFile(cleanContent);
    console.log(`✅ Removed ${symbol.toUpperCase()} from ${assetType}`);
}

function listSymbols(assetType = null) {
    const content = readSymbolsFile();

    if (assetType) {
        if (!['forex', 'crypto', 'indices'].includes(assetType)) {
            console.error('❌ Invalid asset type. Must be forex, crypto, or indices');
            process.exit(1);
        }

        const assetTypePattern = new RegExp(`${assetType}:\\s*\\[([^\\]]*)\\]`, 's');
        const match = content.match(assetTypePattern);

        if (match) {
            const symbols = match[1].match(/'([^']+)'/g)?.map(s => s.replace(/'/g, '')) || [];
            console.log(`\n📈 ${assetType.toUpperCase()} Symbols (${symbols.length}):`);
            symbols.forEach(symbol => console.log(`  • ${symbol}`));
        }
    } else {
        // List all asset types
        ['forex', 'crypto', 'indices'].forEach(type => {
            listSymbols(type);
        });
    }
}

function showUsage() {
    console.log(`
🔧 Symbol Management Script

Usage:
  node scripts/manageSymbols.js <command> [options]

Commands:
  add <symbol> <asset_type>     Add a symbol to the tracked list
  remove <symbol> <asset_type>   Remove a symbol from the tracked list
  list [asset_type]             List all symbols (or by asset type)
  help                          Show this help message

Examples:
  node scripts/manageSymbols.js add GBPUSD forex
  node scripts/manageSymbols.js remove BTCUSD crypto
  node scripts/manageSymbols.js list forex
  node scripts/manageSymbols.js list

Asset Types: forex, crypto, indices
    `);
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'add':
        if (args.length !== 3) {
            console.error('❌ Usage: add <symbol> <asset_type>');
            process.exit(1);
        }
        addSymbol(args[1], args[2]);
        break;

    case 'remove':
        if (args.length !== 3) {
            console.error('❌ Usage: remove <symbol> <asset_type>');
            process.exit(1);
        }
        removeSymbol(args[1], args[2]);
        break;

    case 'list':
        listSymbols(args[1]);
        break;

    case 'help':
    default:
        showUsage();
        break;
}
