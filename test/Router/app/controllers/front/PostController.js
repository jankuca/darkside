
var MockController = function (name, router, request, response) {
	this.parent_name = name.split(':')[0];
	this.name = name.split(':')[1];
	this.router = router;
	this.request = request;
	this.response = response;

	MockController.onConstruct(this);
};

MockController.prototype.hasAction = function (action) {
	return (action === 'index' || action === 'show' || action === 'error' || action === 'test');
};

MockController.prototype.callAction = function (action, params) {
	MockController.onActionCall(this, action, params);

	if (action === 'error') {
		throw new Error('Test');
	}
};

MockController.onConstruct = function (controller) {};
MockController.onActionCall = function (controller, action, params) {};

module.exports = MockController;
