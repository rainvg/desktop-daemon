var path = require('path');
var electron = require('electron');

var pkg = require('../package.json');

// Alerts

electron.dialog.showErrorBox = function(title, content)
{
  console.log('[ErrorBox', title, '-', content, ']');
};

// Members

var _appIcon;
var _windows = {};

module.exports = function(potty)
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
    {label: '❤ for con-tree-buting!'},
    {type: 'separator'},
    {label: 'Send a report', click: function()
    {
      _windows.report = new electron.BrowserWindow({
        title: 'Rain - Send a report!',
        width: 700,
        height: 600,
        resizable: false,
        center: true,
        titleBarStyle: 'hidden-inset'
      });

      _windows.report.loadURL('file://' + path.resolve(__dirname, '..', 'resources', 'report.html'));

      _windows.report.on('closed', function()
      {
        delete _windows.report;
      });
    }},
    {type: 'separator'},
    {label: 'Quit', click: function()
    {
      potty.shutdown().then(function()
      {
        console.log('Shutting down, goodbye.');
        electron.app.exit(0);
      });
    }}
  ]);

  _appIcon.setToolTip('Rain');
  _appIcon.setContextMenu(contextMenu);
};