var assert = require('assert');
var path = require('path');

var Router = require('Router');

var MOCK_NONEXISTANT_DECLARATION_FILE_PATH = path.resolve(__dirname, './Router/routes-nonexistant.declaration');
var MOCK_INVALID_DECLARATION_FILE_PATH = path.resolve(__dirname, './Router/routes-invalid.declaration');
var MOCK_TYPE_HANDLER_DECLARATION_FILE_PATH = path.resolve(__dirname, './Router/routes-type-handler.declaration');
var MOCK_VALID_DECLARATION_FILE_PATH = path.resolve(__dirname, './Router/routes.declaration');
var MOCK_APP_PATH = path.resolve(__dirname, './Router/app');


exports['should not have a default route declaration file path'] = function () {
	var router = new Router();

	assert.equal(router.getRouteDeclaration(), null);
};

exports['should not store an invalid route declaration file path'] = function () {
	var thrown = false;

	var router = new Router();
	try {
		router.setRouteDeclaration(MOCK_INVALID_DECLARATION_FILE_PATH);
	} catch (err) {
		thrown = true;
	}

	assert.equal(thrown, true);
	assert.equal(router.getRouteDeclaration(), null);
};

exports['should store a correct route declaration file path'] = function () {
	var router = new Router();

	router.setRouteDeclaration(MOCK_VALID_DECLARATION_FILE_PATH);
	assert.equal(router.getRouteDeclaration(), MOCK_VALID_DECLARATION_FILE_PATH);
};

exports['should throw on non-existant route declaration file'] = function () {
	var thrown = false;

	var router = new Router();
	try {
		router.setRouteDeclaration(MOCK_NONEXISTANT_DECLARATION_FILE_PATH);
	} catch (err) {
		thrown = true;
	}

	assert.equal(thrown, true);
};

exports['should throw on undefined route declaration file'] = function () {
	var thrown = false;

	var router = new Router();
	try {
		router.update();
	} catch (err) {
		thrown = true;
	}

	assert.equal(thrown, true);
};

exports['should throw on invalid route declaration file'] = function () {
	var thrown = false;

	var router = new Router();
	try {
		router.setRouteDeclaration(MOCK_INVALID_DECLARATION_FILE_PATH);
	} catch (err) {
		thrown = true;
	}

	assert.equal(thrown, true);
};

exports['should throw on a missing route type handler'] = function () {
	var thrown = false;

	var router = new Router();
	try {
		router.setRouteDeclaration(MOCK_TYPE_HANDLER_DECLARATION_FILE_PATH);
	} catch (err) {
		thrown = true;
	}

	assert.equal(thrown, true);
};

exports['should fail with 503 on missing route declaration'] = function () {
	var countdown = 1;
	var response = {
		end: function (status) {
			countdown -= 1;
			assert.equal(status, 503);
		}
	};

	var router = new Router();
	router.route(null, response);

	assert.equal(countdown, 0);
};

exports['should request request info (method, host and pathname)'] = function () {
	var requested_method = false;
	var requested_host = false;
	var requested_pathname = false;
	var request = {
		getMethod: function () {
			requested_method = true;
			return 'GET';
		},
		getHostLevels: function () {
			requested_host = true;
			return [ 'www', 'ęxample', 'com' ];
		},
		getPathname: function () {
			requested_pathname = true;
			return '/';
		}
	};
	var response = {
		end: function () {}
	};

	var router = new Router();
	router.setRouteDeclaration(MOCK_VALID_DECLARATION_FILE_PATH);
	router.route(request, response);

	assert.equal(requested_method, true, 'method');
	assert.equal(requested_host, true, 'host');
	assert.equal(requested_pathname, true, 'pathname');
};


exports['should route to HTTP status codes'] = function () {
	function createRequest(method, host, pathname) {
		return {
			getMethod: function () {
				return method;
			},
			getHostLevels: function () {
				return host.split('.');
			},
			getPathname: function () {
				return pathname;
			}
		};
	};
	function createResponse(expectation) {
		return {
			end: function (status) {
				countdown -= 1;
				assert.equal(status, expectation);
			}
		};
	};

	var countdown = 4;
	var request403 = createRequest('GET', 'www.example.com', '/');
	var request400 = createRequest('GET', 'www.example.com', '/400');
	var request404 = createRequest('GET', 'www.example.com', '/404');
	var request404_another_host = createRequest('GET', '404.example.com', '/');
	var response403 = createResponse(403);
	var response400 = createResponse(400);
	var response404 = createResponse(404);

	var router = new Router();
	router.setRouteDeclaration(MOCK_VALID_DECLARATION_FILE_PATH);
	router.route(request403, response403);
	router.route(request400, response400);
	router.route(request404, response404);
	router.route(request404_another_host, response404);

	assert.equal(countdown, 0, 'all requests handled');
};

