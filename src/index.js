var path = require('path');
var electron = require('electron');

var daemons = require('./daemons.js');
var update = require('./update.js');
var tray = require('./tray.js');

var pkg = require('../package.json');

var pkg = require(path.resolve(__dirname, '..', 'package.json'));

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

  tray(_potty);
  update(_potty);

  daemons(_potty.id, pkg.version);
};
