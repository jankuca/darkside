var util = require('util');

var Controller = require('./Controller');


var ApiController = function (name, request, response) {
	Controller.apply(this, arguments);
};

util.inherits(ApiController, Controller);


module.exports = ApiController;
