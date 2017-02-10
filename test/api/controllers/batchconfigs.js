var should = require('should');
var request = require('supertest');
var server;

before(function(done) {
  require('../../../app')(function (serv) {
    server = serv;
    return done();
  });

});

describe('controllers', function () {

  describe('batchconfig', function () {

    describe('GET /batchconfigs', function () {

        it('should return an error as we dont have a db', function (done) {

            request(server)
              .get('/api/batchconfigs')
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .end(function (err, res) {

                return done(err);
              });


        });

      });

    });

  });
