
var ServerResponse = function (res) {
	this.native_response_ = res;
};

ServerResponse.prototype.getNativeResponse = function () {
	return this.native_response_;
};


module.exports = ServerResponse;
