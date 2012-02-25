var Controller = require('../controllers/Controller');
var Entity = require('./Entity');


var EntityRepository = function (collection_name, service_container) {
	var db = service_container.getService('database');

	this.collection_ = db.getCollection(collection_name);
	this.collection_name_ = collection_name;
	this.service_container_ = service_container;
};

EntityRepository.prototype.Entity = Entity;

EntityRepository.prototype.createEntity = function (doc) {
	var entity = new this.Entity(doc, this.collection_);
	return entity;
};

EntityRepository.prototype.one = function (selector, options, callback, ctx) {
	if (arguments.length === 3 && typeof arguments[1] === 'function') {
		ctx = arguments[2];
		callback = arguments[1];
		options = {};
	}

	options.limit = 1;

	callback = Controller.createSafeCallback(callback, ctx);

	this.all(selector, options, function (err, models) {
		if (err) {
			callback.call(ctx, err, null);
		} else {
			var model = models[0] || this.createEntity();
			callback.call(ctx, null, model);
		}
	}, this);
};

EntityRepository.prototype.all = function (selector, options, callback, ctx) {
	if (arguments.length === 3 && typeof arguments[1] === 'function') {
		ctx = arguments[2];
		callback = arguments[1];
		options = {};
	}

	var self = this;

	callback = Controller.createSafeCallback(callback, ctx);

	this.collection_.find(selector, options, function (err, docs) {
		if (err) {
			callback.call(ctx, err, null);
		} else {
			var models = docs.map(function (doc) {
				return self.createEntity(doc);
			});

			callback.call(ctx, null, models);
		}
	});
};


module.exports = EntityRepository;
