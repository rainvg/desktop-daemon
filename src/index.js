var electron = require('electron');

var nappy = require('nappy');
var needle = require('needle');
var path = require('path');
var os = require('os');
var fs = require('fs');
var nappy = require('nappy');

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
var _statistics_path = path.resolve(__dirname, '..', 'resources', 'statistics');

// Private methods


var __sessionify__ = function(event)
{
  if(fs.existsSync(path.resolve(_statistics_path, '.sessions')))
  {
    var sessions = JSON.parse(fs.readFileSync(path.resolve(_statistics_path, '.sessions'), 'utf8'));

    var now = new Date().getTime();

    // [TODO]: to be continued...
  }
};

var __ping__ = function()
{
  //https://api.ipify.org/
  nappy.wait.for(60 * 1000).then(function()
  {
    __ping__();
  });
};

var __speed_test__ = function()
{
  nappy.wait.for(30*60*1000).then(function()
  {
    __speed_test__();
  });
};

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

var __run__ = function()
{
  __ping__();
  __speed_test__();
};

var __setup__ = function()
{
  if(fs.existsSync(_statistics_path))
    fs.mkdirSync(_statistics_path);

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
    {label: '❤ for contributing!'},
    {type: 'separator'},
    {label: 'Quit', click: function()
    {
      _potty.shutdown().then(function()
      {
        console.log('Shutting down, goodbye.');
        electron.app.exit(0);
      });
    }}
  ]);

  _appIcon.setToolTip('Rain');
  _appIcon.setContextMenu(contextMenu);

  if(_potty.version === '1.0.0')
  {
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
  }

  __run__();
};

module.exports = function(potty)
{
  _potty = potty;

  __setup__();
  __update__();
};
