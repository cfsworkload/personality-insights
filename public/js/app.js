// Copyright (c) 2016 IBM Corp. All rights reserved.
// Use of this source code is governed by the Apache License,
// Version 2.0, a copy of which can be found in the LICENSE file.

// listen for request sent over XHR and automatically show/hide spinner
(function () {
  angular.module('ngLoadingSpinner', ['angularSpinners', 'angular-clipboard', '720kb.socialshare', 'ui-notification' ])
    .config(function(NotificationProvider) {
      NotificationProvider.setOptions({
        positionX: 'center',
        positionY: 'top'
      });
    })
    .directive('spinner', ['$http', 'spinnerService', function ($http, spinnerService) {
      return {
        link: function (scope, elm, attrs) {
          scope.isLoading = function () {
            return $http.pendingRequests.length > 0;
          };
          scope.$watch(scope.isLoading, function (loading) {
            if (loading) {
              spinnerService.show('spinner');
            } else {
              spinnerService.hide('spinner');
            }
          });
        }
      };
    }]);
}).call(this);

// angular app initialization
var app = angular.module('app', ['ngNumeraljs', 'ngLoadingSpinner']);

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})
