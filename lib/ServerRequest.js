var querystring = require('querystring');
var url = require('url');

var EventEmitter = require('events').EventEmitter;
var IncomingForm = require('formidable').IncomingForm;


var ServerRequest = function (req) {
	EventEmitter.call(this);

	var self = this;

	this.native_request_ = req;
	this.url_ = url.parse(req.url, true);
	this.pathname_ = this.url_.pathname.replace(/\/$/, '') || '/';

	this.method = this.getMethod();
	this.headers = req.headers;

	var cookies = {};
	var cookie_header = req.headers['cookie'];
	if (cookie_header) {
		cookie_header.split(/;\s*/).forEach(function (pair) {
			var cookie = pair.match(/^(.*?)=(.*)$/);
			cookies[cookie[1]] = cookie[2];
		});
	}
	this.cookies = cookies;

	if (req.headers['content-type']) {
		self.body = {};
		self.files = {};

		var form = new IncomingForm();
		form.on('field', function (key, value) {
			self.body[key] = value;
		});
		form.on('file', function (key, value) {
			var old = self.files[key];
			if (Array.isArray(old)) {
				old.push(value);
			} else if (old) {
				self.files[key] = [ old, value ];
			} else {
				self.files[key] = value;
			}
		});
		form.once('end', function () {
			self.emit('body');
		});
		form.parse(req);
	} else {
		var data;
		var body = '';
		req.on('data', function (chunk) {
			body += chunk;
		});
		req.on('end', function () {
			self.body = querystring.parse(body);
			self.emit('body');
		});
	}
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

ServerRequest.prototype.getQuery = function () {
	return JSON.parse(JSON.stringify(this.url_.query || {}));
};

ServerRequest.prototype.getMethod = function () {
	return this.native_request_.method;
};

ServerRequest.prototype.getSearch = function () {
	return this.url_.search;
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
	if (depth > 3 && levels[0] === 'www' && levels[1] === 'www') {
		return levels.slice(1);
	}
	return levels;
};

ServerRequest.prototype.getDomain = function () {
	var levels = this.getHostLevels();
	var depth = (levels[levels.length - 1] === 'localhost') ? 1 : 2;
	var parts = levels.slice(levels.length - depth);
	return parts.join('.');
};

ServerRequest.prototype.getPort = function () {
	var hostname = this.native_request_.headers['host'];
	return Number(hostname.split(':')[1]) || 80;
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

ServerRequest.prototype.getIP = function () {
	var ip = this.getHeader('x-forwarded-for');
	if (ip) {
		return ip;
	}

	var req = this.native_request_;
	return req.connection.remoteAddress;
};

ServerRequest.prototype.isWebSocket = function () {
	return false;
};


module.exports = ServerRequest;
