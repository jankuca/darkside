var ServerResponse = require('./ServerResponse');


var HTTPServerResponse = function (res) {
	ServerResponse.call(this, res);

	this.head_sent_ = false;
	this.headers_ = [];
};

require('util').inherits(HTTPServerResponse, ServerResponse);

HTTPServerResponse.prototype.head = function (status) {
	if (this.head_sent_) {
		throw new Error('Response head already sent.');
	}

	var res = this.getNativeResponse();
	res.writeHead(status, this.headers_);
	this.head_sent_ = true;

	return this;
};

HTTPServerResponse.prototype.header = function (key, value) {
	this.headers_.push([ key, value ]);
};

HTTPServerResponse.prototype.cookie = function (key, value) {
	this.header('set-cookie', key + '=' + value);
};

HTTPServerResponse.prototype.body = function (data, encoding) {
	encoding = encoding || 'utf8';

	var res = this.getNativeResponse();
	if (typeof data === 'object') {
		data = JSON.stringify(data, ' ', 2);
	}
	if (!this.head_sent_) {
		this.head(200);
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