exports['should route to a route type handler with correctly altered pathname'] = function () {
	function createRequest(method, host, pathname, expected_altered) {
		return {
			getMethod: function () {
				return method;
			},
			getHostLevels: function () {
				return host.split('.');
			},
			getPathname: function () {
				return pathname;
			},
			setPathname: function (altered) {
				assert.equal(altered, expected_altered);
			}
		};
	};

	var countdown = 2;
	var request = createRequest('GET', 'www.example.com', '/a/bc.d', '/a/bc.d');
	var request_parametric = createRequest('GET', 'www.example.com', '/x/abc/y', '/');

	var router = new Router();
	router.setRouteTypeHandler('abc', function (value) {
		assert.equal(value, 'value');
		return new (function () {
			this.handle = function (req, res, params) {
				countdown -= 1;
				assert.equal(req, request);
				assert.equal(res, null);
				assert.eql(params, {});
			}
		})();
	});
	router.setRouteTypeHandler('def', function (value) {
		return new (function () {
			this.handle = function (req, res, params) {
				countdown -= 1;
				assert.equal(req, request_parametric);
				assert.equal(res, null);
				assert.eql(params, { 'key': 'abc' });
			}
		})();
	});
	router.setRouteDeclaration(MOCK_TYPE_HANDLER_DECLARATION_FILE_PATH);
	router.route(request, null);
	router.route(request_parametric, null);

	assert.equal(countdown, 0, 'all requests handled');
};


exports['should return correct URLs for the same host'] = function () {
	function createRequest(host) {
		return {
			getHostLevels: function () {
				return host.split('.');
			}
		};
	};

	var request = createRequest('www.example.com');

	var router = new Router();
	router.setRouteDeclaration(MOCK_VALID_DECLARATION_FILE_PATH);

	try {
		router.route(null, null); // load the declaration
	} catch (err) {
	} finally {
		var url = router.getTargetURL('front:post:index', null);
		assert.equal(url, '/posts');

		var url = router.getTargetURL('front:post:index', null, request);
		assert.equal(url, '/posts');

		var url = router.getTargetURL('front:post:show', { 'id': 2 }, request);
		assert.equal(url, '/posts/2');

		var url = router.getTargetURL('front:post:index', { 'abc': 'def' }, request);
		assert.equal(url, '/posts?abc=def');

		var url = router.getTargetURL('front:post:show', { 'category': 2 }, request);
		assert.equal(url, null);
	}
};

exports['should return correct URLs for a different host'] = function () {
	function createRequest(host) {
		return {
			getPort: function () {
				return Number(host.split(':')[1] || 80);
			},
			getHostLevels: function () {
				return host.split(':')[0].split('.');
			}
		};
	};

	var request = createRequest('test.example.com');
	var port_request = createRequest('test.example.com:2000');
	var localhost_request = createRequest('test.localhost');

	var router = new Router();
	router.setRouteDeclaration(MOCK_VALID_DECLARATION_FILE_PATH);

	try {
		router.route(null, null); // load the declaration
	} catch (err) {
	} finally {
		var url = router.getTargetURL('front:post:index', null, request);
		assert.equal(url, 'http://www.example.com/posts');

		var url = router.getTargetURL('front:post:show', { 'id': 2 }, request);
		assert.equal(url, 'http://www.example.com/posts/2');

		var url = router.getTargetURL('front:post:index', { 'abc': 'def' }, request);
		assert.equal(url, 'http://www.example.com/posts?abc=def');

		var url = router.getTargetURL('front:post:show', { 'category': 2 }, request);
		assert.equal(url, null);

		var url = router.getTargetURL('front:post:show', { 'id': 2 }, port_request);
		assert.equal(url, 'http://www.example.com:2000/posts/2');

		var url = router.getTargetURL('front:post:show', { 'id': 2 }, localhost_request);
		assert.equal(url, 'http://www.localhost/posts/2');
	}
};

exports['should return correct URLs for a different host and port'] = function () {
	function createRequest(host) {
		return {
			getPort: function () {
				return Number(host.split(':')[1] || 80);
			},
			getHostLevels: function () {
				return host.split(':')[0].split('.');
			}
		};
	};

	var request = createRequest('test.example.com:1100');

	var router = new Router();
	router.setRouteDeclaration(MOCK_VALID_DECLARATION_FILE_PATH);

	try {
		router.route(null, null); // load the declaration
	} catch (err) {
	} finally {
		var url = router.getTargetURL('front:post:index', null, request);
		assert.equal(url, 'http://www.example.com:1100/posts');

		var url = router.getTargetURL('front:post:show', { 'id': 2 }, request);
		assert.equal(url, 'http://www.example.com:1100/posts/2');

		var url = router.getTargetURL('front:post:index', { 'abc': 'def' }, request);
		assert.equal(url, 'http://www.example.com:1100/posts?abc=def');

		var url = router.getTargetURL('front:post:show', { 'category': 2 }, request);
		assert.equal(url, null);
	}
};

