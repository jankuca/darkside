var fs = require('fs');
var path = require('path');


function StaticResourceServer(root_dir) {
	var main_dir = path.dirname(require.main.filename);
	this.root_dir_ = path.resolve(main_dir, root_dir);
};

StaticResourceServer.prototype.handle = function (request, response) {
	switch (request.getMethod()) {
		case 'GET':
			this.getFile(request.getPathname(), response);
			break;
		default:
			response.head(501).end();
	}
};

StaticResourceServer.prototype.getFile = function (pathname, response) {
	var self = this;
	var location = path.join(this.root_dir_, pathname);

	fs.stat(location, function (err, stat) {
		if (err) {
			response
				.head(404)
				.body('Not found')
				.end();
		} else if (stat.isDirectory()) {
			self.getFile(path.join(pathname, 'index.html'), response);
		} else {
			fs.readFile(location, 'binary', function (err, data) {
				if (err) {
					response
						.head(403)
						.body('Not allowed')
						.end();
				} else {
					response
						.header('content-type', self.getMimeTypeForPathname(pathname))
						.head(200)
						.body(data, 'binary')
						.end();
				}
			});
		}
	});
};

StaticResourceServer.prototype.getMimeTypeForPathname = function (pathname) {
	var ext = path.extname(pathname);

	switch (ext) {
	case '.html': return 'text/html; charset=UTF-8';
	case '.css': return 'text/css; charset=UTF-8';
	case '.js': return 'text/javascript; charset=UTF-8';
	default: return 'text/plain';
	}
};


module.exports = StaticResourceServer;
