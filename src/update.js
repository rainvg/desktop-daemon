var os = require('os');
var path = require('path');
var nappy = require('nappy');
var needle = require('needle');
var electron = require('electron');

var pkg = require(path.resolve(__dirname, '..', 'package.json'));

// Settings

var settings = {update: {interval: 300000}};

// Members

var _potty;

var __update__ = function()
{
  'use strict';

  nappy.wait.for(settings.update.interval).then(nappy.wait.connection).then(function()
  {
    needle.get('https://rain.vg/releases/' + pkg.name + '/' + os.type().toLowerCase() + '-' + os.arch().toLowerCase() + '/' + pkg.scheme + '/package', function(error, response)
    {
      if(!error && response.statusCode === 200 && JSON.parse(response.body.toString()).version !== pkg.version)
      {
        console.log('Update available.');
        _potty.update().then(function()
        {
          electron.app.exit(0);
        });
      }

      __update__();
    });
  });
};

module.exports = function(potty)
{
  _potty = potty;
  __update__();
};
