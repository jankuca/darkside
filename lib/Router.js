var log = require('util').log;
var path = require('path');
path.relative = path.relative || require('./path-improved').relative;

var DeclarationParser = require('./util/DeclarationParser');


var Router = function (controller_factory) {
	this.controller_factory_ = controller_factory;

	this.route_declaration_path_ = null;
	this.type_handlers_ = {};
	this.isLoaded_ = false;
};

Router.prototype.setRouteDeclaration = function (file_path) {
	var main_path = path.dirname(require.main.filename);
	this.route_declaration_path_ = path.resolve(main_path, file_path);

	try {
		this.update();
	} catch (err) {
		this.route_declaration_path_ = null;
		throw err;
	}
};

Router.prototype.getRouteDeclaration = function () {
	return this.route_declaration_path_;
};

Router.prototype.setRouteTypeHandler = function (type, handler) {
	this.type_handlers_[type] = handler;
};

Router.prototype.getTargetURL = function (target, params, request) {
	params = params || {};

	var route = this.getRouteByTargetAndParams_(target, params);
	if (!route) {
		return null;
	}

	var pathname_and_search = this.fillPathnameWithParams_(route.pathname, params);

	// If the route belongs to a different host than the original request
	var host_levels = request ? request.getHostLevels() : [ route.host ];
	var current_host = host_levels[0];
	if (current_host === route.host) {
		return pathname_and_search;
	} else {
		host_levels[0] = route.host;
		// We need to keep the eventual :port part of the host.
		var port = request.getPort();
		port = port === 80 ? '' : ':' + port;
		var host = host_levels.join('.') + port;

		return 'http://' + host + pathname_and_search;
	}
};

Router.prototype.getRouteByTargetAndParams_ = function (target, params) {
	var hosts = Object.keys(this.hosts_);
	for (var i = 0, ii = hosts.length; i < ii; ++i) {
		var host = hosts[i];
		var routes = this.hosts_[host];
		for (var o = 0, oo = routes.length; o < oo; ++o) {
			var route = routes[o];
			if (route.target === target) {
				// We need to check if all the param placeholders in the route pathname pattern
				// would be filled with the given parameters.
				var param_placeholders = route.pathname.match(/:[\w\-]+/g) || [];
				var all_params_match = param_placeholders.every(function (key) {
					return (typeof params[key.substr(1)] !== 'undefined');
				});
				if (all_params_match) {
					return route;
				}
			}
		}
	}
	return null;
};

Router.prototype.route = function (request, response) {
	var self = this;

	if (!this.isLoaded_) {
		// If the route declaration is not loaded, respond with a 503
		log('Routes were not loaded');
		response.end(503);
	} else {
		this.route_(request, response);
	}
};

Router.prototype.route_ = function (request, response) {
	var host = request.getHostLevels()[0];
	var method = request.getMethod();
	var pathname = request.getPathname();
	var params = request.getQuery();

	var route = this.getRouteByHostAndPathname_(host, pathname);
	if (!route) {
		log(method + ' ' + host + ':' + pathname + ' -> 404 [no route]');
		response.end(404);
		return;
	}

	if (route.params) {
		Object.keys(route.params).forEach(function (key) {
			params[key] = route.params[key];
		});
	}

	var target = (typeof route === 'number') ? route : route.target;

	switch (typeof target) {
		case 'number':
			log(method + ' ' + host + ':' + pathname + ' -> ' + target);
			response.end(target);
			return;

		case 'string':
			log(method + ' ' + host + ':' + pathname + ' -> ' + target);
			if (target[0] === '/') {
				this.redirect_(response, target);
			} else {
				this.routeToControllerAction_(request, response, target, params);
			}
			return;

		default:
			var name = target.constructor.name;
			log(method + ' ' + host + ':' + pathname + ' -> ' +
				'[' + (name || 'type handler') + ']');
			pathname = '/' + path.relative(route.pathname, pathname);
			request.setPathname(pathname);
			target.handle(request, response, params);
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
		match = pathname.match(route.pattern);
		if (match) {
			var pathname = route.pathname.replace(/\*$/, '');
			param_keys = pathname.match(/:[\w\-]+/g) || [];
			params = {};
			param_keys.forEach(function (key, i) {
				key = key.substr(1);
				params[key] = match[i + 1];
				pathname = pathname.replace(':' + key, match[i + 1]);
			});
			return {
				host: route.host,
				pathname: pathname,
				target: route.target,
				params: params
			};
		}
	}
};

Router.prototype.redirect_ = function (response, target) {
	response.header('location', target).end(302);
};

Router.prototype.routeToControllerAction_ = function (request, response, target, params) {
	var factory = this.controller_factory_;
	if (!factory) {
		log('Error: No controller factory specified');
		response.end(500);
		return;
	}

	var target_parts = target.split(':');
	var action = target_parts[2];

	var controller = factory.createController(target_parts[0], target_parts[1], this, request, response);
	if (!controller) {
		log('Error: Missing target controller ' + target_parts[0] + ':' + target_parts[1]);
		response.end(500);
	} else if (!controller.hasAction(action)) {
		log('Error: Missing target action ' + target);
		response.end(500);
	} else {
		try {
			controller.callAction(action, params);
		} catch (err) {
			log(err.stack || err.message);
			response.end(500);
		}
	}
};

Router.prototype.fillPathnameWithParams_ = function (pathname, params) {
	var placeholders = pathname.match(/:[\w\-]+/g) || [];
	var query = [];
	Object.keys(params).forEach(function (key) {
		var value = params[key];
		if (placeholders.indexOf(':' + key) !== -1) {
			pathname = pathname.replace(':' + key, value);
		} else {
			query.push(key + '=' + encodeURIComponent(value));
		}
	});

	return pathname + (query.length ? '?' + query.join('&') : '');
};

Router.prototype.update = function () {
	var file_path = this.route_declaration_path_;
	if (!file_path) {
		throw new Error('Route declaration path not specified');
	}

	try {
		var declaration = DeclarationParser.parse(this.route_declaration_path_, this.type_handlers_);
		this.updateRoutes_(declaration);
		this.isLoaded_ = true;
	} catch (err) {
		throw new Error('Error parsing the route declaration file: ' + err.message);
	}
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
				resource_path = resource_path.replace(/\/$/, '') || '/';
				routes.push([ resource_path, item ]);
			}
		});
	};

	var process = function (host, routes) {
		routes = routes.sort(function (a, b) {
			a = a[0];
			b = b[0];
			if (a[a.length - 1] === '*' && b[b.length - 1] !== '*') {
				return 1;
			}
			if (a.search(/:/)) {
				return -1;
			}
			return (a > b) ? 1 : -1;
		});

		return routes.map(function (route) {
			var pathname = route[0];
			pathname = pathname.replace(/<[^>]+>/g, '');

			var pattern_source = route[0];
			pattern_source = pattern_source.replace('*', '.*');
			pattern_source = pattern_source.replace(/:[\w\-]+<([^>]+)>/g, function (match) {
				return '(' + match.split('<')[1].split('>')[0] + ')';
			});
			pattern_source = pattern_source.replace(/:[\w\-]+/g, '([^\\/]+)');
			var pattern = new RegExp('^' + pattern_source + '$');

			return {
				host: host,
				pathname: pathname,
				pattern: pattern,
				target: route[1]
			};
		});
	};

	Object.keys(declaration).forEach(function (host) {
		var routes = [];
		level('/', declaration[host], routes);
		routes = process(host, routes);

		this.hosts_[host] = routes;
	}, this);
};


module.exports = Router;
