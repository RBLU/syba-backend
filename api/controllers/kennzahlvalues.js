'use strict';

var util = require('util'),
  _ = require('lodash'),
  oracledb = require('oracledb'),
  oracleRestHandler = require('../helpers/oracleRestHandler');

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

const kzHistoryQueryIncludeIgnored = {
  query: 'SELECT v.* from SYBA.KENNZAHLVALUE v',
  paramsFn: (req) => {
    return {
      BOID: req.params.BOID
    };
  },
  whereClause: "v.ITSKENNZAHLCONFIG = :BOID",
  orderByClause: "v.STARTED DESC"
};

const kzHistoryQueryNormal = {
  query: kzHistoryQueryIncludeIgnored.query + ' INNER JOIN syba.batchrun br on v.itsBatchRun = br.boid',
  paramsFn: kzHistoryQueryIncludeIgnored.paramsFn,
  whereClause: kzHistoryQueryIncludeIgnored.whereClause + ' AND nvl(br.ignoreInStats, \'0\') <> 1 ',
  orderByClause: kzHistoryQueryIncludeIgnored.orderByClause
};

let filterClause = () => {
  return 'ITSBATCHCONFIG = :itsBatchConfig AND ITSKENNZAHLCONFIG = :itsKennzahlConfig';
};

let handler = require('../helpers/oracleRestHandler')
  .getHandler('SYBA.KENNZAHLVALUE', 'syba', filterClause, (req) => {
    return 'STARTED ASC';
  });

handler.getKennzahlenForRun = function (req, res, next) {

};


handler.getKennzahlWithHistory = function (req, res, next) {

  let getKennzahlConfigById = oracleRestHandler.getQueries('SYBA.KENNZAHLCONFIG', 'syba').getById;
  let includeIgnored = req.params.includeIgnored == 'true';

  Promise.all(
    [oracleRestHandler.statementRunner(req, res, next, getKennzahlConfigById),
      oracleRestHandler.statementRunner(req, res, next,
        includeIgnored ? kzHistoryQueryIncludeIgnored : kzHistoryQueryNormal)]
  )
    .then((results) => {
      if (results[0].rows.length == 0) {
        return next(new restify.NotFoundError("Object not found with BOID: " + req.params.BOID));
      } else if (results[0].rows.length > 1) {
        return next(new restify.InternalServerError("got more than one object, not expected"));
      }
      let kzConfig = results[0].rows[0];
      kzConfig.history = results[1].rows;
      res.send(kzConfig);
      return next();
    });
};


handler.statsQueryStatementIncludeIgnored = statsQueryStatementIncludeIgnored;
handler.statsQueryStatementNormal = statsQueryStatementNormal;
handler.statsQueryStatementIncludeIgnoredOneKzc = statsQueryStatementIncludeIgnoredOneKzc;

module.exports = handler;


