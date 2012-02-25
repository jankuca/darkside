var path = require('path');


var ControllerFactory = function (app_path, service_container) {
	this.app_path_ = app_path;
	this.service_container_ = service_container;
};

ControllerFactory.prototype.createController = function (namespace, controller_name, router, request, response) {
	var name = controller_name.replace(/^(\W?)(\w)/, function (match, prefix, first) {
		return prefix + first.toUpperCase();
	});

	try {
		var controller_path = path.join(this.app_path_, 'controllers', namespace, name + 'Controller');
		var Controller = require(controller_path);
		var controller = new Controller(namespace + ':' + controller_name, router, request, response, this.service_container_);

		if (controller.view) {
			var template_root = path.join(this.app_path_, 'views', namespace);
			controller.setTemplateRoot(template_root);
		}

		return controller;
	} catch (err) {
		return null;
	}
};


module.exports = ControllerFactory;
