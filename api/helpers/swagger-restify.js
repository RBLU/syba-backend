const SWAGGER_CONTROLLER_KEY = 'x-swagger-router-controller';
const _ = require('lodash');


function convertSwaggerPathToRestify(pathNameSwagger) {
  //
  return pathNameSwagger.replace(/{/g, ':').replace(/}/g, '');
}

module.exports = {
  register: function (server, runner) {

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
              if (!operationName.startsWith('x-')) {
                if (!_.isFunction(controller[functionName])) {
                  throw new Error("Controller Function not found: " + functionName + " in: " + controllerName);
                }
                server.log.info({
                  path: path,
                  operation: operationName,
                  controller: controllerName
                }, "registering route");
                server[operationName](path, controller[functionName]);
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