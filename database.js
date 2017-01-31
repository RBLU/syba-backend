const oracledb = require('oracledb');
const _ = require('lodash');
const fs  = require('fs');

const SYBA_schemadir = './SQL/SYBA/';

// TODO: Read this from config file
const currentSoftwareSchemaVersion = '1';

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
              conn.close();
              return updateSybaSchema(null, currentSoftwareSchemaVersion);
            } else if (err) {
              console.log('Database: Error connecting: ' + err.message);
              conn.close();
              throw err;
            }
            if (result && result.rows[0] && result.rows[0][0] === currentSoftwareSchemaVersion) {
              console.log('Database: SYBA schema already initialized, version: ' + result.rows[0][0])
              conn.close();
            } else {
              console.log('Database: SYBA schema not at correct version:' + result.rows[0][0]);
              return updateSybaSchema(result.rows[0][0], currentSoftwareSchemaVersion);
            }
          });
        }).catch(function(err) {
        throw err;
      });
      return pools;
    })
};

let updateSybaSchema = function(currentVersion, targetVersion) {
  if (currentVersion) {
    throw(new Error('Schema updating not implemented, call emergency help'));
  }
  console.log("Database: creating SYBA Schema");
  var promises = [];
  const schemadir = SYBA_schemadir + '/v_' + targetVersion;
  fs.readdir(schemadir, (err, files) => {
    if (err) {
      throw err;
    }
    console.log("Database: Found Schema Files: " + JSON.stringify(files));
    files.sort().forEach((filename) => {
      console.log("Database: Processing: " + filename);
      fs.readFile(schemadir +'/'+ filename, 'UTF-8', (err, content) => {
        if (err) {
          throw err;
        }
        promises.push(
        oracledb.getConnection('syba')
          .then((conn) => {
            conn.execute(content)
              .then((result) => {
                conn.commit()
                  .then((err) => {
                    if (err) {
                      throw err;
                    }
                    conn.close();
                    console.log("SUCCESS: " + filename + ': ' + JSON.stringify(result));
                    return result;
                  });
              })
              .catch((err) => {
                conn.close();
                if (_.startsWith(err.message, 'ORA-00955')) {
                  console.log("Database: " + err.message + ": "+ filename);
                  return;
                }
                console.log("Error while executing: " + content);
                console.log(err);
              });
          })
          .catch((err) => {
            throw err;
          })
        );
      });
    });
    return Promise.all(promises);
  });

};


module.exports = {
  init: initialize
};