var electron = require('electron');

var nappy = require('nappy');
var needle = require('needle');
var path = require('path');
var os = require('os');
//var notifier = require('node-notifier');

var pkg = require(path.resolve(__dirname, '..', 'package.json'));

electron.dialog.showErrorBox = function(title, content)
{
  console.log('[ErrorBox', title, '-', content, ']');
};

// Settings

var settings = {update: {interval: 300000}};

// Members

var _potty;
var _appIcon;
var _windows = {};

// Private methods

/*
var __notify_update__ = function()
{
  notifier.notify({
    title: 'Rain',
    message: 'New update available',
    icon: path.resolve(__dirname, '..', 'resources', 'logo@5x.png'),
    wait: true
  });
};
*/

var __update__ = function()
{
  'use strict';

  nappy.wait.for(settings.update.interval).then(nappy.wait.connection).then(function()
  {
    needle.get('https://rain.vg/releases/' + pkg.name + '/' + os.type().toLowerCase() + '-' + os.arch().toLowerCase() + '/development/package', function(error, response)
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
  electron.app.on('window-all-closed', function()
  {
    if(process.platform === 'darwin')
      electron.app.dock.hide();
  });

  electron.app.on('will-quit', function(event)
  {
    event.preventDefault();

    if(process.platform === 'darwin')
      electron.app.dock.hide();
  });

  _appIcon = new electron.Tray(path.resolve(__dirname, '..', 'resources', 'logo.png'));

  var contextMenu = electron.Menu.buildFromTemplate([
    {label: 'Rain version ' + pkg.version},
    {type: 'separator'},
    {label: 'Quit', click: function()
    {
      _potty.shutdown().then(function()
      {
        console.log('Shutting down, goodbye.');
        electron.app.exit(0);
      });
    }},
    {type: 'separator'},
    {label: '❤ for contributing!'}
  ]);

  _appIcon.setToolTip('Rain');
  _appIcon.setContextMenu(contextMenu);

  if(_potty.version === '1.0.0')
  {
    /*
    notifier.on('click', function ()
    {
    });
    */

    _windows.update = new electron.BrowserWindow({
      title: 'Rain - Update available!',
      width: 615,
      height: 458,
      resizable: false,
      center: true,
      titleBarStyle: 'hidden-inset'
    });
    _windows.update.loadURL('file://' + path.resolve(__dirname, '..', 'resources', 'update.html'));

    _windows.update.on('closed', function()
    {
      delete _windows.update;
    });

    /*
    notifier.on('timeout', function ()
    {
      nappy.wait.for(1000 * 60 * 10).then(function()
      {
        __notify_update__();
      });
    });

    __notify_update__();
    */
  }
};

module.exports = function(potty)
{
  _potty = potty;

  __setup__();
  __update__();
};