exports['should route to controller actions'] = function () {
	function createRequest(method, host, pathname) {
		return {
			getMethod: function () {
				return method;
			},
			getHostLevels: function () {
				return host.split('.');
			},
			getPathname: function () {
				return pathname;
			}
		};
	};

	var constructed = 3;
	var called = 3;

	var request = createRequest('GET', 'www.example.com', '/posts');
	var request_parametric = createRequest('GET', 'www.example.com', '/posts/3');
	var request_test = createRequest('GET', 'www.example.com', '/posts/test');

	var factory = {
		createController: function (namespace, controller_name, router, request, response) {
			constructed -= 1;
			assert.equal(namespace, 'front');
			assert.equal(controller_name, 'post');
			return {
				request: request,
				hasAction: function (action) {
					return (action === 'index' || action === 'show' || action === 'error' || action === 'test');
				},
				callAction: function (action, params) {
					called -= 1;
					switch (action) {
						case 'index':
							assert.equal(this.request, request);
							assert.eql(params, {});
							return;
						case 'show':
							assert.equal(this.request, request_parametric);
							assert.eql(params, { 'id': '3' });
							return;
						case 'test':
							assert.equal(this.request, request_test);
							assert.eql(params, {});
							break;
					}
				}
			};
		}
	};

	var router = new Router(factory);
	router.setRouteDeclaration(MOCK_VALID_DECLARATION_FILE_PATH);
	router.route(request, null);
	router.route(request_parametric, null);
	router.route(request_test, null);

	assert.equal(constructed, 0, 'all requests handled');
	assert.equal(called, 0, 'all requests handled');
};

exports['should fail with 500 on a missing controller'] = function () {
	function createRequest(method, host, pathname) {
		return {
			getMethod: function () {
				return method;
			},
			getHostLevels: function () {
				return host.split('.');
			},
			getPathname: function () {
				return pathname;
			}
		};
	};
	function createResponse(expectation) {
		return {
			end: function (status) {
				countdown -= 1;
				assert.equal(status, expectation);
			}
		};
	};

	var countdown = 1;
	var factory = {
		createController: function (namespace, controller_name, request, response) {
			return {
				hasAction: function (action) {
					return (action === 'index' || action === 'show' || action === 'error' || action === 'test');
				}
			};
		}
	};
	var request = createRequest('GET', 'www.example.com', '/posts/4/comments');
	var response = createResponse(500);

	var router = new Router(factory);
	router.setRouteDeclaration(MOCK_VALID_DECLARATION_FILE_PATH);
	router.route(request, response);

	assert.equal(countdown, 0, 'all requests handled');
};

exports['should fail with 500 on missing controller actions'] = function () {
	function createRequest(method, host, pathname) {
		return {
			getMethod: function () {
				return method;
			},
			getHostLevels: function () {
				return host.split('.');
			},
			getPathname: function () {
				return pathname;
			}
		};
	};
	function createResponse(expectation) {
		return {
			end: function (status) {
				countdown -= 1;
				assert.equal(status, expectation);
			}
		};
	};

	var countdown = 1;
	var factory = {
		createController: function () {
			return null;
		}
	};
	var request = createRequest('GET', 'www.example.com', '/posts/4/comments');
	var response = createResponse(500);

	var router = new Router(factory);
	router.setRouteDeclaration(MOCK_VALID_DECLARATION_FILE_PATH);
	router.route(request, response);

	assert.equal(countdown, 0, 'all requests handled');
};

exports['should fail with 500 on an error thrown by a controller action'] = function () {
	function createRequest(method, host, pathname) {
		return {
			getMethod: function () {
				return method;
			},
			getHostLevels: function () {
				return host.split('.');
			},
			getPathname: function () {
				return pathname;
			}
		};
	};
	function createResponse(expectation) {
		return {
			end: function (status) {
				countdown -= 1;
				assert.equal(status, expectation);
			}
		};
	};

	var countdown = 1;
	var factory = {
		createController: function (namespace, controller_name, request, response) {
			return {
				hasAction: function () {
					return true;
				},
				callAction: function () {
					throw new Error('Test');
				}
			}
		}
	};
	var request = createRequest('GET', 'www.example.com', '/posts/error');
	var response = createResponse(500);

	var router = new Router(factory);
	router.setRouteDeclaration(MOCK_VALID_DECLARATION_FILE_PATH);
	router.route(request, response);

	assert.equal(countdown, 0, 'all requests handled');
};
