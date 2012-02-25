var Controller = require('../controllers/Controller');


var Entity = function (doc, collection) {
	if (!doc) {
		doc = {};
	}

	this.doc = doc;
	this.id = doc['_id'] || null;
	this.stored = !!doc['_id'];

	this.collection_ = collection;
};


Entity.prototype.save = function (callback, ctx) {
	callback = Controller.createSafeCallback(callback, ctx);

	var self = this;
	var doc = this.getUpdatedDoc_();

	this.collection_[this.stored ? 'update' : 'insert'](doc, function (err, response) {
		if (err) {
			callback.call(ctx, err);
		} else {
			self.doc = doc;
			self.id = doc['_id'];
			self.stored = true;
			callback.call(ctx, null);
		}
	});
};

Entity.prototype.getUpdatedDoc_ = function () {
	var doc = this.doc;
	var updated = {};

	Object.keys(doc).forEach(function (key) {
		updated[key] = doc[id];
	});
	Object.keys(this).forEach(function (key) {
		if (key.indexOf(':') !== -1) {
			updated[key] = this[key];
		}
	}, this);

	if (this.id) {
		updated['_id'] = this.id;
	}

	return updated;
};


module.exports = Entity;
