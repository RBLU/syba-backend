const oracledb = require('oracledb');
const _ = require('lodash');
const restify = require('restify');

let getGenericHandler = function (tableName, poolname) {

  return {
    get: function (req, res, next) {
      oracledb.getConnection(poolname)
        .then(function (conn) {
          let query = 'SELECT * FROM ' + tableName;
          console.log('Handler.get, executing query: ' + query);
          conn.execute(query, [], {outFormat: oracledb.OBJECT})
            .then((result) => {
              conn.close();
              return next(null, result.rows);
            })
            .catch((err) => {
              conn.close();
              console.log("Error: " + JSON.stringify(err));
              return next(err);
            });
        })
        .catch(function (err) {
          console.log("Error: " + JSON.stringify(err));
          return next(err);
        });
    },
    getById: function (req, res, next) {
      let id = req.swagger.params.id.raw;
      oracledb.getConnection(poolname)
        .then(function (conn) {
          const query = 'SELECT * from ' + tableName + ' where boid=:boid';
          console.log('Handler.getById, executing query: ' + query);
          conn.execute(query,[id],{outFormat: oracledb.OBJECT})
            .then((result) => {
              console.log("getById Result: " + JSON.stringify(result));
              conn.close();
              if (result.rows.length == 0) {
                return next(new restify.NotFoundError("Object not found with id: " + id));
              } else if (result.rows.length > 1){
                return next(new restify.InternalServerError("got more than one object, not expected"));
              }
              return next(null, result.rows[0]);
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

          let updateClause = _.reduce(data, function(result, value, key) {
            return result + ' ' + key + '='+value +','
          }, '');

          if (_.endsWith(updateClause, ',')) {
            updateClause  = udpateClause.substr(0, updateClause.length -1);
          }

          console.log('Update Clase: ' + updateClause);
          conn.execute('UPDATE ' + tableName + ' SET ' +
              updateClause
            + ' WHERE boid=:boid',[id],{outFormat: oracledb.OBJECT})
            .then((result) => {
              conn.close();
              return next(null, result.rows);
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
      throw new Error("not implemented yet, call your system administrator...");
    },
    post: function (req, res, next) {
      oracledb.getConnection(poolname)
        .then(function (conn) {
          const query = "INSERT INTO " + tableName + "("
            + _.keys(req.body).join(",") +") VALUES ("+
            _(req.body).keys().reduce(function(result, value) {
              return result == '' ? result + ':' + value : result + ',:' + value
            }, '')
            + ")";
          console.log('Handler.getById, executing query: ' + query);
          conn.execute(query,req.body,{outFormat: oracledb.OBJECT})
            .then((result) => {
              console.log("getById Result: " + JSON.stringify(result));
              conn.commit(function(err) {
                if (err) {return next(err);}
                conn.close();
                return next(null, result);
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


module.exports = {
  getHandler: getGenericHandler
};