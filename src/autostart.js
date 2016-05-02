var autolaunch = require('auto-launch');
var fs = require('fs-extra');
var os = require('os');
var path = require('path');

function __run__()
{
  'use strict';

  var login_item = new autolaunch({
    name: 'Rain',
    isHidden: true
  });

  login_item.isEnabled().then(function(enabled)
  {
    console.log(enabled);
    if(enabled) return;
    login_item.enable();
  });

  if(os.platform() === 'darwin')
  {
    // LaunchAgent fix

    var plist = path.resolve(os.homedir(), 'Library', 'LaunchAgents', 'vg.rain.osx.plist');
    if(fs.existsSync(plist))
      fs.remove(plist);
  }
}

module.exports = function autostart()
{
  'use strict';

  __run__();
};
