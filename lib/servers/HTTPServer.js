var http = require('http');
var log = require('util').log;

var ServerRequest = require('../ServerRequest');
var HTTPServerResponse = require('../HTTPServerResponse');


var HTTPServer = function () {
	var self = this;

	this.router_ = null;
	this.server_ = http.createServer(function (req, res) {
		self.handleRequest_(req, res);
	});
};

HTTPServer.prototype.setRouter = function (router) {
	this.router_ = router;
};

HTTPServer.prototype.listen = function (port) {
	this.server_.listen(port, function () {
		log('Info: HTTPServer listening on port ' + port)
	});
};

HTTPServer.prototype.handleRequest_ = function (req, res) {
	var request = new ServerRequest(req);
	var response = new HTTPServerResponse(res);

	this.router_.route(request, response);
};


module.exports = HTTPServer;
