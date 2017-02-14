'use strict';

const util = require('util'),
  _ = require('lodash'),
  oracledb = require('oracledb'),
  restify = require('restify');



/*
 Once you 'require' a module you can reference the things that it exports.  These are defined in module.exports.

 For a controller in a127 (which this is) you should export the functions referenced in your Swagger document by name.

 Either:
 - The HTTP Verb of the corresponding operation (get, put, post, delete, etc)
 - Or the operationId associated with the operation in your Swagger document

 In the starter/skeleton project the 'get' operation on the '/hello' path has an operationId named 'hello'.  Here,
 we specify that in the exports of this module that 'hello' maps to the function named 'hello'
 */
let handler = require('../helpers/oracleRestHandler').getHandler('SYBA.BATCHCONFIG', 'syba');


handler.getById = function (req, res, next) {
  oracledb.getConnection('syba')
    .then(function (conn) {
      const query = 'SELECT * from SYBA.BATCHCONFIG where BOID=:BOID';
      req.log.debug({query: query, params: req.params}, 'Handler.getById, executing query.');

      let includeIgnored = req.params.ignored;

      let statsQuery = 'SELECT k.name, k.description, v.itsKennzahlConfig,' +
        ' v.ITSBATCHCONFIG, min(v.numberValue) as min, max(v.numberValue) as max,' +
        ' avg(v.numberValue) as avg, stddev(v.numberValue) as stddev, median(v.numberValue) as median, count(1) as anzahl, ' +
        ' k.levelMin, k.levelLowError, k.levelLowWarning, k.levelNormal, k.levelHighWarning, k.levelMax' +
        ' from SYBA.kennzahlvalue v' +
        ' INNER JOIN syba.kennzahlconfig k on v.itsKennzahlConfig = k.boid';

      req.log.debug({params: req.params, includeIgnored: includeIgnored}, "ignored?");

      if (!includeIgnored) {

        statsQuery += ' INNER JOIN syba.batchrun br on v.itsBatchRun = br.boid' +
          ' where v.ITSBATCHCONFIG = :BOID AND nvl(br.ignoreInStats, \'0\') <> 1 ';
      } else {
       statsQuery +=
            ' where v.ITSBATCHCONFIG = :BOID';
      }
      statsQuery += ' group by v.itsKennzahlConfig,  k.description, k.name, v.ITSBATCHCONFIG, k.levelMin, k.levelLowError, k.levelLowWarning, k.levelNormal, k.levelHighWarning, k.levelMax'

      req.log.debug({query: statsQuery, params: req.params}, 'Handler.getById, executing query.');

      Promise.all(
        [conn.execute(query, req.params, {outFormat: oracledb.OBJECT}),
        conn.execute(statsQuery, req.params, {outFormat: oracledb.OBJECT})]
      )
        .then((results) => {
          conn.close();

          if (results[0].rows.length == 0) {
            return next(new restify.NotFoundError("Object not found with BOID: " + req.params.BOID));
          } else if (results[0].rows.length > 1) {
            return next(new restify.InternalServerError("got more than one object, not expected"));
          }
          let batchConfig = results[0].rows[0];
          batchConfig.kennzahlStats = results[1].rows;
          res.send(batchConfig);
          return next();
        })
        .catch((err) => {
          req.log.error(err);
          conn.close();
          return next(err);
        });
    })
    .catch(function (err) {
      return next(err);
    });
};


module.exports = handler;