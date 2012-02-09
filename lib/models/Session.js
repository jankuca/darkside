var crypto = require('crypto');

var Controller = require('../controllers/Controller');
var Model = require('./Model');


var Session = Model.create('session');

Session.getById = function (id, callback, ctx) {
	callback = Controller.createSafeCallback(callback, ctx);

	Session.one({ '_id': id }, function (err, session) {
		if (err) {
			callback.call(ctx, err, null);
			return;
		}

		if (!session.stored) {
			session = new Session();
			session.id = id;
			session.save(function (err) {
				if (err) {
					callback.call(ctx, err, null);
				} else {
					callback.call(ctx, null, session);
				}
			});
		} else {
			callback.call(ctx, null, session);
		}
	}, ctx);
};

Session.generateId = function (request) {
	var key = (Date.now() * Math.random()).toString().substr(0, 16);
	var value = JSON.stringify(request.headers) + Math.random().toString();
	var hmac = crypto.createHmac('SHA256', key);
	var id = hmac.update(value).digest('hex');
	return id;
};


module.exports = Session;
