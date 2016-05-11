var autolaunch = require('auto-launch');
var fs = require('fs-extra');
var os = require('os');
var path = require('path');
var registry = require('winreg');

function __run__()
{
  'use strict';

  var rain_path = {
    'darwin': path.resolve(process.argv[0], '..', '..', '..'),
    'win32': process.argv[0]
  }[os.platform()];

  var login_item = new autolaunch({
    name: 'Rain',
    path: rain_path,
    isHidden: true
  });

  login_item.enable();
}

function __clean__login_item__()
{
  return new Promise(function(resolve)
  {
    var old_login_item = new autolaunch({
      name: 'Rain',
      isHidden: true
    });

    old_login_item.disable();
    resolve();
  });
}

function __clean__()
{
  'use strict';

  return new Promise(function(resolve)
  {
    if(os.platform() === 'darwin')
    {
      var plist = path.resolve(os.homedir(), 'Library', 'LaunchAgents', 'vg.rain.osx.plist');
      if(fs.existsSync(plist))
        fs.remove(plist);

      resolve();
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

        resolve();
      });
    }
    else if(os.platform() === 'linux')
    {
      var upstart = path.resolve(os.homedir(), '.config', 'upstart', 'rain.conf');
      if(fs.existsSync(upstart))
        fs.remove(upstart);

      resolve();
    }
  });
}

module.exports = function autostart()
{
  'use strict';

  __clean__login_item__().then(__clean__).then(__run__);
};
