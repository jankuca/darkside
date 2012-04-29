
// servers
exports.HTTPServer = require('./lib/servers/HTTPServer');
exports.StaticResourceServer = require('./lib/servers/StaticResourceServer');

// services
exports.MongoDBService = require('./lib/services/MongoDBService');

// controllers
exports.Controller = require('./lib/controllers/Controller');
exports.ApiController = require('./lib/controllers/ApiController');
exports.ViewController = require('./lib/controllers/ViewController');

// models
exports.EntityRepository = require('./lib/models/EntityRepository');
exports.Entity = require('./lib/models/Entity');

exports.SessionRepository = require('./lib/models/SessionRepository');

// utils
exports.DeclarationParser = require('./lib/util/DeclarationParser');

// general
exports.Router = require('./lib/Router');
exports.ServerRequest = require('./lib/ServerRequest');
exports.WebSocketServerRequest = require('./lib/WebSocketServerRequest');
exports.ServerResponse = require('./lib/ServerResponse');
exports.WebSocketServerResponse = require('./lib/WebSocketServerResponse');
exports.HTTPServerResponse = require('./lib/HTTPServerResponse');
exports.ServiceContainer = require('./lib/ServiceContainer');
exports.ControllerFactory = require('./lib/ControllerFactory');
exports.View = require('./lib/View');
exports.ViewStack = require('./lib/ViewStack');


// static methods

/**
 * Calls a super constructor of an object.
 * @param {!Object} instance An object.
 */
exports.base = function (Constructor, instance /* ..args */) {
  var args = Array.prototype.slice.call(arguments, 2);

  var constructor = instance.constructor;
  var ancestor = constructor.super_;
  var injector = instance.$$injector;

  if (!injector) {
    throw new Error('Not a dependency injection participant');
  }

  injector.inject(Constructor, instance);
};

/**
 * Creates an HTTPServer instance bound to a native http.Server
 * @param {?Object} http The http module to use for the native server
 * @reutnr {exports.HTTPServer}
 */
exports.createHTTPServer = function (http) {
	http = http || require('http');

	var native_server = http.createServer();
	var server = new exports.HTTPServer(native_server);

	native_server.on('request', function (req, res) {
		var request = new exports.ServerRequest(req);
		var response = new exports.HTTPServerResponse(res);

    request.once('body', function () {
      server.handle(request, response);
    });
	});

	return server;
};

exports.createWebSocketServer = function (server, socketio) {
  socketio = socketio || require('socket.io');

  var native_server;
  if (server) {
    native_server = server.getNativeServer();
  } else {
    native_server = require('http').createServer();
    server = new exports.HTTPServer(native_server);
  }

  var io = socketio.listen(native_server);

  io.enable('browser client minification');
  io.enable('browser client gzip');
  io.set('log level', 1);

  io.sockets.on('connection', function (socket) {
    socket.on('request', function (req, respond) {
      try {
        var request = new exports.WebSocketServerRequest(req, socket);
        var response = new exports.WebSocketServerResponse(respond);

        server.handle(request, response);

      } catch (err) {
        respond({
          'status': 400,
          'body': {
            'error': err.message
          }
        });
      }
    });
  });

  server.io = io;

  return server;
};


/**
 * @typedef {!{
 *   services: exports.ServiceContainer,
 *   controller_factory: exports.ControllerFactory,
 *   router: exports.Router
 * }}
 */
var Application;

/**
 * Creates a basic application graph consisting of a service container,
 * a controller factory and a router
 * @param {string} app_path The path to the application directory.
 * @return {!Application}
 */
exports.createApplication = function (app_path) {
  var services = new exports.ServiceContainer();
  var controller_factory = new exports.ControllerFactory(app_path, services);
  var router = new exports.Router(controller_factory);

  return {
    services: services,
    controller_factory: controller_factory,
    router: router
  };
};
