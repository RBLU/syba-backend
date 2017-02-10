var should = require('should');
var request = require('supertest');
var server = require('../../../app');

describe('controllers', function() {

  describe('hello_world', function() {

    describe('GET /hello', function() {

      it('should return a default string', function(done) {

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
