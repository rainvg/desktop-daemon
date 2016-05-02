var child_process = require('child_process');
var os = require('os');
var fs = require('fs-extra');
var path = require('path');
// Settings

var settings = {period: 3600000, interval: 60000, size: 1048576, endpoint:'https://rain.vg/downloads/cpu_testfile', path: path.resolve(__dirname, '..', '..', '..', 'resources', 'cpu_testfile')};

// Members

var _events;
var _analytics;

var download = function()
{
  return os.platform() === 'darwin' ? new Promise(function(resolve, reject)
  {
    try
    {
      fs.unlinkSync(settings.path);
    } catch(error){}

    try
    {
      fs.statSync(settings.path);
      reject();
      return;
    } catch(error){}

    child_process.exec('curl -o ' + settings.path + ' ' + settings.endpoint, function()
    {
      try
      {
        if(fs.statSync(settings.path).size === settings.size)
          resolve();
        else
          reject();
      } catch(error)
      {
        reject();
      }
    });
  }) : Promise.reject();
};

var __run__ = function()
{
  var level = (new Date().getTime() % settings.period) > (settings.period / 2);

  if(level)
    download().then(function()
    {
      _events.push({type: 'square-wave-downloader'});
      _analytics.client.event('square-wave-downloader', 'success').send();
    });
};

module.exports = function energy(events, analytics)
{
  _events = events;
  _analytics = analytics;

  setInterval(__run__, settings.interval);
};
