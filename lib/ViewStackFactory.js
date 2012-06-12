
var ViewStack = require('./ViewStack');


var ViewStackFactory = function () {
  this.helpers = null;
};


ViewStackFactory.prototype.create = function () {
  var stack = new ViewStack();
  stack.setHelpers(this.helpers);

  return stack;
};


module.exports = ViewStackFactory;
