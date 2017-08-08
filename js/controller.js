angular.module('doSelectApp.controllers', [])
    .filter('labelFilter', function () {
        return function (items, filterObject) {
            var filteredRows = items,
                authorFilter = false,
                assigneeFilter = false,
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


            if (filterObject.labels.length > 0) {
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
    .controller('issueListCtrl', function ($scope, $state, issueFactory, $timeout) {
        //Object for non-scope related data
        var issueConfigData = {
            getOpenIssues: function () {
                issueFactory.openDatabase().then(function () {
                    issueFactory.getOpenIssues().then(function (openIssueList) {
                        console.log(openIssueList.length);
                        console.log(openIssueList);
                        if (openIssueList.length) {
                            openIssueList.forEach(function (item) {
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
                    console.log(err)
                });
            },
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
                    console.log(err)
                });
            },
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
            checkFiltersSet: function () {
                var issueFilters = angular.copy($scope.issueScopeData.issueFilters);
                if ((issueFilters.author.length > 0) || (issueFilters.labels.length > 0) || (issueFilters.assignee.length > 0))
                    return true;
                else if (!(issueFilters.sort.code === window.sortList[0].code)) {
                    return true;
                } else
                    return false;
            },
            processFiltersInput: function () {
                var filterText = angular.copy($scope.issueScopeData.filterModel);
                var issueFilters = angular.copy($scope.issueScopeData.issueFilters);
                issueFilters.labels = [];
                var re_is = /(?:^|is):([a-zA-Z]+)/gm;
                var re_label1 = /(?:^|label):([a-zA-Z]+\\?)/gm;
                var re_label2 = /(?:^|label):(\")(.*?)(\")/gm;
                var re_auth1 = /(?:^|author):([a-zA-Z]+\\?)/gm;
                var re_auth2 = /(?:^|author):(\")(.*?)(\")/gm;
                var re_sort = /(?:^|sort):([a-zA-Z]+\\?-[a-zA-Z]+\\?)/gm;
                var re_ass1 = /(?:^|assignee):([a-zA-Z]+\\?)/gm;
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
                2
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
        $scope.author = false;
        $scope.issueScopeData = {
            filterModel: 'is:issue is:open',
            newIssue: function () {
                $state.go('app.newIssue')
            },
            openIssueList: [],
            closedIssueList: [],
            authorsList: [],
            labelsList: angular.copy(labelArr),
            issueFilters: {
                authorFilterModel: '',
                labelFilterModel: '',
                author: '',
                labels: [],
                assignee: '',
                sort: window.sortList[0],
            },
            contains: function (datasetArray, filterObject, type) {
                return issueConfigData.checkContains(datasetArray, filterObject, type);
            },
            filterModelUpdate: function (value, type) {
                issueConfigData.updateFilterModel(value, type);

            },
            sortList: angular.copy(window.sortList),
            filtersSet: function () {
                return issueConfigData.checkFiltersSet();
            },
            resetFilter: function () {
                this.issueFilters = {
                    authorFilterModel: '',
                    labelFilterModel: '',
                    author: '',
                    labels: [],
                    assignee: '',
                    sort: window.sortList[0],
                }
                //                this.filtersSet = false;
                this.filterModel = "is:issue is:open"
            },
            sortSelect: function (sortObj) {
                // this.filtersSet = true;
                this.issueFilters.sort = angular.copy(sortObj);
                this.filterModelUpdate(sortObj.desc, 'sort')

            },
            authorSelect: function (author) {
                // this.filtersSet = true;
                this.issueFilters.authorFilterModel = '';
                this.issueFilters.author = this.issueFilters.author === author ? '' : author;
                this.filterModelUpdate(author, 'author')
            },
            assigneeSelect: function (assignee) {
                // this.filtersSet = true;
                this.issueFilters.assigneeFilterModel = '';
                this.issueFilters.assignee = this.issueFilters.assignee === assignee ? '' : assignee;
                this.filterModelUpdate(assignee, 'assignee')
            },
            labelSelect: function (label) {
                // this.filtersSet = true;
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
                this.filterModelUpdate(label.title, 'label')
            },
            processFiltersInput: function () {
                issueConfigData.processFiltersInput();
            },
            issueDetails: function (issue) {
                $state.go("app.issueDetails", {
                    SR: issue.key
                })
            }
        };
        //load open issues
        issueConfigData.getOpenIssues();
        //load closed issues
        issueConfigData.getClosedIssues()
    })

    .controller('newIssueCtrl', function ($scope, $state, issueFactory) {
        var newIssueConfig = {};
        $scope.newIssueScope = {
            authorsList: angular.copy(setupJSON.authors),
            labelsList: angular.copy(labelArr),
            issueFilters: {
                assigneeFilterModel: '',
                labelFilterModel: '',
                labels: [],
                assignee: [],
            },
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
            addIssue: function () {
                this.newIssue.labels = this.issueFilters.labels;
                this.newIssue.assignee = this.issueFilters.assignee;

                /* this.newIssue.comments.push({
     text: this.newIssue.comment,
     date: new Date().toISOString(),
     author: user
 })*/
                issueFactory.addIssue(this.newIssue).then(function (issueSubmit) {
                        console.log(issueSubmit);
                        $state.go("app.issues");
                    },
                    function (err) {
                        console.log(err);
                    })
            },
            cancelIssue: function () {
                $state.go("app.issues");
            }
        };
    })
    .controller('issueDetailCtrl', function ($scope, $stateParams, issueFactory) {
        console.log($stateParams.SR);
        var issueDetailConfig = {
            getIssueDetails: function () {
                issueFactory.getIssue($stateParams.SR, 'open').then(function (issueData) {
                    console.log("ISSUE DETAILS", issueData);
                    $scope.issueDetailScope.issueDetails = angular.copy(issueData);
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
