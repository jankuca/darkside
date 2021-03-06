var colors = require('./colors');
var log = require('util').log;
var path = require('path');
var url = require('url');

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
		host_levels[0] = (route.host === '*') ? current_host : route.host;
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
		log(colors.bold.RED + 'Routes were not loaded' + colors.DEFAULT);
		response.end(503);
	} else {
		this.route_(request, response);
	}
};

Router.prototype.route_ = function (request, response) {
	var host_levels = request.getHostLevels();

	var host = host_levels[0];
	var hostname = host_levels.join('.');
	var method = request.getMethod();
	var search = request.getSearch();
	var pathname = request.getPathname();
	var params = request.getQuery();

	var log_string =
		colors.regular.BLUE + method + ' ' +
		colors.intense.BLACK + hostname +
		colors.DEFAULT + pathname +
		colors.regular.CYAN + search +
		colors.DEFAULT;

	var notFound = function () {
		log(log_string +
			colors.regular.PURPLE + ' -> ' +
			colors.intense.RED + '404' +
			colors.DEFAULT + ' [no route]');
		response.end(404);
	};

	var routes = this.getRoutesByHostAndPathname_(host, pathname);
	if (!routes) {
		return notFound();
	}

	var route;
	for (var i = 0, ii = routes.length; i < ii; ++i) {
		route = routes[i];
		if (!route.method || route.method === method) {
			break;
		}
		if (i + 1 === ii) {
			return notFound();
		}
	}

	if (route.params) {
		Object.keys(route.params).forEach(function (key) {
			params[key] = route.params[key];
		});
	}

	var target = (typeof route === 'number') ? route : route.target;

	switch (typeof target) {
		case 'number':
			log(log_string +
				colors.regular.PURPLE + ' -> ' +
				colors.intense.RED + target +
				colors.DEFAULT);
			response.end(target);
			return;

		case 'string':
			log(log_string +
				colors.regular.PURPLE + ' -> ' +
				colors.intense.GREEN + target +
				colors.DEFAULT);
			if (target[0] === '/') {
				this.redirect_(response, target);
			} else if (target === 'CORS') {
				this.returnCORSHeaders_(request, response, route.origins);
			} else {
				this.routeToControllerAction_(request, response, target, params);
			}
			return;

		default:
			var relative = path.relative('.' + route.pathname, '.' + pathname);
			if (relative.substr(0, 2) === '..') {
				log(log_string + ' -> 400');
				response.end(400);
				return;
			}
			relative = relative.replace(/\\/g, '/');

			var name = target.constructor.name;
			log(log_string +
				colors.regular.PURPLE + ' -> ' +
				colors.intense.BLACK + '[' + (name || 'type handler') + ']' +
				colors.DEFAULT);
			request.setPathname('/' + relative);
			target.handle(request, response, params);
	}
};

Router.prototype.getRoutesByHostAndPathname_ = function (host, pathname) {
	var routes = this.hosts_[host] || this.hosts_['*'];
	if (!routes) {
		return null;
	}

	var matches = [];
	for (var i = 0, ii = routes.length; i < ii; ++i) {
		var route = routes[i];
		var match = pathname.match(route.pattern);
		if (match) {
			var route_pathname = route.pathname.replace(/\*$/, '');
			var param_keys = route_pathname.match(/:[\w\-]+/g) || [];
			var params = {};
			param_keys.forEach(function (key, i) {
				key = key.substr(1);
				params[key] = match[i + 1];
				route_pathname = route_pathname.replace(':' + key, match[i + 1]);
			});
			matches.push({
				host: route.host,
				origins: route.origins,
				method: route.method,
				pathname: route_pathname,
				target: route.target,
				params: params
			});
		}
	}

	return matches.length ? matches : null;
};

Router.prototype.redirect_ = function (response, target) {
	response.header('location', target).end(302);
};

