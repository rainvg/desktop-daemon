'use strict';

const shell = require('electron').shell;

// Get os and architecture and set download url consistently
angular.module('update-available', ['ngMaterial']).controller('downloadController', function($scope)
{
  $scope.download = function()
  {
    shell.openExternal('https://docs.angularjs.org/api/ng/directive/ngController');
    window.close();
  };
});
