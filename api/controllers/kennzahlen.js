const util = require('util'),
  _ = require('lodash'),
  oracledb = require('oracledb'),
  restify = require('restify'),
  oracleRestHandler = require('../helpers/oracleRestHandler'),
  uuid = require('node-uuid');


let handler = oracleRestHandler.getHandler('SYBA.KENNZAHL', 'syba');

module.exports = handler;