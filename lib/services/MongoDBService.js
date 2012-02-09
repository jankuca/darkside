var MongoDB = require('mongodb-lite');


/**
 * @param {MongoDB.ReplicaSet|MongoDB.Server} server
 */
var MongoDBService = function (server) {
	this.server_ = server;
};

MongoDBService.ReplicaSet = MongoDB.ReplicaSet;
MongoDBService.Server = MongoDB.Server;

MongoDBService.prototype.getServer = function () {
	return this.server_;
};

MongoDBService.prototype.getDatabase = function (db_name) {
	return this.server_.getDatabase(db_name);
};


module.exports = MongoDBService;
