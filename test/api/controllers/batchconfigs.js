var should = require('should');
var request = require('supertest');
var server = require('../../../app');

describe('controllers', function() {

  describe('batchconfig', function() {

    describe('GET /batchconfigs', function() {

      it('should return an error as we dont have a db', function(done) {

        request(server)
          .get('/api/batchconfigs')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(500)
          .end(function(err, res) {

            done();
          });
      });



    });

  });

});
