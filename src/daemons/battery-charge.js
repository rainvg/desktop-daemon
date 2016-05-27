var child_process = require('child_process');
var os = require('os');
var nappy = require('nappy');
var fs = require('fs-extra');

// Settings

var settings = {interval: 30000};

// Members

var _events;
var _analytics;

var charge = function()
{
  if(os.platform() === 'darwin')
  {
    return new Promise(function(resolve, reject)
    {
      _analytics.client.event('battery-charge', 'try').send();
      child_process.exec('system_profiler SPPowerDataType', function(error, stdout)
      {
        var output = stdout.toString();

        if(error)
        {
          reject();
          return;
        }

        try
        {
          var charge = parseInt(/\d+/.exec(/\s*Charge\ Remaining\ \(mAh\):\s*\d+/.exec(output)[0])[0], 10);
          var voltage = parseInt(/\d+/.exec(/\s*Voltage\ \(mV\):\s*\d+/.exec(output)[0])[0]);
          var discharging = /\s*Connected:\sNo/.test(output);

          if(discharging)
            resolve(charge * voltage / 1000000);
          else
            reject();
        } catch(err){reject();}
      });
    });
  }
  else if(os.platform() === 'win32' && os.release().split('.')[0] > 6 || (os.release().split('.')[0] === 6 && os.release().split('.')[1] >= 2))
  {
    return new Promise(function(resolve, reject)
    {
      child_process.exec('cd ' + os.tmpdir() + ' & powercfg /batteryreport', function(error, stdout)
      {
        var output = stdout.toString();

        if(error)
        {
          reject();
          return;
        }

        try
        {
          var reportfile = /C:.*html/.exec(output)[0];
          var report = /Report\ generated[\s\S]*?mWh/.exec(fs.readFileSync(reportfile).toString())[0];

          var wh =  parseInt(/\d+/.exec(/mw[\s\S]*\d+/.exec(report)[0])[0]);
          var battery = /Battery/.test(report);

          if(battery)
            resolve(wh);
          else
            reject();
        } catch(err){reject();}
      });
  });
  }
  return Promise.reject();
};

var __run__ = function()
{
  nappy.wait.for(settings.interval).then(charge).then(function(charge)
  {
    _events.push({type: 'battery-charge', data: {charge: charge}});
    _analytics.client.event('battery-charge', 'success').send();
    __run__();
  }).catch(__run__);
};

module.exports = function energy(events, analytics)
{
  _events = events;
  _analytics = analytics;

  __run__();
};
