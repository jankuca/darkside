var log = require('sys').log;


var Controller = function (name, request, response) {
	this.request = request;
	this.response = response;

	this.parent_name_ = name.split(':')[0];
	this.name_ = name.substr(this.parent_name_.length + 1);
	this.action_ = null;
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


module.exports = Controller;
