var log = require('sys').log;


var Controller = function (name, router, request, response) {
	this.router = router;
	this.request = request;
	this.response = response;

	this.parent_name_ = name.split(':')[0];
	this.name_ = name.substr(this.parent_name_.length + 1);
	this.action_ = null;
};


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


Controller.prototype.hasAction = function (action) {
	return (typeof this[action] === 'function');
};

Controller.prototype.callAction = function (action /*, ..args */) {
	if (!this.hasAction(action)) {
		throw new Error('Missing action ' + action);
	}

	this.action_ = action;

	var args = Array.prototype.slice.call(arguments, 1);
	// Obtain the session for the request
	this.request.getSession('SID', function (err, session) {
		if (err) {
			log(err.toString());
			throw new Error('Failed to get the session');
		}

		this.response.cookie('SID', session.id);

		this.session_ = session;
		this[action].apply(this, args);
	}, this);
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
