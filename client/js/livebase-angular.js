
angular.module('livebase',[]);

angular.module('livebase').factory('angularBase', function($rootScope,$q) {
	var _q = $q;
	var lb = null;
	
	function updateUI() {
		var scp = $rootScope;
		if(!scp.$$phase) {
			console.log('digest called');
			scp.$digest();
		}
	}
		
	return function(service_url, collection) { 
		lb = new LiveBase(service_url, collection);
		lb.addListener('ItemsUpdated', function() {
			updateUI();
		});
		
		return {
			put: function(data) {
				lb.save(data);
				updateUI(); // TODO: return promise?
			},
			getAll: function() {
				return lb.getAllData(); 
				// TODO: return promise?
			},
			remove: function(data) {
				lb.remove(data);
				console.log('remove called');
				// TODO: return promise?
			}
		};
	};
	
});
