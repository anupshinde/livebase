function LiveBase(service_url, collection) {
	var _documents = [];
	var socket = null;
	var _listeners = [];
	
	
	function createSocket(service_url,collection) {
		socket = io.connect(service_url);

		socket.on('message', messageReceived);

		socket.on('items-update-all', itemsUpdateAll);		
		
		//TODO: socket.on('items-update-few', itemsUpdateFew);		
	}
	
	function messageReceived(data) {
		console.log("Message: " ,data);
	}
	
	function itemsUpdateAll(data) {
		console.log('updating all');
		_documents.length=0;
		Array.prototype.push.apply(_documents, data);
		fire('ItemsUpdated');
	}

	/* TODO:
	function itemsUpdateFew(data) {
		_documents.length=0;
		Array.prototype.push.apply(_documents, data);
		updateUI();
	}
	*/

	this.getAllData = function() {
		socket.emit('get-all-data', {});
		console.log('get called');
		return _documents;
	}
	
	insert = function(data) {
		socket.emit('insert', data);
	}

	update = function(data) {
		socket.emit('update', data);
	}
	
	this.remove = function(data) {
		socket.emit('delete', data);
	}

	this.save = function(data) {
		if(data._id) {
			console.log('Update ', data);
			update(data);
		} else {
			console.log('Insert ', data);
			insert(data);
		}
	}
	
	this.addListener= function(type, listener){
		if (typeof _listeners[type] == "undefined"){
			_listeners[type] = [];
		}
        _listeners[type].push(listener);
    }

	this.removeListener= function(type, listener){
		if (_listeners[type] instanceof Array){
            var listeners = _listeners[type];
            for (var i=0, len=listeners.length; i < len; i++){
                if (listeners[i] === listener){
                    listeners.splice(i, 1);
                    break;
                }
            }
        }
    }
	
	function fire(event, data){
		if (_listeners[event] instanceof Array){
            var listeners = _listeners[event];
            for (var i=0, len=listeners.length; i < len; i++){
                listeners[i].call(this, event);
            }
        }
    }
	
	createSocket(service_url, collection);
}


/* --when console is not available- */
if(typeof(console)=='undefined' || console==null) {	
	console = {};
	console.log = function(){};
}