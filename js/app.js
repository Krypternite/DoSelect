var app = angular.module('doSelectApp', ["ui.router", 'ngRoute', 'doSelectApp.controllers', 'doSelectApp.services']);
app.run(function ($rootScope, issueFactory, $state, $rootScope) {

    /**BROADCAST CATCHER TO HANDLE INIT PROBLEMS*/
    $rootScope.$on('INIT', function (event, initType) {
        if (initType.type === 'reinit')
            $state.go("app.init", {
                type: 're'
            });
        else
            $state.go("app.init");
    })
    /*CODE RUN TO INIT THE DB WHENEVER FIRST RUN*/
    try {
        issueFactory.openDatabase().then(function () {
            issueFactory.setupIndexedDb(setupJSON).then(function (data) {
                console.log("SETUP", data);
                appRun = true;
                $state.go('app.issues')
            }, function (error) {
                console.log(error);
            })
        }, function (err) {
            console.log(err);
        });
    } catch (exception) {
        alert("The Database could not be initialized.");
    }
});
/**DIRECTIVE TO CATCH ENTER BUTTON PRESS*/
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
/*APP CONFIG*/
app.config(function ($stateProvider, $urlRouterProvider) {
    /**APP STATES*/
    $stateProvider
        .state('app', {
            url: '/app',
            abstract: true
        })
        .state('app.init', {
            url: '/Init/:type',
            templateUrl: "templates/init.html",
            controller: 'initCtrl'

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
    $urlRouterProvider.otherwise('app/Init');

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
