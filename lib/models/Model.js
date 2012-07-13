var log = require('util').log;

var Controller = require('../controllers/Controller');


var Entity = function (doc) {
	if (!doc) {
		doc = {};
	}

	this.doc = doc;
	this.id = doc['_id'] || null;
	this.stored = !!doc['_id'];
};


Model.setMongoDBService = function (mongodb_service, db_name) {
	Model.mongodb_service_ = mongodb_service;
	Model.db_ = mongodb_service.getDatabase(db_name);
};

Model.create = function (key) {
	var Fn = function () {};
	Fn.prototype = Model.prototype;

	var M = function (doc) {
		Model.call(this, doc);
	};
	M.prototype = new Fn();
	M.prototype.constructor = M;

	M.collection_name_ = key + 's';
	M.prototype.collection_name_ = key + 's';
	M.one = function (selector, callback, ctx) {
		return Model.one(M, selector, callback, ctx);
	};
	M.all = function (selector, callback, ctx) {
		return Model.all(M, selector, callback, ctx);
	};

	return M;
};

Model.one = function (M, selector, options, callback, ctx) {
	if (arguments.length === 4 && typeof arguments[2] === 'function') {
		ctx = arguments[3];
		callback = arguments[2];
		options = {};
	}

	var db = Model.db_;
	var collection = db.getCollection(M.collection_name_);

	callback = Controller.createSafeCallback(callback, ctx);

	collection.findOne(selector, options, function (err, doc) {
		if (err) {
			callback.call(ctx, err, null);
		} else {
			var model = new M(doc);
			callback.call(ctx, null, model);
		}
	});
};

Model.all = function (M, selector, options, callback, ctx) {
	if (arguments.length === 4 && typeof arguments[2] === 'function') {
		ctx = arguments[3];
		callback = arguments[2];
		options = {};
	}

	var db = Model.db_;
	var collection = db.getCollection(M.collection_name_);

	callback = Controller.createSafeCallback(callback, ctx);

	collection.find(selector, options, function (err, docs) {
		if (err) {
			callback.call(ctx, err, null);
		} else {
			var _M = M; // cache the constructor
			var models = docs.map(function (doc) {
				return new M(doc);
			});

			callback.call(ctx, null, models);
		}
	});
};



module.exports = Model;
