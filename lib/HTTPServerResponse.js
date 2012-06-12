var ServerResponse = require('./ServerResponse');


var HTTPServerResponse = function (res) {
	ServerResponse.call(this, res);

	this.status = 0;
	this.head_sent_ = false;
	this.headers_ = [];
};

require('util').inherits(HTTPServerResponse, ServerResponse);

HTTPServerResponse.prototype.head = function (status) {
	if (this.head_sent_) {
		throw new Error('Response head already sent.');
	}

	this.status = status || 200;

	return this;
};

HTTPServerResponse.prototype.writeHead_ = function () {
	var res = this.getNativeResponse();
	res.writeHead(this.status, this.headers_);
	this.head_sent_ = true;
};

HTTPServerResponse.prototype.header = function (key, value) {
	this.headers_.push([ key, value ]);

	return this;
};

HTTPServerResponse.prototype.cookie = function (key, value, domain) {
	var parts = [
		key + '=' + value,
		'path=/'
	];
	if (domain) {
		parts.push('domain=.' + domain);
	}

	this.header('set-cookie', parts.join(';'));

	return this;
};

HTTPServerResponse.prototype.body = function (data, encoding) {
	encoding = encoding || 'utf8';

	var res = this.getNativeResponse();

	if (data instanceof Error) {
		data = {
			'error': data.toString(),
			'stack': data.stack
		};
	}
	if (typeof data === 'object') {
		data = JSON.stringify(data, ' ', 2);
		this.header('content-type', 'application/json; charset=UTF-8');
	}
	if (!this.head_sent_) {
		this.writeHead_();
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
		this.writeHead_();
	}

	var res = this.getNativeResponse();
	res.end();
};


module.exports = HTTPServerResponse;
