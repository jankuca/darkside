
var WebSocketServerResponse = function (respond) {
  this.status_ = 200;
  this.headers_ = [];
  this.body_ = null;

  this.respond = function (res) {
    respond(res);
  };
};

WebSocketServerResponse.prototype.head = function (status) {
  this.status_ = status;

  return this;
};

WebSocketServerResponse.prototype.header = function (key, value) {
  this.headers_.push([ key.toLowerCase(), String(value) ]);

  return this;
};

WebSocketServerResponse.prototype.cookie = function (key, value) {
  this.header('set-cookie', key + '=' + value);

  return this;
};

WebSocketServerResponse.prototype.body = function (data) {
  this.body_ = data;

  return this;
};

WebSocketServerResponse.prototype.end = function (status) {
  if (status) {
    this.head(status);
  }

  this.respond({
    'status': this.status_,
    'headers': this.headers_,
    'body': this.body_
  });
};


module.exports = WebSocketServerResponse;
