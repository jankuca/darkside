var MongoDB = require('mongodb-lite');


var MongoDBService = function (config) {
	var server;
	if (config['replica_set']) {
		server = new MongoDB.ReplicaSet(config['replica_set']);
		config['servers'].forEach(function (url) {
			var node = new MongoDB.Server(url);
			server.addServer(node);
		});
	} else {
		server = new MongoDB.Server(config['server']);
	}

	var db = server.getDatabase(config['name']);
	db.ObjectId = MongoDB.ObjectId;

	return db;
};


module.exports = MongoDBService;
