"use strict"

var mongo = require("mongodb");

function MongoConnection(config) {

	// Validate input configuration
	function validateConfig() {
		if(typeof(config)!="object") {
			throw("config required for MongoConnection");
		}
		if(typeof(config.SocketIOPort)!="number") {
			throw("SocketIOPort required and must be a number");
		}
		if(typeof(config.Collection)!="string") {
			throw("Collection required");
		}
		if(typeof(config.Database)!="string") {
			throw("Database required");
		}
		if(typeof(config.MongoServer)!="string") {
			throw("MongoServer required");
		}
	}
	
	validateConfig();
	
	
	/*
		Create a socket and listen on the mentioned port. 
		-- When  a client connects, emit a string "connected"
		-- Attach listeners to socket commands on a new connection. 
	*/
	function loadSocket(collection) {
		var io = require('socket.io').listen(config.SocketIOPort);

		function cleanup(documents) {
			var max_limit = 100;
			if(documents.length > max_limit) {
				var to_delete = documents.splice(max_limit);
				for(var i=0;i<to_delete.length;i++){
					collection.remove(to_delete[i],true,function(del_err){
						if(del_err){
							console.log("Cleanup error: ", del_err);
						}
					})
				} 
			}
		}

		function findAllData(callback) {
			collection.find({}, function(error, cursor) {
				cursor.toArray(function(err,documents){

					//Reversing the documents  - this may change as per implementation
					documents.reverse();

					// This is specific to the demo - cap the todos 
					cleanup(documents);

					callback(err, documents)
				});
			});
		}
		
		function insertData(data,callback) {
			collection.insert(data, {safe:true},callback);
		}
		
		function updateData(data, callback) {
			console.log('Update called', data);
			var id = data._id;
			delete data["_id"];
			collection.update({"_id": new mongo.ObjectID(id)},{$set: data}, {safe:true}, callback);
		}
		
		function deleteData(data, callback) {
			console.log('Delete called', data);
			collection.remove({_id: new mongo.ObjectID(data._id)}, true, callback);
		}
		
		function sendTo(o,command,items) {
			var o = io.sockets;
			o.emit.apply(o,[command, items]);
		}
		
		function sendAllItems(to, items) {
			sendTo(to,'items-update-all', items);
		}
		var broadcastData = function() {
			findAllData(function(error, items){
				sendAllItems(io.sockets, items);
			});
		}
		
		var sendData = function(sock) {
			findAllData(function(error, items){
				sendAllItems(sock, items);
			});
		}
			
		io.sockets.on('connection', function(socket) {

			socket.on('get-all-data', function() {
				console.log("called get-data");
				sendData(socket);
			});
			
			socket.on('insert', function(data) {
				insertData(data, broadcastData);
			});
			
			socket.on('update', function(data) {
				updateData(data, broadcastData);
			});
			
			socket.on('delete', function(data) {
				deleteData(data, broadcastData);
			});

			socket.emit('message', {message: 'Connected to socket'});

		});
	}


	/*
		Start the mongo server based on config
	*/
	function start() {
		var host = config.MongoServer;

		var port;
		if(config.MongoPort) {
			port = config.MongoPort;
		} else {
			port = mongo.Connection.DEFAULT_PORT;
		}

		var db = new mongo.Db(config.Database, 
								new mongo.Server(host,port,{}));

		db.open(function(err){ 
			if(err) {
				console.log("DB connection error: ", err);
				return;
			}

			console.log("We are connected");
			
			db.collection(config.Collection, function(error, collection) {
				console.log("We have the collection, starting socket");
				loadSocket(collection)
			});
		});
	}
	
	start();
}


// todo: The definition for MongoConnection above may be moved out as a module later...


var serverPort = 9337;
var socketPort = 9338;

// Start a MongoConnection
var m = new MongoConnection({
	SocketIOPort: socketPort, // SocketIO port where this stuff will load.
	Collection: "todos", // we have todos collection
	Database: "todo-db", // databse name
	MongoServer:"localhost" // server name
});


// Start the page server

var express = require('express');
var app = express();
app.configure(function () {
	app.use(app.router);
    app.use("/", express.static(__dirname));
});


app.listen(serverPort); 

