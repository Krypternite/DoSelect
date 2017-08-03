var app = angular.module('doSelectApp', ['ngRoute', 'doSelectApp.controllers', 'doSelectApp.services']);
app.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "templates/issue-list.html",
            controller: 'issueListCtrl'
        })
        /*.when("/red", {
        templateUrl: "red.htm"
    })
    .when("/green", {
        templateUrl: "green.htm"
    })
    .when("/blue", {
        templateUrl: "blue.htm"
    })
    .otherwise({
            templateUrl: "blue.html"
        });*/
});
