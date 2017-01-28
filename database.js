let oracledb = require('oracledb');
let _ = require('lodash');

let initialize = function () {
  let sybaPoolPromise = oracledb.createPool(
    {
      user: 'syba',
      password: 'syba',
      connectString: '10.1.1.46/orcl',
      poolAlias: 'syba'
    }
  );

  let sysadmPoolPromise = oracledb.createPool(
    {
      user: 'syriusadm',
      password: 'syriusadm',
      connectString: '10.1.1.46/orcl',
      poolAlias: 'syriusadm'
    }
  );

  return Promise.all([sybaPoolPromise, sysadmPoolPromise])
    .then(function (pools) {
      console.log('Oracle Connection Pool: "' + pools[0].poolAlias + '" initialized.');
      console.log('Oracle Connection Pool: "' + pools[1].poolAlias + '" initialized.');

      // check whether SYBA schema is initialized in the db
      oracledb.getConnection('syba')
        .then(function(conn) {
          conn.execute('SELECT schemaVersion from SYBA.Settings', function(err, result) {
            if (err && _.startsWith(err.message, 'ORA-00942')) {
              console.log('Database: SYBA schema not present: ' + err.message);
              return createSybaSchema(conn);
            } else if (err) {
              console.log('Database: Error connecting: ' + err.message);
              throw err;
            }

            if (result && result[0][0] === '0.1') {
              console.log('Database: SYBA schema already initialized, version: ' + result[0][0])
            } else {
              console.log('Database: SYBA schema not at correct version:' + result[0]);
              throw(new Error('Schema updating not implemented, please call emergency'))
            }
          });
        }).catch(function(err) {
        throw err;
      });
      return pools;
    })
};

let createSybaSchema = function(conn) {
  console.log("Database: creating SYBA Schema");


  return conn.execute('SELECT 1 from dual');
};


module.exports = {
  init: initialize
};