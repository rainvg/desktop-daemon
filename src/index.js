var potty = require(process.env.POTTY).app;
var electron = require('electron');

var nappy = require('nappy');
var request = require('request');
var path = require('path');

var version = require(path.resolve(__dirname, '..', 'package.json')).version;

var settings = {update: {interval: 300000}};

function __update__()
{
  'use strict';

  nappy.wait.connection().then(function()
  {
    request('https://rain.vg/releases/desktop/' + process.platform + '-' + process.arch + '/package', function(error, response, body)
    {
      if(!error && response.statusCode === 200 && JSON.parse(body).version !== version)
      {
        potty.update().then(function()
        {
          electron.app.exit(0);
        });
      }

      nappy.wait.for(settings.update.interval).then(__update__);
    });
  });
}

potty.setup().then(function()
{
  'use strict';

  nappy.wait.for(settings.update.interval).then(__update__);
});

var appIcon = null;

electron.app.on('ready', function()
{
  'use strict';

  appIcon = new electron.Tray(path.resolve(__dirname, '..', 'resources', 'logo.png'));
  var contextMenu = electron.Menu.buildFromTemplate([
    {label: 'Rain version ' + version},
    {type: 'separator'},
    {label: '❤ for contributing!'}
  ]);
  appIcon.setToolTip('Rain');
  appIcon.setContextMenu(contextMenu);
});
