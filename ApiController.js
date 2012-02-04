var util = require('util');

var Controller = require('./Controller');


var ApiController = function (request, response) {
	Controller.call(this, request, response)
};

util.inherits(ApiController, Controller);


module.exports = ApiController;
