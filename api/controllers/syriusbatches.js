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
  .getHandler('SYRIUSADM.BATCH', 'syriusadm', null, 'BEZEICHNUNGDT ASC');


module.exports = handler;