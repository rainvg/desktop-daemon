'use strict';

var shell = require('electron').shell;
var desktop_daemon = require('electron').remote;

angular.module('update', ['ngMaterial', 'remote']).controller('downloadController', ['$scope', 'rest', function($scope, rest)
{
  this.check_for_update = function()
  {
    rest.get_desktop_version().then(function(response)
    {
      var remote_desktop_version = response.data;
      if(desktop_daemon.getGlobal('desktop_version') !== remote_desktop_version)
        $scope.update_available = true;
      else
        $scope.update_available = false;

      $scope.ready = true;
    });
  };

  $scope.ready = false;

  $scope.download = function()
  {
    shell.openExternal('https://rain.vg/download.html');
    window.close();
  };

  setTimeout(this.check_for_update, 1500);
}]);
