'use strict';

const util = require('util'),
  _ = require('lodash'),
  restify = require('restify'),
  oracleRestHandler = require('../helpers/oracleRestHandler'),
  uuid = require('node-uuid'),
  kennzahlvalues = require('./kennzahlvalues');

const deleteRuns = {
  query: "DELETE FROM SYBA.BATCHRUN WHERE ITSBATCHCONFIG = :ITSBATCHCONFIG",
  paramsFn: (req) => {
    return {ITSBATCHCONFIG: req.params.BOID}
  },
  dbpool: 'syba',
};

const loadRuns = {
  query: "insert into syba.BATCHRUN " +
  "SELECT SYS_GUID(), :ITSBATCHCONFIG, :ITSSYRIUSBATCH, bl.boid, NULL, NULL, bl.started, bl.stopped " +
  "FROM syriusadm.BATCHLAUF bl where bl.ITSBATCHLAUFBATCH = :ITSSYRIUSBATCH and bl.replaced > sysdate ",
  paramsFn: (req) => {
    return {ITSBATCHCONFIG: req.params.BOID, ITSSYRIUSBATCH: req.params.ITSSYRIUSBATCH}
  },
  dbpool: 'syba',
};

const getBatchConfigById = {
  query: 'SELECT * from SYBA.BATCHCONFIG',
  paramsFn: (req) => {
    return {BOID: req.params.BOID};
  },
  whereClause: 'BOID=:BOID',
  dbpool: 'syba'
};





let handler = oracleRestHandler.getHandler('SYBA.BATCHCONFIG', 'syba');


handler.getById = function (req, res, next) {
  let includeIgnored = req.params.includeIgnored == 'true';

  Promise.all(
    [oracleRestHandler.statementRunner(req, res, next, getBatchConfigById),
      oracleRestHandler.statementRunner(req, res, next,
        includeIgnored ? kennzahlvalues.statsQueryStatementIncludeIgnored : kennzahlvalues.statsQueryStatementNormal)]
  )
    .then((results) => {
      req.log.trace({results: results}, 'query executed successfully');
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
};

handler.reloadBatchConfig = (req, res, next) => {
  Promise.all([oracleRestHandler.statementRunner(req, res, next, deleteRuns),
  oracleRestHandler.statementRunner(req, res, next, loadRuns)])
    .then((results) => {
      req.log.trace({result: results}, "query executed successfully");
      res.send({removed: results[0], added: results[1]});
      return next(null);
    })
};


module.exports = handler;