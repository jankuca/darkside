var darkside = require('darkside');
var log = require('sys').log;


var Controller = function (sessions) {
	this.sessions_ = sessions;

	this.router = null;
	this.request = null;
	this.response = null;
	this.action_ = null;
};

Controller.prototype.$deps = [ 'sessions?' ];


Controller.createSafeCallback = function (callback, controller) {
	return function () {
		try {
			callback.apply(this, arguments);

		} catch (err) {
			log(err.stack);

			if (controller instanceof Controller) {
				controller.response.end(500);
			}
		}
	};
};


Controller.prototype.setRequest = function (request) {
	this.request = request;
};

Controller.prototype.setResponse = function (response) {
	this.response = response;
};

Controller.prototype.setRouter = function (router, default_route) {
	this.router = router;

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

	this.action_ = action;

	var args = Array.prototype.slice.call(arguments, 1);
	var callAction = function () {
		this[action].apply(this, args);
	};

	// Obtain the session for the request
	var sessions = this.sessions_;
	if (sessions) {
		var session_id = this.request.getCookie('SID') ||
			sessions.generateId(this.request.getHeaders());
		sessions.getById(session_id, function (err, session) {
			if (err) {
				log(err.stack);
				throw new Error('Failed to get the session');
			}

			this.response.cookie('SID', session.id);
			this.session = session;

			callAction.call(this);
		}, this);
	} else {
		callAction.call(this);
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

Controller.prototype.redirectTo = function (target, params) {
	var link = this.linkTo(target);
	if (!link) {
		throw new Error('No route for the redirection target ' + target);
	}
	this.response.header('location', link);
	this.response.end(302);
};

Controller.prototype.linkTo = function (target, params) {
	target = target.split(':');
	target = [
		target[target.length - 3] || this.getParentName(),
		target[target.length - 2] || this.getName(),
		target[target.length - 1] || 'index'
	].join(':');

	params = params || {};

	var link = this.router.getTargetURL(target, params, this.request);
	return link;
};


module.exports = Controller;
