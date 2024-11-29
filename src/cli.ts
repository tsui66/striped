import { parseArgs } from "util";
import { deploy } from './deploy';
import { pull } from './pull';
import path from 'path';
import fs from 'fs';

const COLORS = {
  BOLD: '\x1b[1m',
  CYAN: '\x1b[1;36m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  RESET: '\x1b[0m',
} as const;

function printHelp() {
  console.log(`
${COLORS.BOLD}Usage:${COLORS.RESET} striped <command> [options]

${COLORS.CYAN}Commands:${COLORS.RESET}
  ${COLORS.GREEN}deploy${COLORS.RESET}    Deploy configuration to Stripe
  ${COLORS.GREEN}pull${COLORS.RESET}      Pull configuration from Stripe

${COLORS.CYAN}Options:${COLORS.RESET}
  ${COLORS.YELLOW}--config${COLORS.RESET} <path>    Path to the configuration file (default: striped.config.ts)
  ${COLORS.YELLOW}--env${COLORS.RESET} <path>       Path to the .env file (default: .env)
  ${COLORS.YELLOW}--help${COLORS.RESET}             Show this help message

${COLORS.CYAN}Examples:${COLORS.RESET}
  striped ${COLORS.GREEN}deploy${COLORS.RESET}
  striped ${COLORS.GREEN}deploy${COLORS.RESET} ${COLORS.YELLOW}--config${COLORS.RESET} custom-config.ts ${COLORS.YELLOW}--env${COLORS.RESET} .env.production
  striped ${COLORS.GREEN}pull${COLORS.RESET}
  striped ${COLORS.GREEN}pull${COLORS.RESET} ${COLORS.YELLOW}--config${COLORS.RESET} custom-config.ts ${COLORS.YELLOW}--env${COLORS.RESET} .env.production
  `);
}

function validateConfigPath(configPath: string) {
  const resolvedPath = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Configuration file not found: ${resolvedPath}`);
  }
  return resolvedPath;
}

async function main() {
  const { values: options, positionals } = parseArgs({
    args: Bun.argv,
    options: {
      config: {
        type: 'string',
      },
      env: {
        type: 'string',
      },
      help: {
        type: 'boolean',
        short: 'h',
      },
    },
    strict: true,
    allowPositionals: true,
  });

  if (options.help) {
    printHelp();
    process.exit(0);
  }
  const command = positionals[positionals.length - 1];
  try {
    switch (command) {
      case 'deploy':
        await deploy(
          options.config && validateConfigPath(options.config),
          options.env
        );
        break;
      case 'pull':
        await pull(
          options.config && validateConfigPath(options.config),
          options.env
        );
        break;
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
      if (error.message.includes('Configuration file not found')) {
        console.error('Please make sure the configuration file exists and the path is correct.');
      }
    } else {
      console.error('An unexpected error occurred:', error);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error executing Striped command:', error);
  process.exit(1);
});