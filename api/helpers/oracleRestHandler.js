const oracledb = require('oracledb');
const _ = require('lodash');
const restify = require('restify');
const uuid = require('node-uuid');

let getGenericHandler = function (tableName, poolname, filterClause, orderClause) {

  return {
    get: function (req, res, next) {
      oracledb.getConnection(poolname)
        .then(function (conn) {
          let query = 'SELECT * FROM ' + tableName;
          if (filterClause) {
            query += ' WHERE ' + filterClause(req);
          }

          if (orderClause) {
            query += ' ORDER BY ' + orderClause(req);
          }
          req.log.debug({query: query, parameter: req.params}, 'Handler.get, executing query');
          conn.execute(query, filterClause ? req.params : [], {outFormat: oracledb.OBJECT, maxRows: 500})
            .then((result) => {
              req.log.debug({rows: result.rows.length}, "query executed successfully");
              conn.close();
              res.send(result.rows);
              return next(null);
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
    },
    getById: function (req, res, next) {
      oracledb.getConnection(poolname)
        .then(function (conn) {
          const query = 'SELECT * from ' + tableName + ' where BOID=:BOID';
          console.log('Handler.getById, executing query: ' + query);
          conn.execute(query, req.params, {outFormat: oracledb.OBJECT})
            .then((result) => {
              console.log("getById Result: " + JSON.stringify(result));
              conn.close();
              if (result.rows.length == 0) {
                return next(new restify.NotFoundError("Object not found with BOID: " + req.params.BOID));
              } else if (result.rows.length > 1) {
                return next(new restify.InternalServerError("got more than one object, not expected"));
              }
              res.send(result.rows[0]);
              return next();
            })
            .catch((err) => {
              conn.close();
              return next(err);
            });
        })
        .catch(function (err) {
          return next(err);
        });
    },
    put: function (req, res, next) {
      oracledb.getConnection(poolname)
        .then(function (conn) {

          let updateClause = _.reduce(req.body, function (result, value, key) {
            return result + ' ' + key + '=' + value + ','
          }, '');

          if (_.endsWith(updateClause, ',')) {
            updateClause = updateClause.substr(0, updateClause.length - 1);
          }
          let query = 'UPDATE ' + tableName + ' SET ' + updateClause + ' WHERE boid= :BOID'
          req.log.debug({query: query, params: req.params}, 'Executing Update Query: ' + updateClause);
          conn.execute(query, req.params, {outFormat: oracledb.OBJECT})
            .then((result) => {
              conn.commit()
                .then(() => {
                  req.log.debug({result: result}, 'Successfully Updated: ');
                  conn.close();
                  res.send(200, result);
                  return next();
                });
            })
            .catch((err) => {
              conn.close();
              return next(err);
            });
        })
        .catch(function (err) {
          return next(err);
        });
    },
    delete: function (req, res, next) {
      oracledb.getConnection(poolname)
        .then(function (conn) {
          let query = 'DELETE FROM ' + tableName + " WHERE BOID= :BOID";
          req.log.debug({query: query, params: req.params}, 'Handler.DELETE, executing query');
          conn.execute(query, req.params, {outFormat: oracledb.OBJECT})
            .then((result) => {
              req.log.debug({result: result}, "DELETE, successfully executed");
              conn.commit(function (err) {
                if (err) {
                  conn.close();
                  return next(err);
                }
                res.send(result);
                conn.close();
                return next();
              });
            })
            .catch((err) => {
              conn.close();
              return next(err);
            });


        });
    },
    post: function (req, res, next) {
      oracledb.getConnection(poolname)
        .then(function (conn) {

          req.body.BOID = uuid.v4();
          let query = "INSERT INTO " + tableName + "("
            + _.keys(req.body).join(",") + ") VALUES (" +
            _(req.body).keys().reduce(function (result, value) {
              return result == '' ? result + ':' + value : result + ',:' + value
            }, '')
            + ")";
          req.log.debug({query: query, params: req.body}, 'Handler.POST, executing query');
          conn.execute(query, req.body, {outFormat: oracledb.OBJECT})
            .then((result) => {
              req.log.debug({result: result}, "POST, successfully executed");
              conn.commit(function (err) {
                if (err) {
                  conn.close();
                  return next(err);
                }
                res.send(req.body);
                conn.close();
                return next();
              });
            })
            .catch((err) => {
              conn.close();
              return next(err);
            });
        })
        .catch(function (err) {
          return next(err);
        });
    }
  }
};

function statementRunner(req, res, next, statementObject) {
  return oracledb.getConnection(statementObject.dbpool)
    .then(function (conn) {
      let query = statementObject.query;
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

      if (statementObject.orderClause) {
        query += ' ORDER BY ' + orderClause(req);
      }
      let params = _.isFunction(statementObject.paramsFn) ? statementObject.paramsFn(req) : [];
      req.log.debug({query: query, parameter: params}, 'Generic Statement Running, runnnig this statement');
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
  statementRunner: statementRunner
};