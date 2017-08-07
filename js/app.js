var app = angular.module('doSelectApp', ['ngRoute', 'doSelectApp.controllers', 'doSelectApp.services']);
app.run(function ($rootScope, issueFactory) {
    issueFactory.openDatabase().then(function () {
        issueFactory.setupIndexedDb(setupJSON).then(function (data) {
            console.log("SETUP", data);
        }, function (error) {
            console.log(error);
        })
    }, function (err) {
        console.log(err);
    });
});

app.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter);
                });
                event.preventDefault();
            }
        });
    };
});
app.config(function ($routeProvider, $locationProvider) {

    $routeProvider
        .when("/", {
            templateUrl: "templates/issue-list.html",
            controller: 'issueListCtrl'
        })
        .when("/newIssue", {
            templateUrl: "templates/issue-new.html",
            controller: 'newIssueCtrl'
        })
        .otherwise({
            templateUrl: "templates/issue-list.html",
            controller: 'issueListCtrl'
        });
});
