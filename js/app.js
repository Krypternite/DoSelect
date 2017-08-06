var app = angular.module('doSelectApp', ['ngRoute', 'doSelectApp.controllers', 'doSelectApp.services']);
app.run(function ($rootScope, issueService) {
    issueService.openDatabase().then(function () {
        issueService.setupIndexedDb(setupJSON).then(function (data) {
            console.log("SETUP", data);
        }, function (error) {
            console.log(error);
        })
    }, function (err) {
        console.log(err);
    });
});


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
    })*/
        .otherwise({
            templateUrl: "templates/issue-list.html",
            controller: 'issueListCtrl'
        });
});
