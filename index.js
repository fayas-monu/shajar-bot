import 'dotenv/config';
import { config } from './lib/config.js';
import { logger } from './lib/logger.js';
import { startWhatsAppBot, closeWhatsAppBot } from './lib/bot.js';

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down Shajar Bot...');

  try {
    await closeWhatsAppBot();
  } catch (error) {
    logger.warn({ err: error }, 'Error during shutdown');
  }

  process.exit(0);
}

async function main() {
  logger.info(
    { authFolder: config.authFolder, aiEnabled: config.aiEnabled },
    'Starting Shajar Bot',
  );

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await startWhatsAppBot();
}

main().catch((error) => {
  logger.fatal({ err: error }, 'Fatal error while starting Shajar Bot');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
});
