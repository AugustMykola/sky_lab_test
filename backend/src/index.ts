import { createApp } from './app';
import { loadEnvironment } from './config/environment';
import { openDatabase } from './database/database';
import { logger } from './http/logger';

const { port, databasePath } = loadEnvironment();

const database = openDatabase(databasePath);
const server = createApp(database).listen(port, () =>
  logger.info(`API listening on :${port} (database: ${databasePath})`),
);

const shutdown = () => {
  server.close(() => {
    database.close();
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
