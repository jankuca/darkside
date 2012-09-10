var path = require('path');
var static = require('node-static');


function StaticResourceServer(root_dir) {
	var main_dir = path.dirname(require.main.filename);
	this.root_dir_ = path.resolve(main_dir, root_dir);
	this.server_ = new static.Server(this.root_dir_);
};

StaticResourceServer.prototype.handle = function (request, response) {
	var pathname = request.getPathname();
	this.server_.serveFile(pathname, 200, {}, request, response.getNativeResponse());
};


module.exports = StaticResourceServer;
