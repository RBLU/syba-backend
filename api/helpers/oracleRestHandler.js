const oracledb = require('oracledb');
const _ = require('lodash');
const restify = require('restify');
const uuid = require('node-uuid');

let getGenericQueries = (tableName, poolname, filterClause, orderClause) => {
  return {
    getById: {
      query: "SELECT * from " + tableName,
      whereClause: 'BOID= :BOID',
      paramsFn: (req) => {
        return {BOID: req.params.BOID}
      },
      dbpool: 'syba'
    },
    get: {
      query: "SELECT * from " + tableName,
      whereClause: filterClause,
      orderByClause: orderClause,
      paramsFn: (req) => {
        return filterClause ? req.params : [];
      },
      dbpool: 'syba'
    },
    delete: {
      query: "DELETE from " + tableName,
      whereClause: 'BOID= :BOID',
      paramsFn: (req) => {
        return {BOID: req.params.BOID}
      },
      dbpool: 'syba'
    },

    put: {
      query: (req) => {
        let updateClause = _.reduce(req.body, function (result, value, key) {
          return result + ' ' + key + '= :' + key + ','
        }, '');

        if (_.endsWith(updateClause, ',')) {
          updateClause = updateClause.substr(0, updateClause.length - 1);
        }
        return 'UPDATE ' + tableName + ' SET ' + updateClause;
      },
      whereClause: 'BOID= :BOID',
      paramsFn: (req) => {
        // TODO: Check whether body.BOID == req.params.BOID!!!
        return req.body
      },
      dbpool: 'syba'
    },
    post: {
      query: (req) => {
        req.body.BOID = uuid.v4();
        return "INSERT INTO " + tableName + "("
          + _.keys(req.body).join(",") + ") VALUES (" +
          _(req.body).keys().reduce(function (result, value) {
            return result == '' ? result + ':' + value : result + ',:' + value
          }, '')
          + ")";
      },
      paramsFn: (req) => {
        return req.body;
      },
      dbpool: 'syba'
    }
  };
};

let getGenericHandler = function (tableName, poolname, filterClause, orderClause) {
  let queries = getGenericQueries(tableName, poolname, filterClause, orderClause);
  return {
    get: function (req, res, next) {
      statementRunner(req, res, next, queries.get)
        .then((result) => {
          req.log.debug({rows: result.rows.length}, "query executed successfully");
          res.send(result.rows);
          return next(null);
        });
    },
    getById: function (req, res, next) {
      statementRunner(req, res, next, queries.getById)
        .then((result) => {
          if (result.rows.length == 0) {
            return next(new restify.NotFoundError("Object not found with BOID: " + req.params.BOID));
          } else if (result.rows.length > 1) {
            return next(new restify.InternalServerError("got more than one object, not expected"));
          }
          res.send(result.rows[0]);
          return next();
        });
    },
    put: function (req, res, next) {
      statementRunner(req, res, next, queries.put)
        .then((result) => {
          req.log.debug({result: result}, 'PUT Successfully executed: ');
          res.send(200, result);
          return next();
        });
    },
    delete: function (req, res, next) {
      statementRunner(req, res, next, queries.delete)
        .then((result) => {
          req.log.debug({result: result}, "DELETE, successfully executed");
          res.send(result);
          return next();
        });
    },
    post: function (req, res, next) {
      statementRunner(req, res, next, queries.post)
        .then((result) => {
          req.log.debug({result: result}, "POST, successfully executed");
          res.send(req.body);
          return next();
        });
    }
  };
};

function statementRunner(req, res, next, statementObject) {
  return oracledb.getConnection(statementObject.dbpool || 'syba')
    .then(function (conn) {
      let query = _.isFunction(statementObject.query) ? statementObject.query(req) : statementObject.query;
      if (statementObject.whereClause) {
        if (_.isFunction(statementObject.whereClause)) {
          query += ' WHERE ' + statementObject.whereClause(req)
        } else {
          query += ' WHERE ' + statementObject.whereClause
        }
      }

      if (statementObject.groupByClause) {
        if (_.isFunction(statementObject.groupByClause)) {
          query += ' GROUP BY ' + statementObject.groupByClause(req)
        } else {
          query += ' GROUP BY ' + statementObject.groupByClause
        }
      }

      if (statementObject.orderByClause) {
        if (_.isFunction(statementObject.orderByClause)) {
          query += ' ORDER BY ' + statementObject.orderByClause(req);
        } else {
          query += ' ORDER BY ' + statementObject.orderByClause;
        }
      }
      let params = _.isFunction(statementObject.paramsFn) ? statementObject.paramsFn(req) : [];
      req.log.debug({query: query, parameter: params}, 'Generic Statement Runner: Executing this statement');
      return conn
        .execute(query, params, {outFormat: oracledb.OBJECT, maxRows: 500})
        .then((result) => {
          return conn.commit()
            .then((err) => {
              if (err) {
                req.log.error({err: err}, "error on commit()");
              }
              conn.close((err) => {
                if (err) {
                  req.log.error({err: err}, "error on connection close()");
                }
              });
              return result;
            })
        })
        .catch((err) => {
          conn.close((err) => {
            if (err) {
              req.log.error({err: err}, "error on connection close()");
            }
          });
          req.log.error({err: err, statement: statementObject}, "Error executing query");
          return next(err);
        });

    }).catch(function (err) {
      req.log.error({err: err}, "Error getting Db Connection");
      return next(err);
    });
}


module.exports = {
  getHandler: getGenericHandler,
  statementRunner: statementRunner,
  getQueries: getGenericQueries
};