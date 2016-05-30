'use strict';

angular.module('remote', []).service('rest',['$http', function($http)
{
  var endpoints = {
    'report': 'https://rain.vg/api/report',
    'desktop_version': 'https://rain.vg/api/desktop/version'
  }

  var rest = {};

  rest.post_report = function(report)
  {
    return $http.post(endpoints.report, report);
  };

  rest.get_desktop_version = function()
  {
    return $http.get(endpoints.desktop_version);
  };

  return rest;
}]);
