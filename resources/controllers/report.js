'use strict';

var fs = require('fs-extra');
var path = require('path');

angular.module('report', ['ngMaterial', 'remote']).controller('reportController', ['$scope', 'rest', function($scope, $rest)
{
  $scope.report = {};
  $scope.sent = false;

  $scope.platform = process.platform;

  function __create_logs_report__(directory)
  {
    return new Promise(function(resolve, reject)
    {
      var _report_logs = [];

      try
      {
        var _filenames = fs.readdirSync(directory);
        for(var i = 0; i < _filenames.length; i++)
        {
          if(!isNaN(_filenames[i]))
          {
            var _log = fs.readFileSync(path.resolve(directory, _filenames[i]), 'utf-8');
            _report_logs.push({'timestamp': _filenames[i], 'content':_log});
          }
        }

        resolve(_report_logs);
      }
      catch(error)
      {
        reject(error);
      }
    });
  }

  $scope.send = function()
  {
    var _log_path = path.resolve(__dirname, '..', '..', 'logs');
    __create_logs_report__(_log_path).then(function(logs)
    {
      var _report = {
        'reporter': $scope.report.reporter,
        'os': {
          'platform': process.platform,
          'architecture': process.arch,
          'node_version': process.version
        },
        'description': $scope.report.description,
        'logs': logs
      };

      $rest.post_report(_report).success(function()
      {
        $scope.sent = true;
        fs.remove(_log_path, function(error)
        {
          if(!error)
          {
            fs.mkdirSync(_log_path);
            setTimeout(window.close, 3000);
          }
          else
            console.log('An error occurred');
        });
      }).error(function(error)
      {
        console.log('An error occured', error);
      });
    }).catch(function(error)
    {
      console.log('An error occured', error);
    });
  };
}]);
