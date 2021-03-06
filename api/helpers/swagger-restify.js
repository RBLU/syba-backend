const SWAGGER_CONTROLLER_KEY = 'x-swagger-router-controller';
const _ = require('lodash');


function convertSwaggerPathToRestify(pathNameSwagger) {
  //
  return pathNameSwagger.replace(/{/g, ':').replace(/}/g, '');
}

module.exports = {
  register: function (server, runner, authenticateAccessFn) {

    _.each(runner.swagger.paths, (pathConfig, pathNameSwagger) => {
      let controllerName = '../controllers/' + pathConfig[SWAGGER_CONTROLLER_KEY];

      if (pathNameSwagger == '/swagger') {
        server.log.info({
          path: runner.swagger.basePath + convertSwaggerPathToRestify(pathNameSwagger),
          operation: 'get',
          controller: 'defaultSwaggerController'
        }, "registering route");
        server.get(runner.swagger.basePath + convertSwaggerPathToRestify(pathNameSwagger), function (req, res, next) {
          res.send(runner.swagger);
          return next();
        });
      } else {
        let path = runner.swagger.basePath + convertSwaggerPathToRestify(pathNameSwagger);
        if (controllerName) {
          try {
            let controller;

            controller = require(controllerName);

            _.each(pathConfig, (operationConfig, operationName) => {

              let functionName = pathConfig[operationName].operationId || operationName;
              const accessLevel =  pathConfig[operationName]['x-accessLevel'] || 'al_all';

              if (!operationName.startsWith('x-')) {
                if (!_.isFunction(controller[functionName])) {
                  server.log.error({
                    controllerName: controllerName,
                    functionName: functionName,
                    operationName: operationName,
                    path: path
                  }, 'Controller Function not found: '+ functionName + ' in: ' + controllerName + ' , skipping this route');
                } else {
                  operationName = operationName == 'delete' ? 'del':operationName;
                  server.log.info({
                    path: path,
                    operation: operationName,
                    controller: controllerName,
                    functionName: functionName,
                    accessLevel: accessLevel
                  }, "registering route");

                  const handlers = [];

                  if (authenticateAccessFn) {
                    handlers.push(authenticateAccessFn(accessLevel))
                  }
                  handlers.push(controller[functionName]);

                  // really do the operation
                  server[operationName](path, handlers);
                }
              }
            });
          } catch (err) {
            server.log.error({
              err: err,
              controllerName: controllerName,
              path: path
            }, "Controller not Found, skipping registration of route")
          }
        }
      }
    })
  }
};