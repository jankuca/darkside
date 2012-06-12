var fs = require('fs');
var log = require('sys').log;
var path = require('path');

var eco = require('eco');


var View = function (template) {
	if (typeof template === 'string') {
		this.template_path_ = template + '.eco';
	} else {
		this.template_ = template;
	}
};


View.prototype.render = function (context, callback) {
	var components = context.$$components || {};
	context.$$components = components;

	context.component = function (key, component) {
		if (component) {
			components[key] = component;
		} else if (components[key]) {
			return components[key]();
		} else {
			throw new Error('Missing component ' + key);
		}
	};

	var template = this.template_;

	var render = function () {
		try {
			var rendering = template(context);
			delete context.component;
			callback(null, rendering);
		} catch (err) {
			delete context.component;
			callback(err, null);
		}
	};

	if (!template && this.template_path_) {
		fs.readFile(this.template_path_, 'utf8', function (err, source) {
			if (err) {
				callback(err, null);
			} else {
				template = eco.compile(source);
				render();
			}
		});
	} else {
		render();
	}
};


module.exports = View;
