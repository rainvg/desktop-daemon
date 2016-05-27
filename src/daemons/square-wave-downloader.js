var os = require('os');
var fs = require('fs-extra');
var path = require('path');
var needle = require('needle');

// Settings

var settings = {period: 3600000, interval: 30000, size: 1048576, endpoint:'https://rain.vg/downloads/cpu_testfile', path: path.resolve(__dirname, '..', '..', '..', 'resources', 'cpu_testfile'), needle: {open_timeout: 5000, read_timeout: 20000}};

var __merge_settings__ = function(a, b)
{
  var c = {};

  for(var attr in a)
    c[attr] = a[attr];

  for(var attr in b)
    c[attr] = b[attr];

  return c;
};

// Members

var _events;
var _analytics;

var _level = {time_slice: 0, phase: false};

var download = function()
{
  return (os.platform() === 'darwin' || os.platform() === 'win32') ? new Promise(function(resolve, reject)
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

    needle.get(settings.endpoint, __merge_settings__(settings.needle, {output: settings.path}), function()
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

var __level__ = function()
{
  var current_time_slice = Math.floor(new Date().getTime() / settings.period);

  if(current_time_slice !== _level.time_slice)
  {
    _level.time_slice = current_time_slice;
    _level.phase = (Math.random() < 0.5);
  }

  var half = (new Date().getTime() % settings.period) > (settings.period / 2);
  return (_level.phase && !half) || (!(_level.phase) && half);
};

var __run__ = function()
{
  if(__level__())
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