Router.prototype.returnCORSHeaders_ = function (request, response, origins) {
	var origin_header = request.headers['origin'];
	if (!origin_header) {
		return;
	}

	var origin = url.parse(origin_header);
	var hostname = origin.hostname;
	var host = hostname.split('.')[0];
	if (origins.indexOf(host) !== -1 || origins.indexOf('*') !== -1) {
		var headers = request.headers['access-control-request-headers'];
		var method = request.headers['access-control-request-method'];

		response.header('access-control-allow-origin', origin_header);
		response.header('access-control-allow-headers', headers);
		response.header('access-control-allow-method', method);
	}

	response.end();
};

Router.prototype.routeToControllerAction_ = function (request, response, target, params) {
	var origin_header = request.headers['origin'];
	if (origin_header) {
		response.header('access-control-allow-origin', origin_header);
	}

	var factory = this.controller_factory_;
	if (!factory) {
		log('\033[0;31mError:\033[0m No controller factory specified');
		response.end(500);
		return;
	}

	var target_parts = target.split(':');
	var action = target_parts[2];

	var controller = factory.createController(target_parts[0], target_parts[1], this, request, response);
	if (!controller) {
		log('\033[0;31mError:\033[0m Missing target controller ' + target_parts[0] + ':' + target_parts[1]);
		response.end(500);
	} else if (!controller.hasAction(action)) {
		log('\033[0;31mError:\033[0m Missing target action ' + target);
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
		err.message = 'Error parsing the route declaration file: ' + err.message;
		throw err;
	}
};

Router.prototype.updateRoutes_ = function (declaration) {
	this.hosts_ = {};

	var level = function (directory, declaration, routes) {
		Object.keys(declaration).forEach(function (key) {
			var item = declaration[key];

			var method = null;
			if (/^[A-Z]+\s/.test(key)) {
				method = key.split(/\s/)[0];
				key = key.replace(/^[A-Z]+\s/, '');
			}

			var resource_path = directory.replace(/\/$/, '') + key;

			if (item.constructor === Object) {
				level(resource_path, item, routes);
			} else {
				resource_path = resource_path.replace(/\/$/, '') || '/';
				routes.push([ method, resource_path, item ]);
			}
		});
	};

	var process = function (host, routes, origins) {
		routes = routes.sort(function (a, b) {
			if (a[0] && !b[0] || !a[0] && b[0]) {
				return a[0] ? -1 : 1;
			}

			a = a[1];
			b = b[1];
			a_len = a.length;
			b_len = b.length;
			if (a[a_len - 1] === '*' && b[b_len - 1] === '*') {
				var a_part_count = a.split('/').length;
				var b_part_count = b.split('/').length;
				if (a_part_count < b_part_count) {
					return 1;
				}
				return (a_part_count === b_part_count) ? 0 : -1;
			}
			if (a[a_len - 1] === '*' && b[b_len - 1] !== '*') {
				return 1;
			}
			if (a.search(/:/)) {
				return -1;
			}
			return (a > b) ? 1 : -1;
		});

		routes.unshift([ 'OPTIONS', '/*', 'CORS' ])

		return routes.map(function (route) {
			var pathname = route[1];
			pathname = pathname.replace(/<[^>]+>/g, '');

			var pattern_source = route[1];
			pattern_source = pattern_source.replace('*', '.*');
			pattern_source = pattern_source.replace(/:[\w\-]+<([^>]+)>/g, function (match) {
				return '(' + match.split('<')[1].split('>')[0] + ')';
			});
			pattern_source = pattern_source.replace(/:[\w\-]+/g, '([^\\/]+)');
			var pattern = new RegExp('^' + pattern_source + '$');

			return {
				host: host,
				origins: origins,
				method: route[0],
				pathname: pathname,
				pattern: pattern,
				target: route[2]
			};
		});
	};

	Object.keys(declaration).forEach(function (host_line) {
		var host = host_line.split(/\s/)[0];

		var matches = host_line.match(/\s+<(?:\s+(\*|[\w-]+))+/);
		var origins = matches ? Array.prototype.slice.call(matches, 1) : [];
		origins.unshift(host);

		var routes = [];
		level('/', declaration[host_line], routes);
		routes = process(host, routes, origins);

		this.hosts_[host] = routes;
	}, this);
};


module.exports = Router;
