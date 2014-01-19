
var todo_app = angular.module('TodoApp',['livebase']);

todo_app.controller("TodoCtrl", function($scope, angularBase) {
	var Todos = angularBase("http://localhost:9338","todos"); // NOTE: The configuration here must match with the server - obviously

	$scope.todos = Todos.getAll();

	$scope.addTodo = function() {
		var todo = { text:$scope.todoInput, done:false};
		Todos.put(todo);
		$scope.todoInput = "";
	}
	
	$scope.deleteTodo = function(index) {
		var todo = $scope.todos[index];
		Todos.remove(todo);		
	}
	
	$scope.changeTodo = function(index) {
		var todo = $scope.todos[index];
		todo = { _id: todo._id, done: todo.done };
		Todos.put(todo);
	}
});

