var url = require('url');

var Controller = require('./controllers/Controller');
var Session = require('./models/Session');


var ServerRequest = function (req) {
	this.native_request_ = req;
	this.url_ = url.parse(req.url, true);
	this.pathname_ = this.url_.pathname.replace(/\/$/, '') || '/';

	var cookies = {};
	var cookie_header = req.headers['cookie'];
	if (cookie_header) {
		cookie_header.split('; ').forEach(function (pair) {
			var cookie = pair.match(/^(.*?)=(.*)$/);
			cookies[cookie[1]] = cookie[2];
		});
	}
	this.cookies = cookies;
};

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
		levels.push('');
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

ServerRequest.prototype.getSession = function (key, callback, ctx) {
	callback = Controller.createSafeCallback(callback, ctx);

	var id = this.cookies[key] || Session.generateId(this);
	Session.getById(id, function (err, session) {
		callback.call(ctx, err, session);
	}, ctx);
};


module.exports = ServerRequest;