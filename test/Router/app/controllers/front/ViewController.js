
var MockController = function (name, router, request, response) {
	this.parent_name = name.split(':')[0];
	this.name = name.split(':')[1];
	this.router = router;
	this.request = request;
	this.response = response;

	this.view = {};
};

MockController.prototype.hasAction = function (action) {
	return (action === 'show');
};

MockController.prototype.setTemplateRoot = function (template_root) {
	MockController.onTemplateRoot(this, template_root);
};

MockController.prototype.callAction = function (action, params) {};

MockController.onTemplateRoot = function (controller, template_root) {};

module.exports = MockController;
