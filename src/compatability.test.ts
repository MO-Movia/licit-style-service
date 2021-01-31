import express, { Express } from 'express';
import { tmpdir } from 'os';
import supertest from 'supertest';
import { Styles } from './styles';
import api from './compatability';

describe('compatability', () => {
  const styleName = 'styleName';
  const newName = 'newName';
  const style = { styleName };

  let styles: Styles;
  let app: Express;

  beforeEach(() => {
    // Create a style instance with a style to test
    styles = new Styles(tmpdir());
    styles.set(style);

    // Create a simplified express app
    app = express();
    app.use(api(styles));
  });

  describe('GET /getcustomstyles/', () => {
    it('should respond with 200 and list of styles', (done) => {
      supertest(app).get('/getcustomstyles/').expect(200).end(done);
    });
  });

  describe('POST /savecustomstyle/', () => {
    it('should respond with 200 and list of styles', (done) => {
      supertest(app)
        .post('/savecustomstyle/')
        .set('Content-Type', 'application/json')
        .send(style)
        .expect(200)
        .end(done);
    });
  });

  describe('POST /renamecustomstyle/', () => {
    it('should respond with 200', (done) => {
      supertest(app)
        .post(/renamecustomstyle/)
        .set('Content-Type', 'application/json')
        .send({ styleName, newName })
        .expect(200)
        .end(done);
    });
  });

  describe('POST /removecustomstyle/', () => {
    describe('when successful', () => {
      it('should respond with 200', (done) => {
        supertest(app)
          .post(/removecustomstyle/)
          .set('Content-Type', 'text/plain')
          .send(styleName)
          .expect(200)
          .end(done);
      });
    });
  });

  describe('GET /bulk-export', () => {
    describe('when request is well formed', () => {
      it('should respond with 200', (done) => {
        supertest(app).get('/bulk-export').expect(200).end(done);
      });
    });
  });

  describe('POST /bulk-import', () => {
    describe('when request an object', () => {
      it('should respond with 200', (done) => {
        supertest(app)
          .post('/bulk-import')
          .send({ styles: {}, relpace: true })
          .expect(200)
          .end(done);
      });
    });
    describe('when request an array', () => {
      it('should respond with 200', (done) => {
        supertest(app)
          .post('/bulk-import')
          .send({ styles: [], relpace: true })
          .expect(200)
          .end(done);
      });
    });
  });
});
