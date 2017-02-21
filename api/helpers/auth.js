const jwt = require('jwt-simple');
const passport = require('passport');
const passportHttp = require('passport-http');
const BearerStrategy = require('passport-http-bearer').Strategy;
const oracleDb = require('oracledb');
const bcrypt = require('bcrypt');
const restify = require('restify');

var _ = require('lodash');
var moment = require('moment');

var roles = {
    anonymous: 'anonymous',
    viewer: 'viewer',
    operator: 'operator',
    administrator: 'administrator',
    developer: 'developer',
    systemadmin: 'systemadmin'
  },

  accessLevels = {
    al_all: [roles.anonymous, roles.viewer, roles.operator, roles.administrator, roles.developer, roles.systemadmin],
    al_anonymousonly: [roles.anonymous],
    al_user: [roles.viewer, roles.operator, roles.administrator, roles.developer, roles.systemadmin],
    al_operator: [roles.operator, roles.systemadmin, roles.administrator, roles.developer],
    al_administrator: [roles.developer, roles.systemadmin, roles.administrator],
    al_developer: [roles.developer, roles.systemadmin],
    al_systemadmin: [roles.systemadmin]
  };


function checkAccess(user, accessLevel, callback) {
  // if we do not have a user, we only allow anonymous
  if (!user) {
    if (accessLevel === 'al_all' || accessLevel === 'al_anonymousonly') {
      if (callback) {
        return callback();
      } else {
        return true;
      }
    } else if (Array.isArray(accessLevel) &&
      (_.contains(accessLevel, roles.anonymous))) {
      if (callback) {
        return callback();
      } else {
        return true;
      }
    } else {
      if (callback) {
        return callback(
          user ?
            new restify.NotAuthorizedError('You are authenticated - but you don\'t have the required role for this call')
            : new restify.UnauthorizedError('You are not authenticated - I don\'t know you!'));
      } else {
        return false;
      }

    }
  }

  const suppliedRoles = getRolesFromUser(user);
  if (!Array.isArray(accessLevel)) {
    accessLevel = accessLevels[accessLevel];
  }

  if (_.intersection(accessLevel, suppliedRoles).length > 0) {
    if (callback) {
      return callback();
    } else {
      return true;
    }
  } else {
    if (callback) {
      return callback(new restify.NotAuthorizedError(`Required Level: ${accessLevel}, your recognized Roles: '${suppliedRoles}', your stored ROLES: '${user.ROLES}'`));
    } else {
      return false;
    }
  }
}

function getRolesFromUser(user) {
  var userRoles = [];
  if (user && user.ROLES) {
    userRoles = user.ROLES.split(',');
  } else if (Array.isArray((user))) {
    userRoles = user;
  } else if (_.isString(user)) {
    userRoles = [user];
  } else if (!user) {
    userRoles = [roles.anonymous];
  }
  return userRoles;
}

