var db, setUp = false,
    shouldInit = false;
angular.module('doSelectApp.services', [])
    .factory('issueService', function ($q) {
        return {
            openDatabase: function () {
                return $q(function (resolve, reject) {
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
                        shouldInit = true;
                        //Create ObjectStores For Issues 

                        if (!thisDb.objectStoreNames.contains("openIssues")) {
                            objectStore = thisDb.createObjectStore("openIssues", {
                                keyPath: "id",
                                autoIncrement: true
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
                            objectStore.createIndex("closedIssueTitle", "title", {
                                unique: false
                            });


                        }


                    };

                    openRequest.onsuccess = function (e) {
                        db = e.target.result;
                        db.onerror = function (event) {
                            // Generic error handler for all errors targeted at this database's
                            // requests!
                            reject("Database error: " + event.target.errorCode);
                        };

                        setUp = true;
                        resolve(true);
                    }
                });

            },
            setupIndexedDb: function (parameters) {
                return $q(function (resolve, reject) {

                    if (shouldInit) {
                        var transaction, store;
                        transaction = db.transaction(["openIssues"], "readwrite");
                        store = transaction.objectStore("openIssues");

                        setupJSON.openIssues.forEach(function (item) {
                            console.log(item);
                            var request = store.add(item);

                            request.onerror = function (e) {
                                console.log("Error", e.target.error.name);
                                //some type of error handler
                            }

                            request.onsuccess = function (e) {
                                console.log("Woot! Did it");
                            }
                        });

                        transaction = db.transaction(["closedIssues"], "readwrite");
                        store = transaction.objectStore("closedIssues");

                        setupJSON.closedIssues.forEach(function (item) {
                            console.log(item);
                            var request = store.add(item);

                            request.onerror = function (e) {
                                console.log("Error", e.target.error.name);
                                //some type of error handler
                            }

                            request.onsuccess = function (e) {
                                console.log("Woot! Did it");
                            }
                        });
                        shouldInit = false;
                        resolve("SETUP COMPLETE");
                    } else {
                        shouldInit = false;
                        resolve("SETUP NOT NEEDED");
                    }

                    //Perform the add
                })
            },
            getOpenIssues: function () {
                var openIssues = [];
                return $q(function (resolve, reject) {
                    var transaction = db.transaction(["openIssues"], "readonly");
                    var objectStore = transaction.objectStore("openIssues");


                    objectStore.openCursor().onsuccess = function (e) {
                        var cursor = e.target.result;
                        if (cursor) {
                            cursor.value["key"] = cursor.key;
                            openIssues.push(cursor.value);
                            cursor.continue();

                        }
                    };
                    transaction.oncomplete = function (event) {
                        resolve(openIssues);
                    };
                });
            },
            getClosedIssues: function () {
                var closedIssues = [];
                return $q(function (resolve, reject) {

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
                });
            },
            addIssue: function (issueObj) {
                var openDatabase = this.openDatabase;
                return $q(function (resolve, reject) {
                    openDatabase().then(function () {

                        var transaction = db.transaction(["openIssues"], "readwrite");
                        var objectStore = transaction.objectStore("openIssues");

                        var request = objectStore.add(issueObj);


                        request.onerror = function (e) {
                            console.log("Error", e.target.error.name);
                            reject({
                                state: false,
                                Reason: e,
                                Statement: 'Could not add the issue'
                            })
                            //some type of error handler
                        }

                        request.onsuccess = function (e) {
                            resolve("Added");
                        }
                    }, function (error) {
                        reject({
                            state: false,
                            Reason: error,
                            Statement: 'Could not open the database.'
                        });
                    })
                });
            }
        }
    })
