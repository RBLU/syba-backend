'use strict';

var SwaggerRestify = require('swagger-restify-mw');
var restify = require('restify');
var db = require('./database');


var app = restify.createServer();

module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
};

db.init()
  .then(() => {
    SwaggerRestify.create(config, function (err, swaggerRestify) {
      if (err) {
        throw err;
      }
      swaggerRestify.register(app);


      var port = process.env.PORT || swaggerRestify.runner.swagger.host.split(':')[1] || 10010;
      app.listen(port);
      if (swaggerRestify.runner.swagger.paths['/batches']) {
        console.log('try this:\ncurl http://127.0.0.1:' + port + '/api/batches');
      }
    })

  }).catch((err) => {
  console.log(err);
  throw err;
});

