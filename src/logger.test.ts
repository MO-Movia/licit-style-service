import { logger, loggerMiddleware, write } from './logger';

describe('logger', () => {
  it('logger should exist', () => {
    // Verify that logger was created with methods used in code.
    expect(logger).toBeTruthy();
    expect(loggerMiddleware).toBeTruthy();
    expect(write).toBeTruthy();
  });

  describe('write', () => {
    it('should log messages using logger.', () => {
      const spy = jest.spyOn(logger.transports[0], 'log').mockImplementation();
      write('message');

      expect(spy).toHaveBeenCalled();
    });
  });
});
