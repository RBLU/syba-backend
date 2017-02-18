'use strict';

var util = require('util'),
  _ = require('lodash'),
  oracledb = require('oracledb');



const statsQueryStatementIncludeIgnored = {
  query: 'SELECT k.BOID, k.name, k.description, v.itsKennzahlConfig,' +
  ' v.ITSBATCHCONFIG, min(v.numberValue) as min, max(v.numberValue) as max,' +
  ' avg(v.numberValue) as avg, stddev(v.numberValue) as stddev, median(v.numberValue) as median, count(1) as anzahl, min(v.started) as VON, max(v.started) as BIS, ' +
  ' k.levelMin, k.levelLowError, k.levelLowWarning, k.levelNormal, k.levelHighWarning, k.levelMax' +
  ' from SYBA.kennzahlvalue v' +
  ' INNER JOIN syba.kennzahlconfig k on v.itsKennzahlConfig = k.boid ',
  whereClause: 'v.ITSBATCHCONFIG = :BOID',
  groupByClause: ' k.BOID, v.itsKennzahlConfig,  k.description, k.name, v.ITSBATCHCONFIG, ' +
  'k.levelMin, k.levelLowError, k.levelLowWarning, k.levelNormal, k.levelHighWarning, k.levelMax',
  paramsFn: (req) => {
    return {BOID: req.params.BOID};
  },
  dbpool: 'syba'
};

const statsQueryStatementNormal = {
  query: statsQueryStatementIncludeIgnored.query + ' INNER JOIN syba.batchrun br on v.itsBatchRun = br.boid',
  whereClause: statsQueryStatementIncludeIgnored.whereClause + " AND nvl(br.ignoreInStats, '0') <> 1 ",
  groupByClause: statsQueryStatementIncludeIgnored.groupByClause,
  paramsFn: (req) => {
    return {BOID: req.params.BOID};
  },
  dbpool: 'syba'

};

const statsQueryStatementIncludeIgnoredOneKzc = {
  query: statsQueryStatementIncludeIgnored.query,
  whereClause: "ITSKENNZAHLCONFIG = :ITSKENNZAHLCONFIG",
  groupByClause: statsQueryStatementIncludeIgnored.groupByClause,
  paramsFn: (req) => {
    return {ITSKENNZAHLCONFIG: req.params.BOID};
  },
  dbpool: 'syba'
};



/*
 Once you 'require' a module you can reference the things that it exports.  These are defined in module.exports.

 For a controller in a127 (which this is) you should export the functions referenced in your Swagger document by name.

 Either:
 - The HTTP Verb of the corresponding operation (get, put, post, delete, etc)
 - Or the operationId associated with the operation in your Swagger document

 In the starter/skeleton project the 'get' operation on the '/hello' path has an operationId named 'hello'.  Here,
 we specify that in the exports of this module that 'hello' maps to the function named 'hello'
 */

let filterClause = () => {
    return 'ITSBATCHCONFIG = :itsBatchConfig AND ITSKENNZAHLCONFIG = :itsKennzahlConfig';
};

let handler = require('../helpers/oracleRestHandler')
  .getHandler('SYBA.KENNZAHLVALUE', 'syba', filterClause, (req) => {return 'STARTED ASC';});

handler.getKennzahlenForRun = function(req, res, next) {

};

handler.getKennzahlWithHistory = function(req, res, next) {
  oracledb.getConnection('syba')
    .then(function (conn) {

      const query = 'SELECT * from SYBA.KENNZAHLCONFIG where BOID= :ITSKENNZAHLCONFIG';
      let qparams = {
        ITSKENNZAHLCONFIG: req.params.ITSKENNZAHLCONFIG
      };
      req.log.debug({query: query, params: qparams}, 'Handler.getKennzahlWithHistory, executing query.');

      let includeIgnored = req.params.conn == 'true';

      let historyQuery = 'SELECT v.* from SYBA.KENNZAHLVALUE v';

      if (!includeIgnored) {
        historyQuery += ' INNER JOIN syba.batchrun br on v.itsBatchRun = br.boid' +
          ' where v.ITSKENNZAHLCONFIG = :ITSKENNZAHLCONFIG AND nvl(br.ignoreInStats, \'0\') <> 1 ';
      } else {
        historyQuery +=
          ' where v.ITSKENNZAHLCONFIG = :ITSKENNZAHLCONFIG';
      }
      historyQuery +=
        ' order by v.STARTED DESC';
      req.log.debug({query: historyQuery, params: qparams}, 'Handler.getById, executing query.');

      Promise.all(
        [conn.execute(query, qparams, {outFormat: oracledb.OBJECT}),
          conn.execute(historyQuery, qparams, {outFormat: oracledb.OBJECT, maxRows: 500})]
      )
        .then((results) => {
          conn.close();

          if (results[0].rows.length == 0) {
            return next(new restify.NotFoundError("Object not found with BOID: " + req.params.BOID));
          } else if (results[0].rows.length > 1) {
            return next(new restify.InternalServerError("got more than one object, not expected"));
          }
          let kzConfig = results[0].rows[0];
          kzConfig.history = results[1].rows;
          res.send(kzConfig);
          return next();
        })
        .catch((err) => {
          req.log.error(err);
          conn.close();
          return next(err);
        });
    })
    .catch(function (err) {
      req.log.error({err: err}, "Error getting Db Connection");
      return next(err);
    });

};



handler.statsQueryStatementIncludeIgnored = statsQueryStatementIncludeIgnored;
handler.statsQueryStatementNormal = statsQueryStatementNormal;
handler.statsQueryStatementIncludeIgnoredOneKzc = statsQueryStatementIncludeIgnoredOneKzc;

module.exports = handler;


