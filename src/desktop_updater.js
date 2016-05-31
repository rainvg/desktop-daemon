var os = require('os');
var path = require('path');
var nappy = require('nappy');
var needle = require('needle');
var mac_notification = require('node-mac-notifier');
var notifier = require('node-notifier');
var open_url = require('open');

// Settings

var settings = {update: {interval: 6 * 3600 * 1000}};

// Members

var _potty;

var __check__ = function()
{
  'use strict';

  return new Promise(function(resolve)
  {
    needle.get('https://rain.vg/api/desktop/version', function(error, response)
    {
      if(!error && response.statusCode === 200 && response.body !== _potty.version.main)
      {
        if(os.platform() === 'darwin')
        {
          var noti = new mac_notification('Update available!', {body: 'New Rain version available! Click here to update now'});
          noti.addEventListener('click', function()
          {
            open_url('https://rain.vg/download.html');
          });
        }
        else
        {
          notifier.notify({
            title: 'Update available!',
            message: 'New Rain version available! Click here to update now',
            icon: path.resolve(__dirname, '..', 'resources', 'logo100.png'),
            sound: true,
            wait: true
          }, function ()
          {
            resolve();
          });

          notifier.on('click', function ()
          {
            open_url('https://rain.vg/download.html');
          });
        }
      }

      resolve();
    });
  });
};

var __updater__ = function()
{
  'use strict';
  nappy.wait.for(settings.update.interval).then(nappy.wait.connection).then(function()
  {
    __check__().then(__updater__);
  });
};

module.exports = function(potty)
{
  'use strict';

  _potty = potty;
  __check__();
  __updater__();
};
