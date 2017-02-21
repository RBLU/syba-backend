'use strict';

const util = require('util'),
  _ = require('lodash'),
  oracleRestHandler = require('../helpers/oracleRestHandler'),
  restify = require('restify'),
  bcrypt = require('bcrypt');
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
let handler = oracleRestHandler
  .getHandler('SYBA.LOCALUSER', 'syba');

handler.postUser = function postUser(req, res, next) {
  const user = req.body;
  req.log.debug({body: user}, "this we got in...");
  if (!user.username || !user.password) {
    return next(new restify.InvalidArgumentError('Username and Password must be given'));
  }



  bcrypt.hash(user.password, 8, function (err, hash) {
    if (err) {
      return next(err);
    }
    user.HASHEDPASSWORD = hash;
    delete user.password;

    oracleRestHandler.statementRunner(req, res, next, oracleRestHandler.getQueries('SYBA.LOCALUSER', 'syba').post)
      .then((result) => {
        delete user.HASHEDPASSWORD
        res.send(user);
        return next();
      })
  });


};
module.exports = handler;