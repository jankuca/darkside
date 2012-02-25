var fs = require('fs');
var log = require('sys').log;
var path = require('path');

var eco = require('eco');


var View = function (template_path) {
	this.template_path_ = template_path + '.eco';
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

	fs.readFile(this.template_path_, 'utf8', function (err, source) {
		if (err) {
			callback(err, null);
		} else {
			var compilation = eco.compile(source);

			try {
				var rendering = compilation(context);
				delete context.component;
				callback(null, rendering);
			} catch (err) {
				delete context.component;
				callback(err, null);
			}
		}
	});
};


module.exports = View;
