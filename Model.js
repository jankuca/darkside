var log = require('sys').log;


var Model = function (doc) {
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
	M.one = function (selector, callback, ctx) {
		return Model.one(M, selector, callback, ctx);
	};
	M.all = function (selector, callback, ctx) {
		return Model.all(M, selector, callback, ctx);
	};

	return M;
};

Model.one = function (M, selector, callback, ctx) {
	var db = Model.db_;
	var collection = db.getCollection(M.collection_name_);

	collection.findOne(selector, function (err, doc) {
		if (err) {
			callback.call(ctx, err, null);
		} else {
			var model = new M(doc);
			callback.call(ctx, null, model);
		}
	});
};


module.exports = Model;
