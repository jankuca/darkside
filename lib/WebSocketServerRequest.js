var util = require('util');

var EventEmitter = require('events').EventEmitter;
var ServerRequest = require('./ServerRequest');


var WebSocketServerRequest = function (req, socket) {
  req = (typeof req === 'object') ? req : {};
  if (!req['path']) {
    throw new Error('No request path specified');
  }
  if (!req['host']) {
    throw new Error('No host specified');
  }

  var head = {
    method: req['method'] || 'GET',
    path: req['path'],
    headers: req['headers'] || {}
  };
  head.headers['host'] = req['host'];

  var body = req['body'] || null;

  var headers = {};
  Object.keys(head.headers).forEach(function (key) {
    headers[key.toLowerCase()] = head.headers[key];
  });

  var req = new EventEmitter();
  req.headers = headers;
  req.method = head.method;
  req.url = head.path;

  ServerRequest.call(this, req);

  this.connection = socket;
  this.body = body || {};
  this.emit('body');
};

util.inherits(WebSocketServerRequest, ServerRequest);


WebSocketServerRequest.prototype.isWebSocket = function () {
  return true;
};


module.exports = WebSocketServerRequest;
