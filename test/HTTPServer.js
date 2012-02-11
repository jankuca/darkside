var assert = require('assert');

var HTTPServer = require('servers/HTTPServer');


exports['should accept a router'] = function () {
	var router = {};

	var server = new HTTPServer(null);
	server.setRouter(router);

	assert.equal(server.getRouter(), router);
};

exports['should throw when handling a request without a router'] = function () {
	var thrown = false;

	var server = new HTTPServer(null);
	try {
		server.handle(null, null);
	} catch (err) {
		thrown = true;
	}

	assert.equal(thrown, true);
};

exports['should tell the native server to listen when asked to listen'] = function () {
	var countdown = 1;
	var mock_native_server = {
		listen: function (port, callback) {
			if (callback) {
				callback();
			}
			countdown -= 1;
			assert.equal(port, 2000, 'wrong port number');
		}
	};

	var server = new HTTPServer(mock_native_server);
	server.listen(2000);

	assert.equal(countdown, 0, 'did not tell the native server to listen');
};

exports['should only route to a router without touching the request and the response'] = function () {
	var countdown = 1;
	var mock_request = {};
	var mock_response = {};
	var router = {
		route: function (request, response) {
			countdown -= 1;
			assert.equal(request, mock_request, 'invalid request');
			assert.equal(response, mock_response, 'invalid response');
		}
	};

	var server = new HTTPServer();
	server.setRouter(router);
	server.handle(mock_request, mock_response);

	assert.equal(countdown, 0, 'request not handled');
};
