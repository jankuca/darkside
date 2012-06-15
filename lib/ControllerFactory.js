var log = require('sys').log;
var path = require('path');


var ControllerFactory = function (app_path, services) {
	this.app_path_ = app_path;
	this.services_ = services;
	this.template_dir_ = path.join(app_path, 'views');
	this.omittable_namespace_ = null;
};

ControllerFactory.prototype.setTemplateDirectory = function (template_dir) {
	this.template_dir_ = template_dir;
};

ControllerFactory.prototype.setOmittableNamespace = function (omittable_namespace) {
	this.omittable_namespace_ = omittable_namespace;
};

ControllerFactory.prototype.createController = function (namespace, controller_name, router, request, response) {
	var name = controller_name.replace(/^(\W?)(\w)/, function (match, prefix, first) {
		return prefix + first.toUpperCase();
	});

	try {
		var controller_root = path.join(this.app_path_, 'controllers');
		var omittable_namespace = (namespace === this.omittable_namespace_);
		if (!omittable_namespace) {
			controller_root = path.join(controller_root, namespace);
		}
		var controller_path = path.join(controller_root, name + 'Controller');
		var Controller = require(controller_path);

		var controller = this.services_.create(Controller);
		controller.setRequest(request);
		controller.setResponse(response);
		controller.setRouter(router, namespace + ':' + controller_name);

		if (controller.view) {
			var template_root = this.template_dir_;
			if (!omittable_namespace) {
				template_root = path.join(template_root, namespace);
			}

			controller.setTemplateRoot(template_root);
		}

		return controller;
	} catch (err) {
		log(err.stack);
		return null;
	}
};


module.exports = ControllerFactory;
