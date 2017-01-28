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
module.exports = {
  get: get
};

/*
 Functions in a127 controllers used for operations should take two parameters:

 Param 1: a handle to the request object
 Param 2: a handle to the response object
 */
function get(req, res, next) {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
  //var name = _.get(req, 'swagger.params.name.value') || 'stranger';
  //var hello = util.format('Hello, %s!', name);

  oracledb.getConnection('syriusadm')
    .then(function (conn) {
        conn.execute("SELECT boid, kurzbezdt, bezeichnungdt from syriusadm.batch",
//        [],
//        {outFormat: oracledb.OBJECT},
          function (err, result) {
            if (err) {
              conn.close();
              return next(err);
            }
            res.send(200, _.map(result.rows, function (row) {
              return {
                boid: row[0],
                name: row[1],
                description: row[2]
              };
            }));
            conn.close();
            return next();
          });
      }
    )
    .catch(function (err) {
      return next(err);
    });
}