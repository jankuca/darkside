var mongodb = require('mongodb-lite');

var Controller = require('../controllers/Controller');
var Entity = require('./Entity');


var EntityRepository = function ($injector, database, collection_name) {
	this.$injector = $injector;
	this.collection_ = database.getCollection(collection_name);
	this.collection_name_ = collection_name;
};

EntityRepository.prototype.$deps = [ '$injector', 'database' ];

EntityRepository.prototype.Entity = Entity;


EntityRepository.prototype.toString = function () {
	return '[object EntityRepository:' + this.collection_name_ + ']';
};


EntityRepository.prototype.createEntity = function (doc) {
	var entity = this.$injector.create(this.Entity, doc);
	return entity;
};

EntityRepository.prototype.one = function (selector, options, callback, ctx) {
	if (typeof arguments[1] === 'function') {
		ctx = arguments[2] || null;
		callback = arguments[1];
		options = {};
	}

	options.limit = 1;

	if (typeof selector === 'string' || typeof selector === 'number' ||
		selector instanceof mongodb.ObjectId) {
		selector = { '_id': selector };
	}

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
	if (typeof arguments[1] === 'function') {
		ctx = arguments[2];
		callback = arguments[1];
		options = {};
	}
	selector = selector || {};

	var self = this;

	callback = Controller.createSafeCallback(callback, ctx);

	if (Array.isArray(selector)) {
		selector = {
			'_id': { '$in': selector }
		};
	}
	if (selector['_id'] && typeof selector['_id'] === 'string') {
		if (selector['_id'].length === 24) {
			selector['_id'] = new mongodb.ObjectId(selector['_id']);
		}
	}

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

EntityRepository.prototype.count = function (selector, callback, ctx) {
	if (Array.isArray(selector)) {
		selector = {
			'_id': { '$in': selector }
		};
	}

	this.collection_.count(selector, callback.bind(ctx));
};

EntityRepository.prototype.update = function (entity, update, callback, ctx) {
	var selector = {
		'_id': entity.id
	};
	this.collection_.update(selector, update, callback.bind(ctx));
};

EntityRepository.prototype.save = function (entity, callback, ctx) {
	var diff;
	var old_id;

	var onresponse = function (err) {
		if (err) {
			callback.call(ctx, err);
		} else {
			entity.merge(diff);

			if (old_id !== diff['_id']) {
				entity.id = diff['_id'];
			}

			callback.call(ctx, null);
		}
	};

	if (entity.stored) {
		diff = entity.getDocumentDiff();
		var update = {
			'$set': diff
		};
		this.update(entity, update, onresponse);
	} else {
		diff = entity.getDocument();
		old_id = diff['_id'];
		this.collection_.insert(diff, onresponse);
	}
};

EntityRepository.prototype.remove = function (entity, callback, ctx) {
	if (!entity.stored) {
		throw new Error('Cannot remove an unsaved entity');
	}

	var selector = {
		'_id': entity.id
	};

	this.collection_.remove(selector, callback ? callback.bind(ctx) : null);
};



module.exports = EntityRepository;
