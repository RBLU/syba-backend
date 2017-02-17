const util = require('util'),
  _ = require('lodash'),
  oracledb = require('oracledb'),
  restify = require('restify'),
  oracleRestHandler = require('../helpers/oracleRestHandler'),
  uuid = require('node-uuid'),
  kennzahlvalues = require('./kennzahlvalues');


let handler = oracleRestHandler.getHandler('SYBA.KENNZAHLCONFIG', 'syba');
let queries = oracleRestHandler.getQueries('SYBA.KENNZAHLCONFIG', 'syba');

handler.getById = (req,res,next) => {
  Promise.all([
    oracleRestHandler.statementRunner(req, res, next, queries.getById),
    oracleRestHandler.statementRunner(req, res, next, kennzahlvalues.statsQueryStatementIncludeIgnoredOneKzc)
  ]).then((results) => {

    if (results[0].rows.length== 0) {
      return next(new restify.NotFoundError("Object not found this BOID"));
    } else if (results[0].rows.length > 1) {
      return next(new restify.InternalServerError("multiple found with this BOID, corrupt data"));
    }
    if (results[1].rows.length== 0) {
      req.log.debug({}, "no stats found for this kzc - probably never calculated");
    } else if (results[0].rows.length > 1) {
      return next(new restify.InternalServerError("multiple found with this BOID, corrupt data"));
    }
    let kzc = results[0].rows[0];
    let kzStats = results[1].rows[0];
    kzc.kzStats = kzStats;
    res.send(kzc);
    return next();
  });
};

module.exports = handler;