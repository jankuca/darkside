var ServerResponse = require('./ServerResponse');


var HTTPServerResponse = function (res) {
	ServerResponse.call(this, res);
};

require('util').inherits(HTTPServerResponse, ServerResponse);

HTTPServerResponse.prototype.head = function (status) {
	var res = this.getNativeResponse();
	res.writeHead(status);

	return this;
};

HTTPServerResponse.prototype.body = function (data, encoding) {
	encoding = encoding || 'utf8';

	var res = this.getNativeResponse();
	if (typeof data === 'object') {
		data = JSON.stringify(data, ' ', 2);
	}
	res.write(data, encoding);

	return this;
};

HTTPServerResponse.prototype.error = function (message) {
	this.body({
		'error': message
	});

	return this;
};

HTTPServerResponse.prototype.end = function (status) {
	if (status) {
		this.head(status);
	}

	var res = this.getNativeResponse();
	res.end();
};


module.exports = HTTPServerResponse;
