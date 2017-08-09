var db, setUp = false,
    shouldInit = false,
    appRun = false,
    user = "Superman";
angular.module('doSelectApp.services', [])
    .factory('issueFactory', function ($q, $state, $rootScope) {
        return {
            //function to open the database
            openDatabase: function () {
                var setupIndexedDb = this.setupIndexedDb;

                return $q(function (resolve, reject) {
                    try {
                        if (setUp) {
                            resolve(true);
                        }
                        var openRequest = window.indexedDB.open("DSIDB", 1);
                        openRequest.onerror = function (e) {
                            console.log("Error opening db");
                            reject({
                                State: 'false',
                                Reason: e.toString(),
                                Statement: 'The Db could not be opened.'
                            });
                        };
                        openRequest.onupgradeneeded = function (e) {

                            var thisDb = e.target.result;
                            var objectStore;
                            //flag to decide if the setup should run or not
                            shouldInit = true;
                            appRun = false;
                            //Create ObjectStores For Issues 

                            if (!thisDb.objectStoreNames.contains("openIssues")) {
                                objectStore = thisDb.createObjectStore("openIssues", {
                                    keyPath: "id",
                                    autoIncrement: true
                                });
                                objectStore.createIndex("openKey", "key", {
                                    unique: true
                                });
                                objectStore.createIndex("openIssueTitle", "title", {
                                    unique: false
                                });

                            }

                            if (!thisDb.objectStoreNames.contains("closedIssues")) {
                                objectStore = thisDb.createObjectStore("closedIssues", {
                                    keyPath: "id",
                                    autoIncrement: true
                                });
                                objectStore.createIndex("closedKey", "key", {
                                    unique: true
                                });
                                objectStore.createIndex("closedIssueTitle", "title", {
                                    unique: false
                                });
                            }
                        };

                        openRequest.onsuccess = function (e) {
                            db = e.target.result;
                            db.onerror = function (event) {
                                /*Generic error handler for all errors targeted at this database's requests*/
                                reject("Database error: " + event.target.errorCode);
                            };
                            console.log(setUp);
                            setUp = true;
                            //IF THE UGRADE NEEDED IS CALLED IT MEANS THE DB NEEDS AN INIT
                            if (shouldInit)
                                /*IF THE APP BECOMES FALSE DURING UPGRADE NEEDED, IT MEANS THE APP RUNS INIT-AGAIN*/
                                if (!appRun)
                                    $rootScope.$broadcast("INIT", {
                                        type: 'reinit'
                                    });
                                else
                                    $rootScope.$broadcast("INIT", {
                                        type: 'init'
                                    });
                            resolve(true);
                        }
                    } catch (exception) {
                        reject({
                            State: false,
                            Reason: exception,
                            Statement: "The database connection coud not be made. It would be better to re-init the database"
                        });
                    }
                });


            },
            //function to run the set up script on the db
            setupIndexedDb: function (parameters) {
                return $q(function (resolve, reject) {
                    try {
                        //flag to check if the db needs a re-init.
                        if (shouldInit) {
                            var transaction, store;
                            transaction = db.transaction(["openIssues"], "readwrite");
                            store = transaction.objectStore("openIssues");
                            //Add Open Issues
                            setupJSON.openIssues.forEach(function (item) {

                                var request = store.add(item);

                                request.onerror = function (e) {
                                    reject({
                                        state: false,
                                        Reason: e,
                                        Statement: 'Could not add open issues'
                                    })

                                    //some type of error handler
                                }

                                request.onsuccess = function (e) {
                                    console.log("Open Issue Setup Complete");
                                }
                            });
                            //Add Closed Issues
                            transaction = db.transaction(["closedIssues"], "readwrite");
                            store = transaction.objectStore("closedIssues");

                            setupJSON.closedIssues.forEach(function (item) {

                                var request = store.add(item);

                                request.onerror = function (e) {
                                    reject({
                                        state: false,
                                        Reason: e,
                                        Statement: 'Could not add closed issues'
                                    })


                                }

                                request.onsuccess = function (e) {
                                    console.log("Closed Issue Setup Complete");
                                }
                            });
                            shouldInit = false;
                            resolve("SETUP COMPLETE");
                        } else {
                            shouldInit = false;
                            resolve("SETUP NOT NEEDED");
                        }

                    } catch (exception) {
                        reject({
                            State: false,
                            Reason: exception,
                            Statement: "The database could not be initialized."
                        })
                    }
                })
            },
            //function to get a list of issue tagged as Open
            getOpenIssues: function () {
                var openIssues = [];
                return $q(function (resolve, reject) {
                    try {
                        var transaction = db.transaction(["openIssues"], "readonly");
                        var objectStore = transaction.objectStore("openIssues");

                        objectStore.openCursor().onsuccess = function (e) {
                            var cursor = e.target.result;
                            if (cursor) {
                                //Add the serial number (key) to the issue object
                                cursor.value["key"] = cursor.key;
                                openIssues.push(cursor.value);
                                cursor.continue();

                            }
                        };
                        transaction.oncomplete = function (event) {
                            resolve(openIssues);
                        };
                        transaction.onerror = function (even) {
                            reject({
                                State: false,
                                Resaon: transaction.error,
                                Statement: "The issue getting transaction could not be completed."
                            });
                        };
                    } catch (exception) {
                        reject({
                            State: false,
                            Resaon: exception,
                            Statement: "The issue getting transaction could not be completed."
                        });
                    }
                });
            },
            //function to get a list of issue tagged as Closed
            getClosedIssues: function () {
                var closedIssues = [];
                return $q(function (resolve, reject) {
                    try {
                        var transaction = db.transaction(["closedIssues"], "readonly");
                        var objectStore = transaction.objectStore("closedIssues");


                        objectStore.openCursor().onsuccess = function (e) {
                            var cursor = e.target.result;
                            if (cursor) {
                                closedIssues.push(cursor.value);
                                cursor.continue();

                            }
                        };
                        transaction.oncomplete = function (event) {
                            resolve(closedIssues);
                        };

                    } catch (exception) {
                        reject({
                            State: false,
                            Resaon: exception,
                            Statement: "The issue getting transaction could not be completed."
                        });
                    }
                });
            },
            //function to add a new issue to the database
            addIssue: function (issueObj) {
                var openDatabase = this.openDatabase;
                return $q(function (resolve, reject) {
                    openDatabase().then(function () {
                            try {
                                var transaction = db.transaction(["openIssues"], "readwrite");
                                var objectStore = transaction.objectStore("openIssues");
                                //Add a new issue
                                var request = objectStore.add(issueObj);

                                request.onerror = function (e) {
                                    console.log("Error", e.target.error.name);
                                    reject({
                                        state: false,
                                        Reason: e,
                                        Statement: 'Could not add the issue'
                                    })

                                };
                                request.onsuccess = function (e) {
                                    resolve("Added");
                                };
                                transaction.onerror = function (even) {
                                    reject({
                                        State: false,
                                        Resaon: transaction.error,
                                        Statement: "The issue getting transaction could not be completed."
                                    });
                                };
                            } catch (exception) {
                                reject({
                                    State: false,
                                    Resaon: exception,
                                    Statement: "The issue getting transaction could not be completed."
                                });

                            }
                        },
                        function (error) {
                            reject({
                                state: false,
                                Reason: error,
                                Statement: 'Could not open the database.'
                            });
                        });
                });
            },
            // function to get  issue details based on the id and type
            getIssue: function (id, type) {
                var openDatabase = this.openDatabase;
                return $q(function (resolve, reject) {
                    openDatabase().then(function () {
                            try {
                                var objStore = type === 'open' ? 'openIssues' : 'closedIssues';
                                var transaction = db.transaction([objStore], "readwrite");
                                var objectStore = transaction.objectStore(objStore);
                                //get the issue object from the DB based on the key
                                var request = objectStore.get(Number.parseInt(id));
                                request.onerror = function (event) {
                                    console.dir(event);
                                    console.log("Error getting the data");
                                    reject({
                                        State: 'false',
                                        Reason: event,
                                        Statement: 'The Db could not be opened.'
                                    });
                                };

                                request.onsuccess = function (event) {
                                    console.log(request.result);
                                    resolve(request.result)
                                };

                                transaction.onerror = function (even) {
                                    reject({
                                        State: false,
                                        Resaon: transaction.error,
                                        Statement: "The issue getting transaction could not be completed."
                                    });
                                };


                            } catch (exception) {
                                reject({
                                    State: false,
                                    Resaon: exception,
                                    Statement: "The issue getting transaction could not be completed."
                                });

                            }
                        },

                        function (error) {
                            reject({
                                state: false,
                                Reason: error,
                                Statement: 'Could not open the database.'
                            });
                        });
                });
            },
            // function to submit comments
            submitComment: function (id, commentObj) {
                var openDatabase = this.openDatabase;
                return $q(function (resolve, reject) {
                    openDatabase().then(function () {
                            try {
                                var objStore = 'openIssues';
                                var transaction = db.transaction([objStore], "readwrite");
                                var objectStore = transaction.objectStore(objStore);
                                var issueObject = {};
                                //get the issue object from the db
                                var request = objectStore.get(Number.parseInt(id));
                                request.onerror = function (event) {
                                    console.dir(event);
                                    console.log("Error getting the data");
                                    reject({
                                        State: 'false',
                                        Reason: event,
                                        Statement: 'The Db could not be opened.'
                                    });
                                };

                                request.onsuccess = function (event) {
                                    //after getting the object update object with the new data
                                    issueObject = request.result;
                                    issueObject.updDate = new Date().toISOString();
                                    issueObject.comments.push(commentObj);
                                    var transaction2 = db.transaction([objStore], "readwrite");
                                    var objectStore2 = transaction2.objectStore(objStore);
                                    var request2 = objectStore2.put(issueObject);

                                    request2.onerror = function (event) {
                                        console.log("Error getting the data");
                                        reject({
                                            State: 'false',
                                            Reason: event,
                                            Statement: 'The Db could not be opened.'
                                        });
                                    };

                                    request2.onsuccess = function (event) {
                                        resolve("Comment Added");
                                    };

                                    transaction2.onerror = function (even) {
                                        reject({
                                            State: false,
                                            Resaon: transaction2.error,
                                            Statement: "The issue getting transaction could not be completed."
                                        });
                                    };
                                };

                                transaction.onerror = function (even) {
                                    reject({
                                        State: false,
                                        Resaon: transaction.error,
                                        Statement: "The issue getting transaction could not be completed."
                                    });
                                };
                            } catch (exception) {
                                reject({
                                    State: false,
                                    Resaon: exception,
                                    Statement: "The issue getting transaction could not be completed."
                                });

                            }

                        },
                        function (error) {
                            reject({
                                state: false,
                                Reason: error,
                                Statement: 'Could not open the database.'
                            });
                        });
                });
            }
        }
    })
