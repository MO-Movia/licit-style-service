import { expect } from 'chai';
import { fake, replace } from 'sinon';
import { app, server, start, stop, styles } from './app';

describe('app', () => {
  it('should exist', () => {
    expect(app).to.exist;
  });

  describe('shutdown', () => {
    it('should close the server', async () => {
      // Execute the callback as well.
      const faked = fake(fn => fn());
      replace(server, 'close', faked);

      await stop();

      expect(faked.called).to.be.true;
    });
  });

  describe('start', () => {
    it('should start the listener', async () => {
      const listen = fake((port, fn) => fn());
      replace(server, 'listen', listen);
      const init = fake.resolves(void 0);
      replace(styles, 'init', init);

      await start();

      expect(init.called).to.be.true;
      expect(listen.called).to.be.true;
    });
  });
});
