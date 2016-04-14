'use strict';

var electron = require('electron');
var path = require('path');

electron.dialog.showErrorBox = function(title, content)
{
  console.log('[ErrorBox', title, '-', content, ']');
};

var _windows = {};


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

electron.app.on('ready', function()
{
  _windows.update = new electron.BrowserWindow({
      title: 'Rain - Update available!',
      width: 700,
      height: 600,
      resizable: false,
      center: true,
      titleBarStyle: 'hidden-inset'
    });

  _windows.update.loadURL('file://' + path.resolve(__dirname, '..', 'resources', 'report.html'));

  _windows.update.on('closed', function()
  {
    delete _windows.update;
  });
});
