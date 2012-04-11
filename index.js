
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
exports.ServerResponse = require('./lib/ServerResponse');
exports.HTTPServerResponse = require('./lib/HTTPServerResponse');
exports.ServiceContainer = require('./lib/ServiceContainer');
exports.ControllerFactory = require('./lib/ControllerFactory');
exports.View = require('./lib/View');
exports.ViewStack = require('./lib/ViewStack');


// static methods

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
