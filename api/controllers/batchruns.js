'use strict';

const util = require('util'),
  _ = require('lodash'),
  oracledb = require('oracledb'),
  restify = require('restify');
;


/*
 Once you 'require' a module you can reference the things that it exports.  These are defined in module.exports.

 For a controller in a127 (which this is) you should export the functions referenced in your Swagger document by name.

 Either:
 - The HTTP Verb of the corresponding operation (get, put, post, delete, etc)
 - Or the operationId associated with the operation in your Swagger document

 In the starter/skeleton project the 'get' operation on the '/hello' path has an operationId named 'hello'.  Here,
 we specify that in the exports of this module that 'hello' maps to the function named 'hello'
 */
let handler  = require('../helpers/oracleRestHandler')
  .getHandler('SYBA.BATCHRUN', 'syba', () => {return 'ITSBATCHCONFIG=:ITSBATCHCONFIG';}, () => {return 'STARTED DESC';});

handler.getById = function(req, res, next) {

  oracledb.getConnection('syba')
    .then(function (conn) {
      let query = 'SELECT * FROM SYBA.BATCHRUN br WHERE br.BOID=:BOID';
      req.log.debug({query: query, parameter: req.params}, 'Handler:batchruns.getById, executing query');
      conn.execute(query, req.params, {outFormat: oracledb.OBJECT})
        .then((result) => {
          if (result.rows.length == 0) {
            return next(new restify.ResourceNotFoundError());
          }
          req.log.debug({rows: result.rows.length}, "query executed successfully");
          let run = result.rows[0];

          let statsQuery = 'SELECT v.itsKennzahlConfig, v.ITSBATCHRUN, ' +
            ' v.ITSBATCHCONFIG, v.NUMBERVALUE '+
            ' from SYBA.kennzahlvalue v' +
            ' where v.ITSBATCHCONFIG = :ITSBATCHCONFIG AND v.ITSBATCHRUN = :ITSBATCHRUN '
          ;

          let params ={ITSBATCHCONFIG: run.ITSBATCHCONFIG, ITSBATCHRUN: req.params.BOID};

          req.log.debug({query: statsQuery, parameter: params},
            'Handler:batchruns.getById, executing query for kzStats');

          conn.execute(statsQuery, params, {outFormat: oracledb.OBJECT})
            .then((result) => {
              if (result.rows.length == 0) {
                return next(new restify.ResourceNotFoundError());
              }
              run.kennzahlen = result.rows;
              conn.close();
              res.send(run);
              return next();
            })
        })
        .catch((err) => {
          conn.close();
          req.log.error({err: err}, "Error executing qurey");
          return next(err);
        });
    })
    .catch(function (err) {
      req.log.error({err: err}, "Error getting Db Connection");
      return next(err);
    });

};

module.exports = handler;