var autolaunch = require('auto-launch');
var fs = require('fs-extra');
var os = require('os');
var path = require('path');
var registry = require('winreg');

function __run__()
{
  'use strict';

  var login_item = new autolaunch({
    name: 'Rain',
    isHidden: true
  });

  login_item.isEnabled().then(function(enabled)
  {
    if(enabled) return;
    login_item.enable();
  });
}

function __clean__()
{
  'use strict';

  if(os.platform() === 'darwin')
  {
    var plist = path.resolve(os.homedir(), 'Library', 'LaunchAgents', 'vg.rain.osx.plist');
    if(fs.existsSync(plist))
      fs.remove(plist);
  }
  else if(os.platform() === 'win32')
  {
    var registry_entry = new registry({
      hive: registry.HKCU,
      key: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders'
    });

    registry_entry.values(function(error, items)
    {
      if(!error)
      {
        for (var i=0; i < items.length; i++)
        {
          if(items[i].name === 'Startup')
          {
            var rain_link = path.join(items[i].value, 'Rain.lnk');
            if(fs.existsSync(rain_link))
              fs.remove(rain_link);
          }
        }
      }
    });
  }
  else if(os.platform() === 'linux')
  {
    var upstart = path.resolve(os.homedir(), 'config', 'upstart', 'rain.conf');
    if(fs.existsSync(upstart))
      fs.remove(upstart);
  }
}

module.exports = function autostart()
{
  'use strict';

  __run__();
  __clean__();
};
