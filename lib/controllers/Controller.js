var darkside = require('darkside');
var log = require('util').log;


var Controller = function (sessions) {
	this.sessions_ = sessions;

	this.$router = null;
	this.$request = null;
	this.$response = null;
	this.$method = null;
	this.$domain = null;

	this.action_ = null;
	this.action_params_ = null;
};

Controller.prototype.$deps = [ 'sessions?' ];


Controller.createSafeCallback = function (callback, controller) {
	return function () {
		try {
			callback.apply(this, arguments);

		} catch (err) {
			log(err.stack);

			if (controller instanceof Controller) {
				controller.$response.end(500);
			}
		}
	};
};


Controller.prototype.toString = function () {
	return '[object Controller:' + this.getName() + ']';
}


Controller.prototype.init = function () {
	// Overrides encouraged
};

Controller.prototype.setRequest = function (request) {
	this.$request = request;
	this.$method = request.getMethod();
	this.$domain = request.getDomain();
};

Controller.prototype.setResponse = function (response) {
	this.$response = response;
};

Controller.prototype.setRouter = function (router, default_route) {
	this.$router = router;

	this.parent_name_ = default_route.split(':')[0];
  this.name_ = default_route.substr(this.parent_name_.length + 1);
};

Controller.prototype.hasAction = function (action) {
	return (typeof this[action] === 'function');
};

Controller.prototype.callAction = function (action /*, ..args */) {
	if (!this.hasAction(action)) {
		throw new Error('Missing action ' + action);
	}

	var self = this;
	var args = Array.prototype.slice.call(arguments, 1);

	this.action_ = action;
	this.action_params_ = args[0] || {};

	var callAction = function () {
		var done = function (status) {
			if (status !== false) {
				self[action].apply(self, args);
			}
		};

		var async = (self.init.length !== 0);
		if (async) {
			self.init(done);
		} else {
			done(self.init());
		}
	};

	// Obtain the session for the request
	var sessions = this.sessions_;
	if (sessions) {
		var session_id = this.$request.getCookie('SID') ||
			sessions.generateId(this.$request.getHeaders());
		sessions.getById(session_id, function (err, session) {
			if (err) {
				log(err.stack);
				throw new Error('Failed to get the session');
			}

			this.setCookie('SID', session.id);
			this.$session = session;

			callAction();
		}, this);
	} else {
		callAction();
	}
};

Controller.prototype.getParentName = function () {
	return this.parent_name_;
};

Controller.prototype.getName = function () {
	return this.name_;
};

Controller.prototype.getAction = function () {
	return this.action_;
};

Controller.prototype.getActionParams = function () {
	return this.action_params_;
};

Controller.prototype.redirectTo = function (target, params) {
	var link = this.linkTo(target);
	if (!link) {
		throw new Error('No route for the redirection target ' + target);
	}

	var self = this;
	this.saveSession(function () {
		self.$response.header('location', link);
		self.$response.end(302);
	});
};

Controller.prototype.linkTo = function (target, params) {
	target = target.split(':');
	target = [
		target[target.length - 3] || this.getParentName(),
		target[target.length - 2] || this.getName(),
		target[target.length - 1] || 'index'
	].join(':');

	params = params || {};

	var link = this.$router.getTargetURL(target, params, this.$request);
	return link;
};

Controller.prototype.render = function (status, data) {
	var request = this.$request;
	var response = this.$response;

	this.saveSession(function () {
		response.head(status || 200);
		if (typeof data !== 'undefined') {
			response.body(data);
		}
		response.end();
	});
};

Controller.prototype.setCookie = function (key, value, expires) {
	var domain = this.$request.getHostLevels().join('.');
	var response = this.$response;
	response.cookie(key, value, domain, expires);
};

Controller.prototype.saveSession = function (callback) {
	callback = Controller.createSafeCallback(callback, this);

	var session = this.$session;
	if (session) {
		this.sessions_.save(session, callback);
	} else {
		callback(null);
	}
};


module.exports = Controller;
