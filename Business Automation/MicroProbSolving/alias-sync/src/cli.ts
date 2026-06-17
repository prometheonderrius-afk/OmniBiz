#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { parseTsConfig } from './parser';
import { generateViteAliases, generateJestAliases, generateEslintAliases } from './generators';
import { syncFileContent, injectMarkers } from './syncer';

function printHelp(): void {
  console.log(`
alias-sync - Synchronize TypeScript path aliases to Vite, Jest, and ESLint configs.

Usage:
  npx alias-sync [options]

Options:
  -c, --config <path>   Path to tsconfig.json (default: ./tsconfig.json)
  -v, --vite [path]     Path to Vite config (default: auto-detected)
  -j, --jest [path]     Path to Jest config (default: auto-detected)
  -e, --eslint [path]   Path to ESLint config (default: auto-detected)
  -i, --init            Automatically inject comment markers into existing configuration files
  -d, --dry-run         Print proposed changes without writing to disk
  -h, --help            Show this help message

Zero-Config Auto-detection:
  If no paths are provided, alias-sync looks for standard configuration files
  in the current working directory:
    Vite:   vite.config.ts, vite.config.js, vite.config.mjs, vite.config.cjs
    Jest:   jest.config.js, jest.config.ts, jest.config.cjs, jest.config.mjs
    ESLint: eslint.config.js, eslint.config.mjs, eslint.config.cjs, eslint.config.ts
`);
}

function findFile(candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

interface CliArgs {
  config: string;
  vite?: string;
  jest?: string;
  eslint?: string;
  init: boolean;
  dryRun: boolean;
  help: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const parsed: CliArgs = {
    config: './tsconfig.json',
    init: false,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      parsed.help = true;
    } else if (arg === '-d' || arg === '--dry-run') {
      parsed.dryRun = true;
    } else if (arg === '-i' || arg === '--init') {
      parsed.init = true;
    } else if (arg === '-c' || arg === '--config') {
      const val = args[++i];
      if (!val || val.startsWith('-')) {
        console.error('Error: --config requires a file path.');
        process.exit(1);
      }
      parsed.config = val;
    } else if (arg === '-v' || arg === '--vite') {
      // Check if next arg is a path or another flag
      const val = args[i + 1];
      if (val && !val.startsWith('-')) {
        parsed.vite = val;
        i++;
      } else {
        parsed.vite = ''; // explicitly request auto-detect
      }
    } else if (arg === '-j' || arg === '--jest') {
      const val = args[i + 1];
      if (val && !val.startsWith('-')) {
        parsed.jest = val;
        i++;
      } else {
        parsed.jest = '';
      }
    } else if (arg === '-e' || arg === '--eslint') {
      const val = args[i + 1];
      if (val && !val.startsWith('-')) {
        parsed.eslint = val;
        i++;
      } else {
        parsed.eslint = '';
      }
    }
  }

  return parsed;
}

function run(): void {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const tsconfigPath = path.resolve(args.config);
  if (!fs.existsSync(tsconfigPath)) {
    console.error(`Error: tsconfig file not found at ${tsconfigPath}`);
    process.exit(1);
  }

  console.log(`Reading TS configuration from: ${tsconfigPath}`);
  let tsConfig;
  try {
    tsConfig = parseTsConfig(tsconfigPath);
  } catch (error: any) {
    console.error(`Error parsing tsconfig: ${error.message}`);
    process.exit(1);
  }

  const { paths, baseUrl } = tsConfig;
  if (Object.keys(paths).length === 0) {
    console.warn('Warning: No paths found in tsconfig.json. Nothing to sync.');
  }

  // Resolve config targets
  const targets: { type: 'vite' | 'jest' | 'eslint'; name: string; path?: string; candidates: string[] }[] = [
    {
      type: 'vite',
      name: 'Vite',
      path: args.vite,
      candidates: ['vite.config.ts', 'vite.config.js', 'vite.config.mjs', 'vite.config.cjs'],
    },
    {
      type: 'jest',
      name: 'Jest',
      path: args.jest,
      candidates: ['jest.config.js', 'jest.config.ts', 'jest.config.cjs', 'jest.config.mjs'],
    },
    {
      type: 'eslint',
      name: 'ESLint',
      path: args.eslint,
      candidates: ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'eslint.config.ts'],
    },
  ];

  let syncedCount = 0;

  for (const target of targets) {
    let targetPath = target.path;

    // Auto-detect if not specified
    if (targetPath === undefined) {
      targetPath = findFile(target.candidates);
    } else if (targetPath === '') {
      targetPath = findFile(target.candidates);
      if (!targetPath) {
        console.warn(`Could not auto-detect ${target.name} config file.`);
        continue;
      }
    }

    if (!targetPath) {
      // If the user specified a flag explicitly, warn them. Otherwise, ignore.
      if (target.path !== undefined) {
        console.error(`Error: ${target.name} config file not found.`);
      }
      continue;
    }

    const absPath = path.resolve(targetPath);
    if (!fs.existsSync(absPath)) {
      console.error(`Error: ${target.name} config file not found at ${absPath}`);
      continue;
    }

    console.log(`Processing ${target.name} config: ${targetPath}`);
    let content = fs.readFileSync(absPath, 'utf8');

    // 1. Initialize markers if requested
    if (args.init) {
      const { content: initializedContent, injected } = injectMarkers(content, target.type);
      if (injected) {
        if (args.dryRun) {
          console.log(`[Dry Run] Would inject comment markers into ${targetPath}`);
        } else {
          fs.writeFileSync(absPath, initializedContent, 'utf8');
          console.log(`Injected comment markers into ${targetPath}`);
        }
        content = initializedContent;
      }
    }

    // 2. Perform synchronization
    let generatedAliases = '';
    if (target.type === 'vite') {
      generatedAliases = generateViteAliases(paths, baseUrl, absPath);
    } else if (target.type === 'jest') {
      generatedAliases = generateJestAliases(paths, baseUrl, absPath);
    } else if (target.type === 'eslint') {
      generatedAliases = generateEslintAliases(paths, baseUrl, absPath);
    }

    const { content: syncedContent, updated } = syncFileContent(content, generatedAliases);

    if (!content.includes('@alias-sync-start') || !content.includes('@alias-sync-end')) {
      console.warn(
        `Warning: Comment markers (// @alias-sync-start / // @alias-sync-end) not found in ${targetPath}.\n` +
        `Run with --init to automatically inject them, or add them manually.`
      );
      continue;
    }

    if (updated && syncedContent !== content) {
      if (args.dryRun) {
        console.log(`[Dry Run] Proposed changes for ${targetPath}:\n${generatedAliases}\n`);
      } else {
        fs.writeFileSync(absPath, syncedContent, 'utf8');
        console.log(`Successfully synced ${target.name} path aliases!`);
      }
      syncedCount++;
    } else {
      console.log(`${target.name} path aliases are already up to date.`);
    }
  }

  if (syncedCount > 0 && !args.dryRun) {
    console.log('Synchronization completed successfully.');
  }
}

// Only execute when run directly
if (require.main === module) {
  run();
}
