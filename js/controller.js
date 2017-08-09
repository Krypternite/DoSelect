angular.module('doSelectApp.controllers', [])
    /**CUSTOM FILTER for filter out the issue rows based on the various applied filters**/
    .filter('issueFilter', function () {
        return function (items, filterObject) {
            var filteredRows = items,
                authorFilter = false,
                assigneeFilter = false,
                noLabel = false,
                labelFilter = false;



            if (filterObject.author.length > 0) {
                authorFilter = true;
                var temp = [];
                angular.forEach(items, function (item) {
                    if (item.author.indexOf(filterObject.author) > -1) {
                        temp.push(item);
                    }
                })
                filteredRows = temp;
            } else {
                authorFilter = false;
            }

            if (filterObject.assignee.length > 0) {
                assigneeFilter = true;
                var assigneeFilterDataSet = authorFilter == true ? filteredRows : items;
                var temp = [];
                angular.forEach(assigneeFilterDataSet, function (item) {
                    if (item.assignee.indexOf(filterObject.assignee) > -1) {
                        temp.push(item);
                    }
                });
                filteredRows = temp;
            } else {
                assigneeFilter = false;
            }


            if (filterObject.noLabel && filterObject.labels.length === 0) {
                noLabel = true;
                var labelFilterDataSet = authorFilter == true || assigneeFilter == true ? filteredRows : items;
                var temp = [];
                angular.forEach(labelFilterDataSet, function (item) {
                    if (item.labels.length === 0) {
                        temp.push(item);
                    }
                });
                filteredRows = temp;

            }


            if (filterObject.labels.length > 0 && !filterObject.noLabel) {
                labelFilter = true;
                var labelFilterDataSet = authorFilter == true || assigneeFilter == true ? filteredRows : items;
                var temp = [];
                angular.forEach(labelFilterDataSet, function (item) {
                    for (var a = 0; a < item.labels.length; a++) {
                        if (filterObject.labels.filter(function (e) {
                                return e.code == item.labels[a].code
                            }).length > 0) {

                            if (temp.filter(function (e) {
                                    return e.serial == item.serial
                                }).length <= 0)
                                temp.push(item);
                        }
                    }
                });
                filteredRows = temp;

            } else {
                labelFilter = false;
            }
            return filteredRows;
        }
    })
    /*INIT CONTROLLER, hanldes the initialization of the database*/
    .controller('initCtrl', function ($scope, $stateParams, $state, issueFactory, $timeout) {
        try {
            //if the parameter type is "re" that means the app database needs to be re-initialized
            var params = $stateParams.type;
            issueFactory.openDatabase().then(function () {
                issueFactory.setupIndexedDb(setupJSON).then(function (data) {
                    console.log("SETUP", data);
                    if (params === 're')
                        alert("There was some problem the database,it has now been re-initialized");
                    //go to the issues page once the app has been initialized
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
    })
    /*ISSUE LIST CONTROLLER, controller for the issue page, handles the various operations and getting of the data*/
    .controller('issueListCtrl', function ($scope, $rootScope, $state, issueFactory, $timeout) {
        //Object for non-scope related data
        var issueConfigData = {
            //fn to get the list of OPEN issues
            getOpenIssues: function () {
                issueFactory.openDatabase().then(function () {
                    issueFactory.getOpenIssues().then(function (openIssueList) {
                        if (openIssueList.length) {
                            openIssueList.forEach(function (item) {
                                //Adds the authors to the authors array for the filter to work
                                if ($scope.issueScopeData.authorsList.indexOf(item.author) < 0) {
                                    $scope.issueScopeData.authorsList.push(item.author);
                                }
                                $scope.issueScopeData.openIssueList.push(item);

                            })
                        }

                    }, function (error) {
                        console.log(error);

                    })
                }, function (err) {
                    console.log(err);
                });
            },
            //fn to get the list of CLOSED issues
            getClosedIssues: function () {
                issueFactory.openDatabase().then(function () {
                    issueFactory.getClosedIssues().then(function (closedIssueList) {
                        if (closedIssueList.length) {
                            closedIssueList.forEach(function (item) {
                                $scope.issueScopeData.closedIssueList.push(item);
                            })
                        }
                    }, function (error) {
                        console.log(error);

                    })
                }, function (err) {
                    console.log(err);


                });
            },
            //fn to check if a an array contains an object
            checkContains: function (datasetArray, filterObject, type) {
                var i, property = "";
                switch (type) {
                    case 'label':
                        property = "code";
                        break;
                }
                for (i = 0; i < datasetArray.length; i++) {
                    if (datasetArray[i][property] === filterObject[property]) {
                        return true;
                    }
                }

                return false;
            },
            //fn to update the filter text box with the various added or removed
            updateFilterModel: function (value, type) {
                var filterModelData = $scope.issueScopeData.filterModel;
                if (value.split(" ").length > 1) {
                    value = '"' + value + '"';
                }
                var temp = "";
                if (filterModelData.indexOf(type + ":" + value) < 0) {
                    temp = filterModelData.split(' ' + type + ':' + value).join('') + " " + type + ":" + value;
                } else {
                    temp = filterModelData.split(' ' + type + ':' + value).join('');
                }
                $scope.issueScopeData.filterModel = angular.copy(temp);
            },
            //fn to check if any filters have been set or not
            checkFiltersSet: function () {
                var issueFilters = angular.copy($scope.issueScopeData.issueFilters);
                if ((issueFilters.author.length > 0) || (issueFilters.labels.length > 0) || (issueFilters.assignee.length > 0))
                    return true;
                else if (!(issueFilters.sort.code === window.sortList[0].code)) {
                    return true;
                } else
                    return false;
            },
            /*fn to process the text of the filter text box to parse the various filters applied through text. Gets called when somebody pressed ENTER after clicking on the text box.*/
            processFiltersInput: function () {
                var filterText = angular.copy($scope.issueScopeData.filterModel);
                var issueFilters = angular.copy($scope.issueScopeData.issueFilters);
                issueFilters.labels = [];
                var re_is = /(?:^|is):([a-zA-Z]+)/gm;
                //single word label
                var re_label1 = /(?:^|label):([a-zA-Z]+\\?)/gm;
                //multi word label
                var re_label2 = /(?:^|label):(\")(.*?)(\")/gm;
                //single word author
                var re_auth1 = /(?:^|author):([a-zA-Z]+\\?)/gm;
                //multi word author
                var re_auth2 = /(?:^|author):(\")(.*?)(\")/gm;
                //single word label
                var re_sort = /(?:^|sort):([a-zA-Z]+\\?-[a-zA-Z]+\\?)/gm;
                //single word label
                var re_ass1 = /(?:^|assignee):([a-zA-Z]+\\?)/gm;
                //multi word assignee
                var re_ass2 = /(?:^|assignee):(\")(.*?)(\")/gm;
                var m,
                    is = "",
                    label = [],
                    auth = "",
                    sort = "",
                    ass = "";
                while ((m = re_auth1.exec(filterText)) != null) {
                    if (m.index === re_auth1.lastIndex) {
                        re_auth1.lastIndex++;
                    }
                    auth = m[1];

                }

                while ((m = re_auth2.exec(filterText)) != null) {
                    if (m.index === re_auth2.lastIndex) {
                        re_auth2.lastIndex++;
                    }
                    auth = m[2];

                }
                while ((m = re_sort.exec(filterText)) != null) {
                    if (m.index === re_sort.lastIndex) {
                        re_sort.lastIndex++;
                    }
                    sort = m[1];
                }
                while ((m = re_ass1.exec(filterText)) != null) {
                    if (m.index === re_ass1.lastIndex) {
                        re_ass1.lastIndex++;
                    }
                    ass = m[1];
                }

                while ((m = re_ass2.exec(filterText)) != null) {
                    if (m.index === re_ass2.lastIndex) {
                        re_ass2.lastIndex++;
                    }
                    ass = m[2];
                }

                while ((m = re_label1.exec(filterText)) != null) {
                    if (m.index === re_label1.lastIndex) {
                        re_label.lastIndex++;
                    }
                    label.push(m[1]);
                }
                while ((m = re_label2.exec(filterText)) != null) {
                    if (m.index === re_label2.lastIndex) {
                        re_label.lastIndex++;
                    }
                    label.push(m[2]);
                }


                issueFilters.author = auth;
                issueFilters.assignee = ass;
                if (sort.length > 0)
                    $scope.issueScopeData.sortList.forEach(function (item) {
                        if (item.desc === sort) {
                            issueFilters.sort = item;
                        }
                    });
                else
                    $scope.issueScopeData.issueFilters.sort = $scope.issueScopeData.sortList[0];

                if (label.length > 0) {
                    label.forEach(function (item) {
                        $scope.issueScopeData.labelsList.forEach(function (labelObj) {
                            if (labelObj.title === item)
                                issueFilters.labels.push(labelObj);
                        })

                    })
                } else {
                    issueFilters.labels = label;
                }

                /*Assign all the filter to the issueFilter object on the scope*/

                $scope.issueScopeData.issueFilters.author = angular.copy(issueFilters.author);
                $scope.issueScopeData.issueFilters.assignee = angular.copy(issueFilters.assignee);
                $scope.issueScopeData.issueFilters.sort = angular.copy(issueFilters.sort);
                $scope.issueScopeData.issueFilters.labels = angular.copy(issueFilters.labels);




            }
        };
        //Object for scope related data
        $scope.issueScopeData = {
            //model for the filter text box
            filterModel: 'is:issue is:open',
            //fn to go add a new issue. Changes state to new Issue.
            newIssue: function () {
                $state.go('app.newIssue')
            },
            //Array to hold the various types of sort available
            sortList: angular.copy(window.sortList),
            //Array for open issues.
            openIssueList: [],
            //Array for closed Issues
            closedIssueList: [],
            //Array for authors
            authorsList: [],
            //Array for labels
            labelsList: angular.copy(labelArr),
            //Object to hold the varios filter values applied
            issueFilters: {
                authorFilterModel: '',
                labelFilterModel: '',
                author: '',
                labels: [],
                assignee: '',
                noLabel: false,
                sort: window.sortList[0],
            },
            //fn to check if a dataset contains a given object
            contains: function (datasetArray, filterObject, type) {
                return issueConfigData.checkContains(datasetArray, filterObject, type);
            },
            //fn to update the text of the filters text box
            filterModelUpdate: function (value, type) {
                issueConfigData.updateFilterModel(value, type);

            },
            //fn to check if any filters have been set
            filtersSet: function () {
                return issueConfigData.checkFiltersSet();
            },
            //fn to reset the filter object
            resetFilter: function () {
                this.issueFilters = {
                    authorFilterModel: '',
                    labelFilterModel: '',
                    author: '',
                    labels: [],
                    assignee: '',
                    noLabel: false,
                    sort: window.sortList[0],
                }
                //                this.filtersSet = false;
                this.filterModel = "is:issue is:open"
            },
            //fn called when a sort type is selected
            sortSelect: function (sortObj) {
                // this.filtersSet = true;
                this.issueFilters.sort = angular.copy(sortObj);
                this.filterModelUpdate(sortObj.desc, 'sort')

            },
            //fn called when an author is selected
            authorSelect: function (author) {
                // this.filtersSet = true;
                this.issueFilters.authorFilterModel = '';
                this.issueFilters.author = this.issueFilters.author === author ? '' : author;
                this.filterModelUpdate(author, 'author')
            },
            //fn called when an assignee  is selected
            assigneeSelect: function (assignee) {
                // this.filtersSet = true;
                this.issueFilters.assigneeFilterModel = '';
                this.issueFilters.assignee = this.issueFilters.assignee === assignee ? '' : assignee;
                this.filterModelUpdate(assignee, 'assignee')
            },
            //fn called when a label type is selected
            labelSelect: function (label) {
                this.issueFilters.labelFilterModel = '';
                if (label === 'unlabeled') {
                    this.issueFilters.labels = [];

                    this.issueFilters.noLabel = !this.issueFilters.noLabel;
                    var labelSplit1 = /label:[a-zA-Z]+\\?/gm;
                    var labelSplit2 = /label:\".*?\"/gm;
                    this.filterModel = this.filterModel.split(labelSplit1).join("").trim();
                    this.filterModel = this.filterModel.split(labelSplit2).join("").trim();
                    this.filterModelUpdate("label", "no");

                } else {
                    if (this.issueFilters.noLabel) {
                        this.issueFilters.noLabel = false;
                        this.filterModel = this.filterModel.split("no:label").join("");
                    }
                    this.issueFilters.noLabel = false;
                    if (this.issueFilters.labels.filter(function (e) {
                            return e.code == label.code
                        }).length <= 0) {
                        this.issueFilters.labels.push(label);
                    } else {
                        this.issueFilters.labels = this.issueFilters.labels.filter(function (labelObj) {
                            return labelObj.code !== label.code;
                        });

                    }
                    this.filterModelUpdate(label.title, 'label');
                }




            },
            //fn called when ENTER is pressed on the filters text box
            processFiltersInput: function () {
                issueConfigData.processFiltersInput();
            },
            //fn to view the details for a particular issue
            issueDetails: function (issue) {
                $state.go("app.issueDetails", {
                    SR: issue.key
                })
            }
        };


        //load  issues
        $timeout(function () {
            issueConfigData.getOpenIssues();
            $timeout(issueConfigData.getClosedIssues(), 500);
        }, 800);
    })
    /*NEW ISSUE CONTROLLER, handles operations related to the new issue state*/
    .controller('newIssueCtrl', function ($scope, $state, issueFactory) {
        var newIssueConfig = {};
        $scope.newIssueScope = {
            //Array to hold the list of authors
            authorsList: angular.copy(setupJSON.authors),
            //Array to hold the list of labels
            labelsList: angular.copy(labelArr),
            //Object to hold the various assignees and labels assigned to the new issue
            issueFilters: {
                assigneeFilterModel: '',
                labelFilterModel: '',
                labels: [],
                assignee: [],
            },
            //fn to check if a dataset contains a particular object
            contains: function (datasetArray, filterObject, type) {
                var i, property = "";
                switch (type) {
                    case 'label':
                        property = "code";
                        for (i = 0; i < datasetArray.length; i++) {
                            if (datasetArray[i][property] === filterObject[property]) {
                                return true;
                            }
                        }
                        break;
                    case 'assignee':
                        for (i = 0; i < datasetArray.length; i++) {
                            if (datasetArray[i] === filterObject) {
                                return true;
                            }
                        }
                        break;
                }


                return false;
            },
            //Object to the details about the new issue
            newIssue: {
                title: '',
                comment: '',
                date: new Date().toISOString(),
                details: '',
                author: user,
                labels: [],
                updDate: new Date().toISOString(),
                comments: []

            },
            //fn called when an assignee is selected
            assigneeSelect: function (assignee) {
                this.issueFilters.assigneeFilterModel = '';
                if (this.issueFilters.assignee.length == 10) {
                    alert("Max. 10 assignees can be added")
                } else {
                    if (this.issueFilters.assignee.filter(function (e) {
                            return e == assignee
                        }).length <= 0) {
                        this.issueFilters.assignee.push(assignee);
                    } else {
                        this.issueFilters.assignee = this.issueFilters.assignee.filter(function (assigneeObj) {
                            return assigneeObj !== assignee;
                        })
                    }
                }


            },
            //fn called when a label is selected
            labelSelect: function (label) {
                this.issueFilters.labelFilterModel = '';
                if (this.issueFilters.labels.filter(function (e) {
                        return e.code == label.code
                    }).length <= 0) {
                    this.issueFilters.labels.push(label);
                } else {
                    this.issueFilters.labels = this.issueFilters.labels.filter(function (labelObj) {
                        return labelObj.code !== label.code;
                    })
                }

            },
            //fn to add a new issue to the database
            addIssue: function () {
                this.newIssue.labels = this.issueFilters.labels;
                this.newIssue.assignee = this.issueFilters.assignee;
                issueFactory.addIssue(this.newIssue).then(function (issueSubmit) {
                        console.log(issueSubmit);
                        $state.go("app.issues");
                    },
                    function (err) {
                        console.log(err);
                    })
            },
            //cancel adding a new issue
            cancelIssue: function () {
                $state.go("app.issues");
            }
        };
    })
    .controller('issueDetailCtrl', function ($scope, $state, $stateParams, issueFactory) {
        console.log($stateParams.SR);
        var issueDetailConfig = {
            getIssueDetails: function () {
                issueFactory.getIssue($stateParams.SR, 'open').then(function (issueData) {
                    console.log("ISSUE DETAILS", issueData);
                    $scope.issueDetailScope.issueDetails = angular.copy(issueData);
                }, function (err) {
                    console.log(err);
                });
            },
            submitComment: function (key, commentObj) {
                issueFactory.submitComment(key, commentObj).then(function () {
                    issueDetailConfig.getIssueDetails($stateParams.SR, 'open');
                }, function (err) {
                    console.log(err);
                });
            }
        };
        $scope.issueDetailScope = {
            issueDetails: {},
            cancelIssue: function () {
                $state.go('app.issues');
            },
            newComment: {
                text: "",
                author: user,
                date: new Date().toISOString()
            },
            submitComment: function () {
                issueDetailConfig.submitComment(this.issueDetails.id, this.newComment);
            }
        };
        issueDetailConfig.getIssueDetails();

    })