function getAuthHandlers(config) {

  function roleBasedAuth(accessLevel) {
    if (!accessLevels[accessLevel]) {
      throw new Error('unknown accessLevel: ' + accessLevel);
    }
    return function (req, res, next) {
      passport.authenticate(['bearer', 'basic'], function (err, user, callenges, statuses) {
        if (err) {
          req.log.error({err: err}, 'error when trying to authenticate');
          return next(new restify.InvalidArgumentError(err));
        }
        req.log.debug({user: user, accessLevel: accessLevel}, "checking access for route");
        checkAccess(user, accessLevel, function (err) {
          if (err) {
            req.log.error({err: err}, "error in auth.checkAcess()");
            return next(err);
          } else {
            req.user = user;
            return next();
          }
        });
      })(req, res, next);
    };
  }


  /**
   * checkes whether the supplied credentials are belonging to a valid user in the local database.
   * The parameter username may also be used with the user's email address.cd
   * Calls done(error, user) at the end.
   *
   * @param username the user's username or email address
   * @param password the user's password
   * @param done callback to be called with the result, takes to arguments error and user. user is passedwhen
   * authenication is successful, otherwise it will pass false.
   */
  const validateLocalUsernamePassword = function (username, password, done) {
    oracleDb.getConnection('syba')
      .then((conn) => {
        conn.execute('SELECT * FROM LOCALUSER WHERE username = :USERNAME',
          {USERNAME: username},
          {outFormat: oracleDb.OBJECT, maxRows: 500})
          .then((result) => {
            if (result.rows.length == 0) {
              return done(null, false);
            } else {
              let user = result.rows[0];
              bcrypt.compare(password, user.HASHEDPASSWORD, (err, isValid) => {
                if (err) {
                  return done(err);
                }
                delete user.HASHEDPASSWORD;
                if (isValid) {
                  return done(null, user);
                } else {
                  return done(null, false);
                }
              });
            }
          })
          .catch((err) => {
            return done(err);
          })
      })
      .catch((err) => {
        return done(err);
      });
  };


  function _validateBearerToken(token, done) {
    if (token) {
      try {
        const decoded = jwt.decode(token, config.accessTokenSecret);
        if (decoded.exp <= Date.now()) {
          return done(new Error('Token Expired Error'));
        }

        const username = decoded.iss;
        oracleDb.getConnection('syba')
          .then((conn) => {
            conn.execute('SELECT * FROM SYBA.LOCALUSER WHERE username = :USERNAME',
              {USERNAME: username},
              {outFormat: oracleDb.OBJECT, maxRows: 500})
              .then((result) => {
                if (result.rows.length == 0) {
                  return done(null, false);
                } else {
                  let user = result.rows[0];
                  return done(null, user, {scope: 'all', roles: user.ROLES});
                }
              })
              .catch((err) => {
                return done(err);
              })
          })
          .catch((err) => {
            return done(err);
          });
      } catch (err) {
        return done(err);
      }
    } else {
      done();
    }
  }

  function _calculateToken(user) {
    var expires = moment().add(7, 'days').valueOf();

    return {
      encodedToken: jwt.encode({iss: user.USERNAME, exp: expires}, config.accessTokenSecret),
      expires: expires
    };
  }


  function loginAndExchangeTokenRedirect(req, res, next) {
    if (!req.user) {
      return error.handleError(new Error('User must be defined at this point'), next);
    }
    var tokenInfo = _calculateToken(req.user);

    res.header('Location', config.webclientUrl + '/#home?token=' + tokenInfo.encodedToken + '&expires=' + tokenInfo.expires);
    res.send(302);
  }


  function loginAndExchangeTokenAjax(req, res, next) {
    if (!req.user) {
      return next(new restify.InternalServerError('User must be authenticated and loaded at this point'));
    }
    req.log.trace({user: req.user}, '/login: user authenticated');

    var tokenInfo = _calculateToken(req.user);

    var payload = {
      user: req.user,
      token: tokenInfo.encodedToken,
      expires: tokenInfo.expires
    };

    res.send(payload);
    return next();
  }

  function setupPassport(passport) {
    // setup authentication, currently only HTTP Basic auth over HTTPS is supported
    passport.use(new passportHttp.BasicStrategy(validateLocalUsernamePassword));
    passport.use(new BearerStrategy(_validateBearerToken));
  }

  function logoutFn(req, res, next) {
    if (!req.params.token && !req.body.token) {
      res.send(201, {removedDevice: "no Token Sent, no device removed"});
      return next();
    }

    var profile = req.user.profile;

    var deviceToRemove = _.find(profile.devices, function (dev) {
      return dev.token === (req.params.token || req.body.token);
    });

    if (deviceToRemove) {
      profile.devices.pull(deviceToRemove);
      profile.save(function (err, result) {
        if (err) {
          return next(err);
        }
        res.send(201, {removedDevice: deviceToRemove});
        return next();
      });
    } else {
      res.send(201, {removedDevice: "device not found, not removed"});
      return next();
    }
  }

  return {
    roleBasedAuth: roleBasedAuth,
    loginAndExchangeTokenRedirect: loginAndExchangeTokenRedirect,
    loginAndExchangeTokenAjax: loginAndExchangeTokenAjax,
    setupPassport: setupPassport,
    logout: logoutFn
  };
}

module.exports = {
  handlers: getAuthHandlers,
  accessLevels: accessLevels,
  checkAccess: checkAccess,
  roles: roles
};
