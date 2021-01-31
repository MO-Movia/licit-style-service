import { expect } from 'chai';
import express, { Express } from 'express';
import { tmpdir } from 'os';
import supertest from 'supertest';
import api from './api';
import { Styles } from './styles';

describe('api', () => {
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
    app.use('/styles', api(styles));
  });

  describe('POST /styles', () => {
    it('should respond with 201', (done) => {
      supertest(app)
        .post('/styles')
        .set('Content-Type', 'application/json')
        .send(style)
        .expect(201)
        .expect('Location', '/styles/stylename')
        .expect({
          statusCode: 201,
          message: 'Created',
          location: '/styles/stylename',
        })
        .end(done);
    });
  });

  describe('GET /styles', () => {
    it('should respond with 200 and list of styles', (done) => {
      supertest(app)
        .get('/styles')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(styles.list())
        .end(done);
    });
  });

  describe('GET /styles/styleName', () => {
    describe('when style exists', () => {
      it('should respond with 200 and a single style', (done) => {
        supertest(app)
          .get(`/styles/${styleName}`)
          .expect(200)
          .expect('Content-Type', /json/)
          .expect(style)
          .end(done);
      });
    });

    describe('when style does not exist', () => {
      it('should respond with 404', (done) => {
        supertest(app)
          .get(`/styles/${newName}`)
          .expect(404)
          .expect('Content-Type', /json/)
          .expect({ statusCode: 404, message: 'Not Found' })
          .end(done);
      });
    });
  });

  describe('DELETE /styles/styleName', () => {
    describe('when style exists', () => {
      it('should respond with 204', (done) => {
        supertest(app)
          .delete(`/styles/${styleName}`)
          .expect(204)
          .expect(() => {
            expect(styles.get(styleName)).to.be.undefined;
          })
          .end(done);
      });
    });

    describe('when style does not exist', () => {
      it('should respond with 204', (done) => {
        supertest(app).delete(`/styles/${newName}`).expect(204).end(done);
      });
    });
  });

  describe('PATCH /styles/rename', () => {
    describe('when successful', () => {
      it('should respond with 204', (done) => {
        supertest(app)
          .patch('/styles/rename')
          .set('Content-Type', 'application/json')
          .send({ oldName: styleName, newName })
          .expect(204)
          .expect(() => {
            expect(style.styleName).to.equal(newName);
            expect(styles.get(newName)).to.equal(style);
          })
          .end(done);
      });
    });

    describe('when request is malformed', () => {
      it('should respond with 400', (done) => {
        supertest(app)
          .patch('/styles/rename')
          .set('Content-Type', 'application/json')
          .send({ oldName: newName })
          .expect(400)
          .expect({
            statusCode: 400,
            message: 'The "newName" argument is required.',
          })
          .end(done);
      });
    });
  });

  describe('PATCH /styles/clear', () => {
    it('should respond with 204', (done) => {
      supertest(app)
        .patch('/styles/clear')
        .expect(204)
        .expect(() => {
          expect(styles.get(styleName)).to.be.undefined;
        })
        .end(done);
    });
  });

  describe('PATCH /styles/import', () => {
    describe('when request is well formed', () => {
      it('should respond with 204', (done) => {
        styles.clear();
        supertest(app)
          .patch('/styles/import')
          .send({ styles: [style], replace: true })
          .expect(204)
          .end(done);
      });
    });

    describe('when request is malformed', () => {
      it('should respond with 400', (done) => {
        styles.clear();
        supertest(app)
          .patch('/styles/import')
          .send({ styles: null, replace: true })
          .expect(400)
          .expect({
            statusCode: 400,
            message: 'The "styles" argument is required.',
          })
          .end(done);
      });
    });
  });
});
