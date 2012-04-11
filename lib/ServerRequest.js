var querystring = require('querystring');
var url = require('url');

var EventEmitter = require('events').EventEmitter;


var ServerRequest = function (req) {
	EventEmitter.call(this);

	var self = this;

	this.native_request_ = req;
	this.url_ = url.parse(req.url, true);
	this.pathname_ = this.url_.pathname.replace(/\/$/, '') || '/';

	var cookies = {};
	var cookie_header = req.headers['cookie'];
	if (cookie_header) {
		cookie_header.split(/;\s*/).forEach(function (pair) {
			var cookie = pair.match(/^(.*?)=(.*)$/);
			cookies[cookie[1]] = cookie[2];
		});
	}
	this.cookies = cookies;

	var data;
	var body = '';
	req.on('data', function (chunk) {
		body += chunk;
	});
	req.on('end', function () {
		self.body = querystring.parse(body);
		self.emit('body');
	});
};

require('util').inherits(ServerRequest, EventEmitter);


ServerRequest.prototype.getPathname = function () {
	return this.pathname_;
};

ServerRequest.prototype.getPathnameParts = function () {
	return this.pathname_.substr(1).split('/');
};

ServerRequest.prototype.setPathname = function (pathname) {
	if (this.pathname_.substr(-pathname.length) !== pathname) {
		throw new Error('Invalid pathname modification');
	}

	this.pathname_ = pathname;
};

ServerRequest.prototype.getMethod = function () {
	return this.native_request_.method;
};

ServerRequest.prototype.getHostLevels = function () {
	var hostname = this.native_request_.headers['host'];
	hostname = hostname.split(':')[0]

	var levels = hostname.split('.');
	var depth = levels.length;

	if (levels[depth - 1] === 'localhost') {
		depth += 1;
	}

	if (depth === 2) {
		return [ 'www' ].concat(levels);
	}
	if (depth === 3 || levels[0] !== 'www') {
		return levels;
	}
	return levels.slice(1);
};

ServerRequest.prototype.getHeader = function (key) {
	key = key.toLowerCase();

	var headers = this.native_request_.headers;
	return headers[key] || null;
};

ServerRequest.prototype.getHeaders = function () {
	var headers = this.native_request_.headers;
	return JSON.parse(JSON.stringify(headers));
};

ServerRequest.prototype.getCookie = function (key) {
	return this.cookies[key] || null;
};


module.exports = ServerRequest;
