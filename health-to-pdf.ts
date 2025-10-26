#!/usr/bin/env bun
import { parseArgs } from 'util';
import { existsSync } from 'fs';

// Import exporters
import { exportHeartRate } from './exporters/heart-rate';
import { exportSleep } from './exporters/sleep';
import { exportMedication } from './exporters/medication';

interface CliOptions {
  type: 'heart' | 'sleep' | 'medication';
  input: string;
  output: string;
  includeDailyTable: boolean;
  help: boolean;
}

function printUsage() {
  console.log(`
Apple Health Export to PDF
===========================

Usage: bun health-to-pdf.ts --type <TYPE> --input <FILE> [OPTIONS]

Required:
  --type <TYPE>          Type of data to export: heart, sleep, medication
  --input <FILE>         Path to Apple Health export.xml file

Optional:
  --output <FILE>        Output PDF filename (default: <type>-report.pdf)
  --no-daily-table       Exclude daily data table from PDF (saves space)
  --help                 Show this help message

Examples:
  bun health-to-pdf.ts --type heart --input export.xml
  bun health-to-pdf.ts --type sleep --input export.xml --output my-sleep.pdf
  bun health-to-pdf.ts --type medication --input export.xml --no-daily-table
  `);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  // Parse arguments
  const options: Partial<CliOptions> = {
    includeDailyTable: true,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--type':
      case '-t':
        options.type = args[++i] as 'heart' | 'sleep' | 'medication';
        break;
      case '--input':
      case '-i':
        options.input = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--no-daily-table':
        options.includeDailyTable = false;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        // Support legacy format: first arg is input, second is output
        if (!options.input && !arg.startsWith('--')) {
          options.input = arg;
        } else if (!options.output && !arg.startsWith('--')) {
          options.output = arg;
        }
    }
  }

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  // Validate required options
  if (!options.input) {
    console.error('❌ Error: --input is required');
    printUsage();
    process.exit(1);
  }

  if (!options.type) {
    console.error('❌ Error: --type is required (heart, sleep, or medication)');
    printUsage();
    process.exit(1);
  }

  if (!['heart', 'sleep', 'medication'].includes(options.type)) {
    console.error('❌ Error: --type must be one of: heart, sleep, medication');
    process.exit(1);
  }

  // Check if input file exists
  if (!existsSync(options.input)) {
    console.error(`❌ Error: Input file not found: ${options.input}`);
    process.exit(1);
  }

  // Set default output filename
  if (!options.output) {
    const typeNames = {
      heart: 'herzfrequenz-bericht.pdf',
      sleep: 'schlaf-bericht.pdf',
      medication: 'medikation-bericht.pdf'
    };
    options.output = typeNames[options.type];
  }

  const config = options as CliOptions;

  console.log(`📱 Apple Health Export to PDF`);
  console.log(`📂 Input: ${config.input}`);
  console.log(`📊 Type: ${config.type}`);
  console.log(`📄 Output: ${config.output}`);
  console.log(`📋 Daily table: ${config.includeDailyTable ? 'Yes' : 'No'}`);
  console.log('');

  const startTime = Date.now();

  try {
    switch (config.type) {
      case 'heart':
        await exportHeartRate(config.input, config.output, config.includeDailyTable);
        break;
      case 'sleep':
        await exportSleep(config.input, config.output, config.includeDailyTable);
        break;
      case 'medication':
        await exportMedication(config.input, config.output, config.includeDailyTable);
        break;
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ PDF report created: ${config.output} (${totalTime}s)`);
    console.log('🏥 You can now share this with your doctor!');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch(console.error);