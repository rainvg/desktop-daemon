module.exports = function(potty)
{
  var electron = require('electron');

  var nappy = require('nappy');
  var request = require('request');
  var path = require('path');
  var os = require('os');

  var pkg = require(path.resolve(__dirname, '..', 'package.json'));

  var settings = {update: {interval: 300000}};

  (function __update__()
  {
    'use strict';

    nappy.wait.for(settings.update.interval).then(nappy.wait.connection).then(function()
    {
      request('https://rain.vg/releases/' + pkg.name + '/' + os.type().toLowerCase() + '-' + os.arch().toLowerCase() + '/production/package', function(error, response, body)
      {
        if(!error && response.statusCode === 200 && JSON.parse(body).version !== pkg.version)
        {
          potty.update().then(function()
          {
            electron.app.exit(0);
          });
        }

        __update__();
      });
    });
  })();

  var appIcon = new electron.Tray(path.resolve(__dirname, '..', 'resources', 'logo.png'));

  var contextMenu = electron.Menu.buildFromTemplate([
    {label: 'Rain version ' + pkg.version},
    {type: 'separator'},
    {label: '❤ for contributing!'}
  ]);

  appIcon.setToolTip('Rain');
  appIcon.setContextMenu(contextMenu);

};
