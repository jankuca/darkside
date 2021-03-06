var crypto = require('crypto');
var darkside = require('../../index');

var Controller = require('../controllers/Controller.js');
var EntityRepository = require('./EntityRepository');


var SessionRepository = function (collection_name) {
	darkside.base(EntityRepository, this, collection_name);
};

require('util').inherits(SessionRepository, EntityRepository);


SessionRepository.prototype.getById = function (id, callback, ctx) {
	callback = Controller.createSafeCallback(callback, ctx);

	this.one({ '_id': id }, function (err, session) {
		if (err) {
			callback.call(ctx, err, null);
			return;
		}

		if (!session.stored) {
			session = this.createEntity();
			session.id = id;
			this.save(session, function (err) {
				if (err) {
					callback.call(ctx, err, null);
				} else {
					callback.call(ctx, null, session);
				}
			});
		} else {
			callback.call(ctx, null, session);
		}
	}, this);
};

SessionRepository.prototype.generateId = function (headers) {
	var key = (Date.now() * Math.random()).toString().substr(0, 16);
	var value = JSON.stringify(headers) + Math.random().toString();
	var hmac = crypto.createHmac('SHA256', key);
	var id = hmac.update(value).digest('hex');
	return id;
};


module.exports = SessionRepository;
