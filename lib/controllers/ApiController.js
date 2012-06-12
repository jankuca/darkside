var util = require('util');
var darkside = require('darkside');


var ApiController = function () {
  darkside.base(darkside.Controller, this);
};

util.inherits(ApiController, darkside.Controller);


ApiController.prototype.render = function (status, data) {
  var is_error = (status >= 300) && (status !== 418);

  if (typeof data === 'undefined') {
    data = { 'ok': !is_error };
  } else if (typeof data === 'object') {
    data['ok'] = !is_error;
  }

  if (typeof data === 'object') {
    data['status'] = status;
  }

  var response = this.$response;
  response.head(status || 200);
  response.body(data);
  response.end();
};

ApiController.prototype.terminate = function (status, error_message) {
  var data = {
    'error': error_message || true
  };
  this.render(status, data);
};


module.exports = ApiController;
