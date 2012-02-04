var log = require('util').log;
var path = require('path');
path.relative = path.relative || require('./path-improved').relative;

var DeclarationParser = require('./DeclarationParser');


var Router = function () {
	this.controller_path_ = path.dirname(require.main.filename);
	this.route_declaration_path_ = null;
	this.type_handlers_ = {};
	this.isLoaded_ = false;
};

Router.prototype.setControllerPath = function (controller_path) {
	var main_path = path.dirname(require.main.filename);
	this.controller_path_ = path.resolve(main_path, controller_path);
};

Router.prototype.setRouteDeclaration = function (file_path) {
	var main_path = path.dirname(require.main.filename);
	this.route_declaration_path_ = path.resolve(main_path, file_path);
};

Router.prototype.setRouteTypeHandler = function (type, handler) {
	this.type_handlers_[type] = handler;
};

Router.prototype.route = function (request, response) {
	var self = this;

	if (!this.isLoaded_) {
	// If the route declaration is not loaded, try loading them before responding
		this.update_(function (err) {
			if (err) {
				log(err.toString());
				response.end(503);
			} else {
				self.route(request, response);
			}
		});
	} else {
		this.route_(request, response);
	}
};

Router.prototype.route_ = function (request, response) {
	var host = request.getHostLevels()[0];
	var method = request.getMethod();
	var pathname = request.getPathname();

	var route = this.getRouteByHostAndPathname_(host, pathname);
	var target = (typeof route === 'number') ? route : route[2];

	switch (typeof target) {
		case 'number':
			log(method + ' ' + pathname + ' -> ' + target);
			response.end(target);
			return;

		case 'string':
			log(method + ' ' + pathname + ' -> ' + target);
			this.routeToControllerAction_(request, response, target, route[3]);
			return;

		default:
			log(method + ' ' + pathname + ' -> [type handler]');
			route[0] = route[0].replace(/\*$/, '');
			pathname = '/' + path.relative(route[0], pathname);
			request.setPathname(pathname);
			target.handle(request, response, route[3]);
	}
};

Router.prototype.getRouteByHostAndPathname_ = function (host, pathname) {
	var routes = this.hosts_[host] || this.hosts_['*'];
	if (!routes) {
		return 404;
	}

	var route, match, param_keys, params;
	for (var i = 0, ii = routes.length; i < ii; ++i) {
		route = routes[i];
		match = pathname.match(route[1]);
		if (match) {
			param_keys = route[0].match(/:[\w\-]+/g) || [];
			params = {};
			param_keys.forEach(function (key, i) {
				key = key.substr(1);
				params[key] = match[i + 1];
			});
			return route.concat([ params ]);
		}
	}
};

Router.prototype.routeToControllerAction_ = function (request, response, target, params) {
	var target_parts = target.split(':');
	var controller_name = target_parts[1].replace(/^\W?[a-z]/, function (str) { return str.toUpperCase() });
	var action = target_parts[2];

	var controller_path = path.join(this.controller_path_, target_parts[0], controller_name + 'Controller.js');

	var startAction = function (missingTargetActionCallback) {
		try {
			var Controller = require(controller_path);
			var controller = new Controller(request, response);
			if (!controller[action]) {
				missingTargetActionCallback();
			} else {
				controller[action](params);
			}
		} catch (err) {
			log(err.stack);
			response.end(500);
		}
	};

	startAction(function () {
		// Missing target action
		// Try clearing the cache and refreshing the Controller
		delete require.cache[controller_path];
		startAction(function () {
			// The target action is definitely missing.
			log('Error: Missing target action ' + target);
			response.end(500);
		});
	});
};

Router.prototype.update_ = function (callback) {
	var file_path = this.route_declaration_path_;
	if (!file_path) {
		return callback(new Error('Route declaration path not specified'));
	}
	if (!path.existsSync(file_path)) {
		return callback(new Error('Missing route declaration file'));
	}

	try {
		var declaration = DeclarationParser.parse(this.route_declaration_path_, this.type_handlers_);
		this.updateRoutes_(declaration);
		this.isLoaded_ = true;
	} catch (err) {
		return callback(new Error('Error parsing the route declaration file: ' + err.message));
	}
	callback(null);
};

Router.prototype.updateRoutes_ = function (declaration) {
	this.hosts_ = {};

	var level = function (directory, declaration, routes) {
		Object.keys(declaration).forEach(function (key) {
			var item = declaration[key];
			var resource_path = path.join(directory, key);

			if (item.constructor === Object) {
				level(resource_path, item, routes);
			} else {
				routes.push([ resource_path, item ]);
			}
		});
	};

	var process = function (routes) {
		routes = routes.sort(function (a, b) {
			a = a[0];
			b = b[0];
			if (a[a.length - 1] === '*' && b[b.length - 1] !== '*') {
				return 1;
			} else  if (a[a.length - 1] !== '*' && b[b.length - 1] === '*') {
				return -1;
			}
			return (a > b) ? 1 : -1;
		});

		return routes.map(function (route) {
			var path = route[0];
			path = path.replace('*', '.*');
			path = path.replace(/:[\w\-]+/g, '([^\\/]+)');
			var pattern = new RegExp('^' + path + '$');
			return [ route[0], pattern, route[1] ];
		});
	};

	Object.keys(declaration).forEach(function (host) {
		var routes = [];
		level('/', declaration[host], routes);
		routes = process(routes);

		this.hosts_[host] = routes;
	}, this);
};


module.exports = Router;
