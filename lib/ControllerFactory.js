var log = require('sys').log;
var path = require('path');


var ControllerFactory = function (app_path, services) {
	this.app_path_ = app_path;
	this.services_ = services;
};

ControllerFactory.prototype.createController = function (namespace, controller_name, router, request, response) {
	var name = controller_name.replace(/^(\W?)(\w)/, function (match, prefix, first) {
		return prefix + first.toUpperCase();
	});

	try {
		var controller_path = path.join(this.app_path_, 'controllers',
			namespace, name + 'Controller');
		var Controller = require(controller_path);

		var controller = this.services_.create(Controller);
		controller.setRequest(request);
		controller.setResponse(response);
		controller.setRouter(router, namespace + ':' + controller_name);

		if (controller.view) {
			var template_root = path.join(this.app_path_, 'views', namespace);
			controller.setTemplateRoot(template_root);
		}

		return controller;
	} catch (err) {
		log(err.stack);
		return null;
	}
};


module.exports = ControllerFactory;
