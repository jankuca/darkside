var log = require('util').log;


/**
 * A wrapper around a native {http.Server} object that handles requests over to a router
 * @constructor
 * @param {http.Server} native_server A native server
 */
var HTTPServer = function (native_server) {
	this.native_server_ = native_server;
	this.router_ = null;
};

HTTPServer.prototype.getNativeServer = function () {
	return this.native_server_;
};

HTTPServer.prototype.setRouter = function (router) {
	this.router_ = router;
};

HTTPServer.prototype.getRouter = function () {
	return this.router_;
};

HTTPServer.prototype.listen = function (port) {
	this.native_server_.listen(port, function () {
		log('Info: HTTPServer listening on port ' + port);
	});
};

/**
 * Handles an HTTP request/response pair; passes them over to a router.
 * @param {darkside.ServerRequest} request A server request object
 * @param {darkside.ServerResponse} request A server response object
 */
HTTPServer.prototype.handle = function (request, response) {
	if (!this.router_) {
		throw new Error('No router');
	}

	this.router_.route(request, response);
};


module.exports = HTTPServer;
