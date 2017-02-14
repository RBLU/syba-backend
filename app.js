'use strict';

var Runner = require('swagger-node-runner');
var restify = require('restify');
var swaggerRestify = require('./api/helpers/swagger-restify');
var db = require('./database');
const _ = require('lodash');

var config = require('./config/config');
config.appRoot = __dirname; // required config

var logger = require('./api/helpers/log').getLogger(config);

var server = restify.createServer({
  name: config.app.name,
  version: config.version,
  log: logger
});

var testReadyCb

module.exports = function (cb) {
  testReadyCb = cb;
  return server;
}; // for testing


// setup CORS
var myCustomHeaders = ['X-Requested-With', 'Cookie', 'Set-Cookie', 'X-Api-Version', 'X-Request-Id', 'yp-language', 'location', 'authorization'];
_.forEach(myCustomHeaders, function (header) {
  restify.CORS.ALLOW_HEADERS.push(header);
});

server.pre(restify.CORS({
  credentials: true,                  // defaults to false
  headers: myCustomHeaders
}));


// setting logging of request and response, uncaught errors
server.pre(function (req, response, next) {
  var path = (req.route && req.route.path) || req.url; // for req.method == OPTIONS the req.route is not available, so we log the url
  var isPing = path.indexOf('ping/db') !== -1;

  req.log[isPing ? 'trace' : 'debug']({
    req_id: req.getId(),
    req: req,
    path: path,
    method: req.method
  }, 'start processing request');
  return next();
});

server.opts( /.*/, ( req, res ) => {
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.send( 200 )
} );

server.on('uncaughtException', function (req, res, route, err) {
  req.log.error({
    err: err,
    method: req.method,
    url: req.url,
    path: (req.route && req.route.path) || req.url,
    message: err.message
  }, "uncaught server exception in restify server");
  console.log('Caught uncaught server Exception: ' + err);
  if (!res.headersSent) {
    res.send(new restify.InternalError(err, err.message || 'unexpected error'));
  }
  return (true);
});

process.on('uncaughtException', function (err) {
  logger.error({err: err, message: err.message}, "UNCAUGHT PROCESS ERROR: logging to error: " + err.message);
  console.error(new Date().toString() + ": Exiting process because of Uncaught Error: " + err.message + ", err: " + err);
  process.exit(1);
});

server.on('after', function (req, res, route, err) {
  var path = (req.route && req.route.path) || req.url; // for req.method == OPTIONS the req.route is not available, so we log the url
  var isPing = path.indexOf('ping/db') !== -1;
  req.log[isPing ? 'trace' : 'info']({
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    'x-real-ip': req.headers['x-real-ip'],
    username: req.user && req.user.email,
    responsetime: res.getHeader('Response-Time'),
    path: path
  }, "finished processing request");

  if (err && !err.doNotLog) {
    // treat some well known errors differently, no stack trace, no body
    if (res.statusCode === 401 || res.statusCode === 403) {
      req.log.info({
        method: req.method,
        url: req.url,
        path: (req.route && req.route.path) || req.url,
        statusCode: res.statusCode,
        'x-real-ip': req.headers['x-real-ip'],
        username: req.user && req.user.email,
        error: err.message
      }, res.statusCode + ": " + err.name || err.message);
    } else {
      req.log.error({
        req: req,
        err: err,
        res: res,
        method: req.method,
        url: req.url,
        path: (req.route && req.route.path) || req.url,
        'x-real-ip': req.headers['x-real-ip'],
        username: req.user && req.user.email,
        statusCode: res.statusCode,
        reqbody: req.body,
        resbody: _.isFunction(res._body.toObject) ? res._body.toObject() : res._body
      }, res.statusCode + ': ' + err.name + ': Error while handling request');
    }
  } else if (req.method === 'POST' || req.method === 'PUT') {
    req.log.debug({
      method: req.method,
      url: req.url,
      path: (req.route && req.route.path) || req.url,
      statusCode: res.statusCode,
      'x-real-ip': req.headers['x-real-ip'],
      username: req.user && req.user.email,
      reqbody: req.body
    }, 'POST/PUT: request body');
  }

  if (req.log.trace() && res._body && _.keys(res._body).length > 0) {

    req.log.trace({
      resbody: res._body,
      method: req.method,
      url: req.url,
      'x-real-ip': req.headers['x-real-ip'],
      username: req.user && req.user.email,
      path: (req.route && req.route.path) || req.url,
      statusCode: res.statusCode
    }, 'response body');
  }
});


server.use(restify.requestLogger());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser({mapParams: false}));
//server.use(passport.initialize());
server.use(restify.fullResponse());


Runner.create(config, function (err, runner) {
  if (err) {
    throw err;
  }

  swaggerRestify.register(server, runner);
  var port = process.env.PORT || runner.swagger.host.split(':')[1] || 10010;
  server.listen(port);

  console.log("our runner is here");
  db.init()
    .then(() => {
      if (testReadyCb) {
        return testReadyCb(server);
      }
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });

});

