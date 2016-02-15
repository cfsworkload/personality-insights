// Copyright (c) 2016 IBM Corp. All rights reserved.
// Use of this source code is governed by the Apache License,
// Version 2.0, a copy of which can be found in the LICENSE file.

(function () {
  angular.module('app')
    .service('searchService', ['$http', '$q', searchService]);

  function searchService($http, $q) {
    var data = {
      selectedTweet: {}
    };

    return {
      setSelectedTweet: function (tweet) {
        date.selectedTweet = tweet;
      },
      getData: function () {
        return data;
      },
      search: function (queryString, countOnly, trackToQueryFrom) {
        console.log("Query string:", queryString);
        var deferred = $q.defer();
        
        var prefix;
        if (trackToQueryFrom == "Decahose" || trackToQueryFrom == null) {
          prefix = "/api/twitter";
        } else {
          prefix = "/api/twitter/tracks/" + trackToQueryFrom;
        }
        var method = countOnly ? "count" : "search";
        $http.get(prefix + "/messages/" + method + "?q=" + encodeURIComponent(queryString)).success(function (data) {
          deferred.resolve(data);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      },
      getTracks: function () {
        var deferred = $q.defer();
        $http.get("/api/twitter/tracks").success(function (data) {
          deferred.resolve(data);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      }
    };
  }

})();
