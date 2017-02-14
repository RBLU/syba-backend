'use strict';

var util = require('util'),
  _ = require('lodash'),
  oracledb = require('oracledb');


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

      let historyQuery = 'SELECT * from SYBA.KENNZAHLVALUE where ITSKENNZAHLCONFIG = :ITSKENNZAHLCONFIG order by STARTED ASC';
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

module.exports = handler;


