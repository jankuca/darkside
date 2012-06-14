var eco = require('eco');
var fs = require('fs');
var log = require('util').log;
var path = require('path');


function StaticResourceServer(root_dir) {
	var main_dir = path.dirname(require.main.filename);
	this.root_dir_ = path.resolve(main_dir, root_dir);
	this.dynamic_exts_ = [];

	this.context_builder_ = function (request, response) {
		var context = {};
		context['request'] = request;
		context['response'] = response;
		return context;
	};
};

StaticResourceServer.prototype.handle = function (request, response) {
	switch (request.getMethod()) {
		case 'GET':
			this.getFile(request.getPathname(), request, response);
			break;
		default:
			response.head(501).end();
	}
};

StaticResourceServer.prototype.getFile = function (pathname, req, response) {
	var self = this;
	var location = path.join(this.root_dir_, pathname);

	fs.stat(location, function (err, stat) {
		if (err) {
			response
				.head(404)
				.body('Not found')
				.end();
		} else if (stat.isDirectory()) {
			self.getFile(path.join(pathname, 'index.html'), req, response);
		} else {
			self.renderFile_(location, req, response);
		}
	});
};

StaticResourceServer.prototype.renderFile_ = function (location, req, res) {
	var ext = path.extname(location);

	var stream = fs.createReadStream(location);

	res.head(200);
	res.header('content-type', this.getMimeTypeForExtension(ext));
	res.writeHead();
	stream.pipe(res.getNativeResponse());
};

StaticResourceServer.prototype.getMimeTypeForExtension = function (ext) {
	switch (ext) {
	case '.html': return 'text/html; charset=UTF-8';
	case '.css': return 'text/css; charset=UTF-8';
	case '.js': return 'text/javascript; charset=UTF-8';
	default: return 'text/plain';
	}
};

StaticResourceServer.prototype.setContextBuilder = function (builder) {
	this.context_builder_ = builder;
};

StaticResourceServer.prototype.addDynamicExtension = function (ext) {
	this.dynamic_exts_.push(ext);
};

StaticResourceServer.prototype.isDynamicExtension = function (ext) {
	return (this.dynamic_exts_.indexOf(ext) !== -1);
};


module.exports = StaticResourceServer;
