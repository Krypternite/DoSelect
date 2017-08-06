angular.module('doSelectApp.controllers', [])
    .filter('labelFilter', function () {
        return function (items, filterObject) {
            var filteredRows = items,
                authorFilter = false,
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

            if (filterObject.labels.length > 0) {
                labelFilter = true;
                var labelFilterDataSet = authorFilter == true ? filteredRows : items;
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
    .controller('issueListCtrl', function ($scope, issueService, $timeout) {
        var issueConfigData = {
            getOpenIssues: function () {
                issueService.openDatabase().then(function () {
                    issueService.getOpenIssues().then(function (openIssueList) {
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
                issueService.openDatabase().then(function () {
                    issueService.getClosedIssues().then(function (closedIssueList) {
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
            }
        };
        $scope.author = false;
        $scope.issueScopeData = {
            filterModel: 'is:issue is:open',

            openIssueList: [],
            closedIssueList: [],
            authorsList: [],
            contains: function (datasetArray, filterObject, type) {
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
            filterModelUpdate: function (value, type) {
                if (type === 'author') {
                    if (value.length > 0)
                        this.filterModel = this.filterModel.split(/ author:\w+/).join('') + " author:" + value;
                    else
                        this.filterModel = this.filterModel.split(/ author:\w+/).join('');
                    this.filterModel = temp.concat(" author:" + value);
                } else if (type === 'label') {
                    var temp = "";
                    if (this.filterModel.indexOf("label:" + value) < 0) {
                        temp = this.filterModel.split(' label:' + value).join('') + " label:" + value;
                    } else {
                        temp = this.filterModel.split(' label:' + value).join('');
                    }
                    this.filterModel = temp;
                } else if (type === 'sort') {
                    var temp = this.filterModel.split(' sort:' + value).join('') + " sort:" + value;
                    this.filterModel = temp;
                }

            },
            sortList: angular.copy(window.sortList),
            sortSelect: function (sortObj) {
                /* switch (sortType) {
                     case 'nw':
                         this.issueFilters.sort = {
                             sortParam: '-date',
                             code: sortType
                         }
                         break;
                     case 'ol':
                         this.issueFilters.sort = {
                             sortParam: 'date',
                             code: sortType
                         }
                         break;
                     case 'mc':
                         this.issueFilters.sort = {
                             sortParam: '-comments.length',
                             code: sortType
                         }
                         break;
                     case 'lc':
                         this.issueFilters.sort = {
                             sortParam: 'comments.length',
                             code: sortType
                         }
                         break;
                     case 'ru':
                         this.issueFilters.sort = {
                             sortParam: '-updDate',
                             code: sortType
                         }
                         break;
                     case 'lru':
                         this.issueFilters.sort = {
                             sortParam: 'updDate',
                             code: sortType
                         }
                         break;
                 }*/
                this.issueFilters.sort = angular.copy(sortObj);
                this.filterModelUpdate(sortObj.desc, 'sort')
                /*var temp = this.filterModel.split(' sort:')[0];

this.filterModel = temp.concat(" sort:" + sortObj.desc);*/
            },
            authorSelect: function (author) {
                this.issueFilters.authorFilterModel = '';
                this.issueFilters.author = this.issueFilters.author === author ? '' : author;
                this.filterModelUpdate(this.issueFilters.author, 'author')
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
                this.filterModelUpdate(label.title, 'label')
            },
            /*     labelFilter: function () {
         return function (item) {
             var result = 0;
             for (var a = 0; a < item.labels.length; a++) {
                 if (this.issueFilters.labels.filter(function (e) e.code == label.code).length < 0) {
                     result = 1;
                 } else {
                     result = 0;
                 }
             }

         }
     },*/
            issueFilters: {
                authorFilterModel: '',
                labelFilterModel: '',
                author: '',
                labels: [],
                sort: window.sortList[0],
            },
            labelsList: angular.copy(labelArr),
            toggleMenu: function (menuName) {
                switch (menuName) {
                    case 'author':

                        $scope.author = !$scope.author;
                        break;
                }
            }
        };
        console.log("CONTROLLER");

        issueConfigData.getOpenIssues();
        issueConfigData.getClosedIssues()
    })
