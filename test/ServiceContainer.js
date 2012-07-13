var assert = require('assert');
var log = require('util').log;

var ServiceContainer = require('../lib/ServiceContainer');


exports['should allow adding a new service'] = function () {
	var container = new ServiceContainer();
	container.setService('repository', function () {
		return {};
	});
};

exports['should return a correct service'] = function () {
	var service = {};

	var container = new ServiceContainer();
	container.setService('mock', function () {
		return service;
	});

	var result = container.getService('mock');
	assert.equal(result, service);
};

exports['should return null when the requested service is not defined'] = function () {
	var container = new ServiceContainer();

	var service = container.getService('mock');
	assert.equal(service, null);
};

exports['should throw on an invalid service factory'] = function () {
	var container = new ServiceContainer();
	container.setService('mock', function () {
		return 123;
	});

	var thrown = false;
	try {
		container.getService('mock');
	} catch (err) {
		thrown = true;
	}

	assert.equal(thrown, true);
};

exports['should throw on a try to add a new service when locked'] = function () {
	var container = new ServiceContainer();
	container.lock();

	var thrown = false;
	try {
		container.setService('mock', function () {
			return {};
		});
	} catch (err) {
		thrown = true;
	}

	assert.equal(thrown, true);
};

exports['should not throw on a try to add a new service when unlocked'] = function () {
	var container = new ServiceContainer();
	container.lock();
	container.unlock();

	var thrown = false;
	try {
		container.setService('mock', function () {
			return {};
		});
	} catch (err) {
		thrown = true;
	}

	assert.equal(thrown, false);
};

exports['should keep a singleton instance of each requested service'] = function () {
	var counter = 0;

	var container = new ServiceContainer();
	container.setService('mock', function () {
		counter += 1;
		return {};
	});
	container.getService('mock');
	container.getService('mock');

	assert.equal(counter, 1);
};

exports['should pass itself to a service factory callback'] = function () {
	var container = new ServiceContainer();
	container.setService('mock', function (self) {
		assert.equal(self, container);
		return {};
	});
	container.getService('mock');
};

exports['should throw when a service factory callback requests the service it is supposed to create'] = function () {
	var counter = 0;
	var thrown = false;

	var container = new ServiceContainer();
	container.setService('mock', function (self) {
		if (counter === 0) { // prevent an eventual infinite loop
			try {
				self.getService('mock');
			} catch (err) {
				log(err.message);
				thrown = true;
			}
		}
		counter += 1;
		return {};
	});
	container.getService('mock');

	assert.equal(thrown, true, 'did not throw');
};


module.exports = { 'ServiceContainer': exports };
