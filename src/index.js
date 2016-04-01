var electron = require('electron');

var nappy = require('nappy');
var needle = require('needle');
var path = require('path');
var os = require('os');

var pkg = require(path.resolve(__dirname, '..', 'package.json'));

// Settings

var settings = {update: {interval: 300000}};

// Members

var _potty;
var _appIcon;

// Private methods

var __update__ = function()
{
  'use strict';

  nappy.wait.for(settings.update.interval).then(nappy.wait.connection).then(function()
  {
    needle.get('https://rain.vg/releases/' + pkg.name + '/' + os.type().toLowerCase() + '-' + os.arch().toLowerCase() + '/production/package', function(error, response)
    {
      if(!error && response.statusCode === 200 && JSON.parse(response.body).version !== pkg.version)
      {
        _potty.update().then(function()
        {
          electron.app.exit(0);
        });
      }

      __update__();
    });
  });
};

var __setup__ = function()
{
  _appIcon = new electron.Tray(path.resolve(__dirname, '..', 'resources', 'logo.png'));

  var contextMenu = electron.Menu.buildFromTemplate([
    {label: 'Rain version ' + pkg.version},
    {type: 'separator'},
    {label: '❤ for contributing!'}
  ]);

  _appIcon.setToolTip('Rain');
  _appIcon.setContextMenu(contextMenu);
};

module.exports = function(potty)
{
  _potty = potty;

  __setup__();
  __update__();
};
