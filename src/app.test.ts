import supertest from 'supertest';
import { app, server, start, stop, styles } from './app';

// Mocking the logger module to suppress console output during testing.
jest.mock('./logger');

describe('app', () => {
  it('should exist', () => {
    expect(app).toBeTruthy();
  });

  describe('shutdown', () => {
    it('should close the server', async () => {
      // Execute the callback as well.
      jest.spyOn(server, 'close');

      await stop();

      expect(server.close).toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('should start the listener', async () => {
      jest.spyOn(styles, 'init').mockImplementation(async () => {});
      jest.spyOn(server, 'listen').mockImplementation((port, fn) => {
        fn?.();
        return this;
      });

      await start();

      expect(styles.init).toHaveBeenCalled();
      expect(server.listen).toHaveBeenCalled();
    });
  });

  describe('GET /status', () => {
    it('should respond with 200', () =>
      supertest(app).get('/status').send().expect(200).expect({ size: 0 }));
  });
});
