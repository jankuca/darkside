var Controller = require('./Controller');


var ViewContext = function () {
	this.stack_ = [];
};

ViewContext.prototype.pushView = function (view) {
	this.stack_.unshift(view);
};

ViewContext.prototype.execute = function (callback, ctx) {
	var context = this;
	var stack = this.stack_;
	var i = stack.length;

	callback = Controller.createSafeCallback(callback, ctx);

	var iter = function (target_rendering) {
		if (i) {
			var view = stack[--i];
			view.render(context, function (err, partial_rendering) {
				if (err) {
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


module.exports = ViewContext;
