import http from 'http';
import express from 'express';
import compression = require('compression');
import cors from 'cors';
import api from './api';
import { Styles } from './styles';
import compatabiity from './compatability';
import { logger, loggerMiddleware } from './logger';

//  Allow environment to change default behavior
const dataRoot = process.env.DATA_ROOT || '/app/data';
const saveSeconds = Number(process.env.SAVE_SECONDS || 30);
const port = Number(process.env.HTTP_PORT || 3000);

// Build the styles instance.
export const styles = new Styles(dataRoot);
// Configure express.
export const app = express();
// Add midleware for cors and compression.
app.use(loggerMiddleware);
app.use(cors());
app.options('*', cors());
app.use(compression());
// Add styles REST endpoint
app.use('/styles', api(styles));
// Add the  compatability endpoint
app.use(compatabiity(styles));

// Createh the HTTP server and configure
// for a graceful shutdown.
export const server = http.createServer(app);
export const stop = async (): Promise<void> => {
  logger.info('Beginning shutdown.');
  server.close(
    async (): Promise<void> => {
      // Make sure any lingering changes are saved to disk.
      await styles.flush();
      logger.info('Shutdown complete.');
    }
  );
};

/**
 * Main method for the application
 */
export async function start(): Promise<void> {
  // Wait for style data to load.
  await styles.init(saveSeconds);

  // Listen for terminal events to trigger shutdown.
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);

  // Start the HTTP server.
  server.listen(port, () => {
    logger.info(`Listening on port ${port}`);
  });
}

// Only start when launched directly
/* istanbul ignore if */
if (require.main === module) {
  start();
}
