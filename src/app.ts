import { createServer } from 'node:http';
import compression = require('compression');
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';

import api from './api';
import { logger, loggerMiddleware } from './logger';
import { Styles } from './styles';

//  Allow environment to change default behavior
const port = Number(process.env.HTTP_PORT || 3000);
const dataRoot = process.env.DATA_ROOT || '/app/data';
const saveSeconds = Number(process.env.SAVE_SECONDS || 30);
const maxRequests = Number(process.env.MAX_REQUESTS_PER_MINUTE || 60)

// Build the styles instance.
export const styles = new Styles(dataRoot);

// Configure express.
export const app = express();
// Add middleware for cors and compression.
app.use(rateLimit({ windowMs: 1000 * 60, max: maxRequests }));
app.use(cors());
app.options('*', cors());
app.use(compression());
// Add styles REST endpoint
// Use logger here so logs don't fill up with heartbeat spam
app.use('/styles', loggerMiddleware, api(styles));
// Add status REST endpoint
app.get('/status', (req, res) => res.json({ size: styles.size }));

// Create the HTTP server and configure for a graceful shutdown.
export const server = createServer(app);
export const stop = async (): Promise<void> => {
  logger.info('Beginning shutdown.');
  server.close(async (): Promise<void> => {
    // Make sure any lingering changes are saved to disk.
    await styles.flush();
    logger.info('Shutdown complete.');
  });
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
