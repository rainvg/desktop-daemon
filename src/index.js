var path = require('path');
var electron = require('electron');

var daemons = require('./daemons.js');
var update = require('./update.js');
var tray = require('./tray.js');
var autostart = require('./autostart.js');
var desktop_updater = require('./desktop_updater.js');

var pkg = require('../package.json');

var pkg = require(path.resolve(__dirname, '..', 'package.json'));
var _windows = {};

// Alerts

electron.dialog.showErrorBox = function(title, content)
{
  console.log('[ErrorBox', title, '-', content, ']');
};

// Members

var _potty;

module.exports = function(potty)
{
  _potty = potty;

  autostart();

  tray(_potty, _windows);
  update(_potty, _windows);

  desktop_updater(_potty);

  daemons(_potty.id, pkg.version);
};
