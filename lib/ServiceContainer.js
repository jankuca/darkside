var path = require('path');

var DeclarationParser = require('./util/DeclarationParser');
var EntityRepository = require('./models/EntityRepository');
var Entity = require('./models/Entity');


var ServiceContainer = function () {
	this.locked_ = false;
	this.factories_ = {};
	this.instances_ = {};
	this.type_handlers_ = [];
	this.creating_ = null;

	this.instances_['$injector'] = this;
};

ServiceContainer.prototype.create = function (Constructor /* ..args */) {
	var args = Array.prototype.slice.call(arguments, 1);

	// Create an instance without executing the constructor function
	var Temp = function () {};
	Temp.prototype = Constructor.prototype;

	var base = new Temp();
	var instance = Object.create(base);

	Object.defineProperties(instance, {
		$$injector: {
			value: this,
			enumerable: false,
			writable: false
		}
	});

	var result = this.inject.apply(this, [ Constructor, instance ].concat(args));
	if (typeof result !== 'undefined') {
		instance = result;
	}

	return instance;
};

ServiceContainer.prototype.inject = function (Ctor, instance /* ..args */) {
	var args = Array.prototype.slice.call(arguments, 2);

	var deps = this.getConstructorDeps_(Ctor);
	deps = deps.concat(args);
	return Ctor.apply(instance, deps);
};

ServiceContainer.prototype.getConstructorDeps_ = function (Constructor) {
	var names = Constructor.prototype.$deps || [];
	var deps = names.map(function (name) {
		var optional = (name[name.length - 1] === '?');
		if (optional) {
			name = name.substr(0, name.length - 1);
		}

		var service = this.getService(name);
		if (!service && !optional) {
			throw new Error('No such service ' + name);
		}
		return service;
	}, this);

	return deps;
};

ServiceContainer.prototype.setService = function (key, factory) {
	if (this.locked_) {
		throw new Error('The container is locked');
	}

	if (typeof factory === 'function') {
		this.factories_[key] = factory;
	} else {
		this.instances_[key] = factory;
	}
};

ServiceContainer.prototype.getService = function (key) {
	if (this.creating_ === key) {
		throw new Error('The service "' + key + '" cannot request itself');
	}

	var service = this.instances_[key];
	if (!service) {
		var factory = this.factories_[key];
		if (!factory) {
			return null;
		}

		this.creating_ = key;
		service = factory.call(null, this);
		if (typeof service !== 'object') {
			throw new Error('Invalid service factory');
		}
		this.instances_[key] = service;
		this.creating_ = null;
	}

	return service;
};

ServiceContainer.prototype.lock = function () {
	this.locked_ = true;
};

ServiceContainer.prototype.unlock = function () {
	this.locked_ = false;
};

ServiceContainer.prototype.addServiceFromModule = function (key, module_path) {
	if (module_path[0] === '.') {
		module_path = path.resolve(module.parent.filename, module_path);
	}

	this.setService(key, function (self) {
		var service = require(module_path);
		return service;
	});
};

ServiceContainer.prototype.setServiceTypeHandler = function (key, handler) {
	this.type_handlers_[key] = handler;
};

ServiceContainer.prototype.setServiceDeclaration = function (file_path) {
	var declaration = DeclarationParser.parse(file_path, this.type_handlers_);

	if (declaration['@repositories']) {
		this.addRepositoryServices_(declaration['@repositories']);
		delete declaration['@repositories'];
	}

	Object.keys(declaration).forEach(function (key) {
		var item = declaration[key];
		if (!item['@']) {
			throw new Error('Missing constructor name for the declared service \'' + key + '\'');
		}

		this.setService(key, function (self) {
			var Service = item['@'];
			delete item['@'];

			var service = self.create(Service, item);
			return service;
		});
	}, this);
};

ServiceContainer.prototype.addRepositoryServices_ = function (declaration) {
	Object.keys(declaration).forEach(function (key) {
		this.setService(key, function (self) {
			var item = declaration[key];

			var Repository = item['repository'] || EntityRepository;
			var repository = self.create(Repository, key);

			repository.Entity = item['entity'] || Entity;
			if (typeof repository.Entity !== 'function') {
				throw new Error('Invalid entity constructor for the repository \'' + key + '\'');
			}

			return repository;
		});
	}, this);
};


module.exports = ServiceContainer;
