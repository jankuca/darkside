var assert = require('assert');

var EventEmitter = require('events').EventEmitter;
var ServerRequest = require('../lib/ServerRequest');


var createRequest = function (method, url, headers) {
	var request = new EventEmitter();
	request.method = method;
	request.url = url || '/';
	request.headers = headers || {};
	return request;
};

exports['should store correct pathname'] = function () {
	var test = function (req, expectation) {
		var request = new ServerRequest(req);
		assert.equal(request.getPathname(), expectation);
	};

	test(createRequest('GET', '/abc'), '/abc');
	test(createRequest('GET', '/abc/'), '/abc');
	test(createRequest('GET', '/abc?def=asdf'), '/abc');
};

exports['should correctly split pathname'] = function () {
	var test = function (req, expectation) {
		var request = new ServerRequest(req);
		assert.deepEqual(request.getPathnameParts(), expectation);
	};

	test(createRequest('GET', '/abc'), [ 'abc' ]);
	test(createRequest('GET', '/abc/'), [ 'abc' ]);
	test(createRequest('GET', '/abc/def/asdf'), [ 'abc', 'def', 'asdf' ]);
	test(createRequest('GET', '/abc/def/asdf/'), [ 'abc', 'def', 'asdf' ]);
};

exports['should store correct method'] = function () {
	var req = createRequest('HEAD');

	var request = new ServerRequest(req);

	assert.equal(request.getMethod(), req.method);
};

exports['should correctly parse hostnames'] = function () {
	var test = function (req, expectation) {
		var request = new ServerRequest(req);
		assert.deepEqual(request.getHostLevels(), expectation);
	};

	test(createRequest(null, null, { 'host': 'www.example.com' }), [ 'www', 'example', 'com' ]);
	test(createRequest(null, null, { 'host': 'example.com' }), [ 'www', 'example', 'com' ]);
	test(createRequest(null, null, { 'host': 'www.www.example.com' }), [ 'www', 'example', 'com' ]);
	test(createRequest(null, null, { 'host': 'sub.www.example.com' }), [ 'sub', 'www', 'example', 'com' ]);
	test(createRequest(null, null, { 'host': 'sub2.sub.www.example.com' }), [ 'sub2', 'sub', 'www', 'example', 'com' ]);
	test(createRequest(null, null, { 'host': 'www.example.com:2000' }), [ 'www', 'example', 'com' ]);
	test(createRequest(null, null, { 'host': 'localhost:2000' }), [ 'www', 'localhost' ]);
	test(createRequest(null, null, { 'host': 'sub.localhost:2000' }), [ 'sub', 'localhost' ]);
	test(createRequest(null, null, { 'host': 'sub2.sub.localhost:2000' }), [ 'sub2', 'sub', 'localhost' ]);
};

exports['should correctly store and return headers'] = function () {
	var req1 = createRequest(null, null, { 'abc': 'def' });
	var req2 = createRequest(null, null, { 'abc': 'def', 'ghi-jkl': 'mno123' });

	var request1 = new ServerRequest(req1);
	var request2 = new ServerRequest(req2);

	assert.equal(request1.getHeader('abc'), 'def');
	assert.equal(request1.getHeader('Abc'), 'def');
	assert.equal(request1.getHeader('x'), null);
	assert.deepEqual(request1.getHeaders(), req1.headers);
	assert.deepEqual(request2.getHeaders(), req2.headers);
};

exports['should return a copy of the headers'] = function () {
	var req = createRequest(null, null, { 'abc': 'def' });
	var request = new ServerRequest(req);

	var headers = request.getHeaders();
	headers['abc'] = 'x';

	var headers2 = request.getHeaders();
	assert.equal(headers2['abc'], 'def');
};

exports['should correctly parse cookies'] = function () {
	var req1 = createRequest(null, null, { 'cookie': 'key1=val1' });
	var req2 = createRequest(null, null, { 'cookie': 'key1=val1; key2=val2;key3=val3' });
	var req3 = createRequest(null, null, { 'cookie': 'key1=val1=val2;key2=val3=val4; key3= val5' });

	var request1 = new ServerRequest(req1);
	var request2 = new ServerRequest(req2);
	var request3 = new ServerRequest(req3);

	assert.equal(request1.getCookie('key1'), 'val1');
	assert.equal(request2.getCookie('key1'), 'val1');
	assert.equal(request2.getCookie('key2'), 'val2');
	assert.equal(request2.getCookie('key3'), 'val3');
	assert.equal(request3.getCookie('key1'), 'val1=val2');
	assert.equal(request3.getCookie('key2'), 'val3=val4');
	assert.equal(request3.getCookie('key3'), ' val5');
};

exports['should correctly modify pathname'] = function () {
	var req = createRequest(null, '/abc/def/ghi');

	var request1 = new ServerRequest(req);
	request1.setPathname('/def/ghi');
	assert.equal(request1.getPathname(), '/def/ghi');

	var request2 = new ServerRequest(req);
	request2.setPathname('/ghi');
	assert.equal(request2.getPathname(), '/ghi');
};

exports['should throw on invalid pathname modification and keep the original pathname'] = function () {
	var test = function (req, modification, expectation) {
		var thrown = false;
		var request = new ServerRequest(req);
		try {
			request.setPathname(modification);
		} catch (err) {
			thrown = true;
		}
		assert.equal(thrown, true, 'did not throw on ' + req.url + ' -> ' + modification);
		assert.equal(request.getPathname(), req.url.split('?')[0]);
	};

	test(createRequest(null, '/abc/def/ghi'), '/def/');
	test(createRequest(null, '/abc/def/ghi'), '/abc/def');
	test(createRequest(null, '/abc/def/ghi'), '/ijk');
	test(createRequest(null, '/abc/def/ghi'), '../');
	test(createRequest(null, '/abc/def/ghi'), '/parent/abc/def/ghi');
};


module.exports = { 'ServerRequest': exports };
