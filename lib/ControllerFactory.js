var domain = require('domain');
var log = require('util').log;
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
	var Controller = this.getControllerConstructor_(namespace, controller_name);

	var self = this;
	var controller = null;
	var controller_domain = domain.create();

	controller_domain.once('error', function (err) {
		log(err.stack);
	});

	controller_domain.run(function () {
		controller = self.services_.create(Controller);
		controller.setRequest(request);
		controller.setResponse(response);
		controller.setRouter(router, namespace + ':' + controller_name);

		if (controller.view) {
			var template_root = self.template_dir_;
			var omittable_namespace = (namespace === this.omittable_namespace_);
			if (!omittable_namespace) {
				template_root = path.join(template_root, namespace);
			}

			controller.setTemplateRoot(template_root);
		}
	});

	return controller;
};

ControllerFactory.prototype.getControllerConstructor_ = function (namespace, name) {
	name = name.replace(/^(\W?)(\w)/, function (match, prefix, first) {
		return prefix + first.toUpperCase();
	});

	var controller_root = path.join(this.app_path_, 'controllers');
	var omittable_namespace = (namespace === this.omittable_namespace_);
	if (!omittable_namespace) {
		controller_root = path.join(controller_root, namespace);
	}
	var controller_path = path.join(controller_root, name + 'Controller');
	var Controller = require(controller_path);

	return Controller;
};

module.exports = ControllerFactory;
