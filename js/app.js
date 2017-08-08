var app = angular.module('doSelectApp', ["ui.router", 'ngRoute', 'doSelectApp.controllers', 'doSelectApp.services']);
app.run(function ($rootScope, issueFactory, $state) {
    issueFactory.openDatabase().then(function () {
        issueFactory.setupIndexedDb(setupJSON).then(function (data) {
            console.log("SETUP", data);
            $state.go('app.issues')
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
app.config(function ($stateProvider, $urlRouterProvider) {

    $stateProvider
        .state('app', {
            url: '/app',
            abstract: true
        })
        .state('app.issues', {
            url: '/Issues',
            templateUrl: "templates/issue-list.html",
            controller: 'issueListCtrl'

        })
        .state('app.newIssue', {
            url: '/NewIssue',
            templateUrl: "templates/issue-new.html",
            controller: 'newIssueCtrl'


        }).state('app.issueDetails', {
            url: '/IssueDetails/:SR',
            templateUrl: "templates/issue-detail.html",
            controller: 'issueDetailCtrl'

        })
    $urlRouterProvider.otherwise('/Issues');

    /*$routeProvider
    .state("/", {
        templateUrl: "templates/issue-list.html",
        controller: 'issueListCtrl'
    })
    .state("/newIssue", {
        templateUrl: "templates/issue-new.html",
        controller: 'newIssueCtrl'
    })
    .state("/issueDetail:SR", {
        templateUrl: "templates/issue-detail.html",
        controller: 'issueDetailCtrl'
    })
    .otherwise({
        templateUrl: "templates/issue-list.html",
        controller: 'issueListCtrl'
    });*/
});
