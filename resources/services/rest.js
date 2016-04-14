'use strict';

angular.module('remote', []).service('rest',['$http', function($http)
{
  var enpoint = 'https://rain.vg/api/report';
  var rest = {};

  rest.post_report = function(report)
  {
    return $http.post(enpoint, report);
  };

  return rest;
}]);
