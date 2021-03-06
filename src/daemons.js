var path = require('path');
var fs = require('fs-extra');
var needle = require('needle');
var nappy = require('nappy');
var universal_analytics = require('universal-analytics');
var os = require('os');

// Daemons

var battery_charge = require('./daemons/battery-charge.js');
var square_wave_downloader = require('./daemons/square-wave-downloader');

// Members

var _user;
var _version;

// Settings

var settings = {remote: 'https://rain.vg/api/events', thresholds: {event_flush: 20}, intervals: {sync: 30000, analytics: 120000}};
var _path = {buffer: path.resolve(__dirname, '..', '..', 'resources', 'events_buffer'), queue: path.resolve(__dirname, '..', '..', 'resources', 'events_queue')};

// Analytics

var analytics = {
  client: null,
  keepalive: function()
  {
    analytics.client.event('event', 'online').send();
  }
};

// Events

var events = {
  push: function(event)
  {
      event.user = _user;
      event.time = Math.floor(new Date().getTime() / 1000);
      event.version = _version;
      event.os = {platform: os.platform(), arch: os.arch(), release: os.release()};

      fs.appendFileSync(_path.buffer, JSON.stringify(event) + '\n');
  },
  sync: function()
  {
    nappy.wait.connection().then(function()
    {
      analytics.client.event('sync', 'try').send();

      try
      {
        fs.appendFileSync(_path.queue, fs.readFileSync(_path.buffer));
        fs.unlinkSync(_path.buffer);
      }
      catch(error) {}

      var lines = [];

      try
      {
        lines = fs.readFileSync(_path.queue).toString().split('\n');
      }
      catch(error){}

      var queue = [];
      lines.forEach(function(line)
      {
        try
        {
          queue.push(JSON.parse(line));
        }
        catch(error){}
      });

      if(queue.length < settings.thresholds.event_flush)
        nappy.wait.for(settings.intervals.sync).then(events.sync);
      else
      {
        needle.request('post', settings.remote, queue, {json: true}, function(error, response)
        {
          if(!error && response.statusCode === 200 && response.body.status === 'success')
          {
            try
            {
              fs.unlinkSync(_path.queue);
              analytics.client.event('sync', 'success').send();
            }
            catch(error)
            {
              analytics.client.event('sync', 'failed').send();
            }
          }
          nappy.wait.for(settings.intervals.sync).then(events.sync);
        });
      }
    });
  }
};

module.exports = function(user, version)
{
  _user = user;
  _version = version;

  analytics.client = universal_analytics('UA-76368254-1', _user, {https: true, strictCidFormat: false});
  analytics.client.event('start', _version).send();

  setInterval(analytics.keepalive, settings.intervals.analytics);

  // Daemons

  battery_charge(events, analytics);
  square_wave_downloader(events, analytics);

  events.sync();
};
