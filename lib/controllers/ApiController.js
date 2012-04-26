var util = require('util');
var darkside = require('darkside');


var ApiController = function (name, request, response) {
  darkside.base(darkside.Controller, this);
};

util.inherits(ApiController, darkside.Controller);


module.exports = ApiController;
