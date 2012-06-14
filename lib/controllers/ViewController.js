var darkside = require('darkside');
var log = require('sys').log;
var path = require('path');
var util = require('util');

var View = require('../View');
var ViewStack = require('../ViewStack');


var ViewController = function ($view_stacks) {
	darkside.base(darkside.Controller, this);

	this.layout_name_ = '@layout';
	this.page_template_path_ = true;
	this.view_stack_ = $view_stacks.create();

	this.view = this.view_stack_.createContext();
};

util.inherits(ViewController, darkside.Controller);

ViewController.prototype.$deps = [ '$view_stacks' ];


ViewController.prototype.setTemplateRoot = function (template_root) {
	this.template_root_ = template_root;
};

ViewController.prototype.createView = function (relative_path) {
	var template_path = path.resolve(this.template_root_, relative_path);
	var view = new View(template_path);

	return view;
};

ViewController.prototype.createViewFromBuilder = function (builder) {
	var view = new View(builder);

	return view;
};

ViewController.prototype.setTemplatePath = function (page_template_path) {
	this.page_template_path_ = page_template_path;
};

ViewController.prototype.getLayout = function () {
	return this.layout_name_;
};

ViewController.prototype.setLayout = function (layout_name) {
	this.layout_name_ = layout_name || null;
};

ViewController.prototype.beforeRender = function () {
	var layout_name = this.getLayout();
	var layout_path = layout_name ? layout_name + '.eco' : null;
	var page_path = this.page_template_path_ || null;
	if (page_path === true) {
		page_path = path.join(this.getName(), this.getAction() + '.eco');
	}
	var root_path = layout_path || page_path;

	if (page_path) {
		var page_view = this.createView(page_path);
		this.addView(page_view);

		if (page_path.substr(-4) === '.eco') {
			this.$response.header('content-type', 'text/html; charset=UTF-8');
		}
	}
	if (root_path !== page_path) {
		var root_view = this.createView(root_path);
		this.addView(root_view);
	}
};

ViewController.prototype.addView = function (view) {
	this.view_stack_.pushView(view);
};

ViewController.prototype.defineViewHelpers = function () {
	var controller = this;
	var view = this.view;

	view['link_to'] = function (target, params) {
		return controller.linkTo(target, params);
	};
};

ViewController.prototype.render = function (status) {
	this.beforeRender();

	this.defineViewHelpers();

	this.view_stack_.execute(this.view, function (err, rendering) {
		if (err) {
			log(err.stack || err);
			this.$response.end(500);
		} else {
			if (status) {
				this.$response.head(status);
			}
			this.$response.body(rendering);
			this.$response.end();
		}
	}, this);
};


module.exports = ViewController;
