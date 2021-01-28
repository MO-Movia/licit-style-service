import express from 'express';
import bodyParser = require('body-parser');
import compression = require('compression');
import cors from 'cors';
import api from './api';
import { Styles } from './styles';

/**
 * Main method for the application
 *
 * @param port Port number to listen on
 * @param dataRoot Root for data
 */
async function main(port: number, dataRoot: string) {
  // Create the style store and wait for styles to load
  const styles = new Styles(dataRoot);
  await styles.init();

  // Configure express
  const app = express();
  // Add midleware for cors and compression
  app.use(cors());
  app.options('*', cors());
  app.use(compression());
  app.use(bodyParser.json());
  // Add styles REST endpoint
  app.use('/styles', api(styles));

  // Start the HTTP server
  const server = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });

  // Create shutdown method.
  const shutdown = async () => {
    console.log('Beginning shutdown.');
    server.close(async () => {
      // Make sure any lingering changes are saved to disk.
      await styles.flush();
      console.log('Shutdown complete.');
    });
  };

  // Listen for terminal events to trigger shutdown.
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Start the application
main(
  Number(process.env.HTTP_PORT || '3000'),
  process.env.DATA_ROOT || '/app/data'
);
