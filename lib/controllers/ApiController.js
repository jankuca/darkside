var util = require('util');

var Controller = require('./Controller');


var ApiController = function (name, request, response) {
};

util.inherits(ApiController, Controller);


module.exports = ApiController;
