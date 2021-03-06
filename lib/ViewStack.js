var Controller = require('./controllers/Controller');


var ViewStack = function () {
	this.helpers_ = {};
	this.views_ = [];
};


ViewStack.prototype.setHelpers = function (helpers) {
	this.helpers_ = helpers;
};

ViewStack.prototype.createContext = function () {
	var helpers = this.helpers_;
	var context = Object.create(helpers);

	return context;
};

ViewStack.prototype.pushView = function (view) {
	this.views_.unshift(view);
};

ViewStack.prototype.execute = function (context, callback, ctx) {
	var views = this.views_;
	var i = views.length;

	callback = Controller.createSafeCallback(callback, ctx);

	var iter = function (target_rendering) {
		if (i) {
			context.$$components = Object.create(context.$$components || {});

			var view = views[--i];
			view.render(context, function (err, partial_rendering) {
				if (!context.$$components.hasOwnProperty('content')) {
					context.$$components['content'] = function () { return partial_rendering; };
				}

				if (err) {
					var call_stack = (err.stack || '').split("\n");
					call_stack.splice(1, 0, '    at ' + view.template_path_);
					err.stack = call_stack.join("\n");

					callback.call(ctx, err, null);
				} else {
					iter(partial_rendering);
				}
			});
		} else {
			callback.call(ctx, null, target_rendering || '');
		}
	};

	iter();
};


module.exports = ViewStack;
