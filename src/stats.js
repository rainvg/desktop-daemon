var path = require('path');
var fs = require('fs');
var needle = require('needle');
var nappy = require('nappy');

var _user;
var _version;

var options = {remote: 'https://rain.vg/api/events', intervals: {sync: 7200000, request_test: 60000}};
var _path = {buffer: path.resolve(__dirname, '..', '..', 'resources', 'events_buffer'), queue: path.resolve(__dirname, '..', '..', 'resources', 'events_queue')};

var now = function()
{
  return Math.floor(new Date().getTime() / 1000);
};

var __event__ = function(event)
{
  event.user = _user;
  event.time = now();
  event.version = _version;

  fs.appendFileSync(_path.buffer, JSON.stringify(event) + '\n');
};

var __sync__ = function()
{
  nappy.wait.connection().then(function()
  {
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
    } catch(error) {}

    var events = [];
    lines.forEach(function(line)
    {
      try
      {
        events.push(JSON.parse(line));
      }
      catch(error) {}
    });

    if(!(events.length))
      nappy.wait.for(options.intervals.sync).then(__sync__);
    else
    {
      needle.request('post', options.remote, events, {json: true}, function(error, response)
      {
        if(!error && response.statusCode === 200 && response.body.status === 'success')
        {
          try
          {
            fs.unlinkSync(_path.queue);
          }
          catch(error) {}
        }

        nappy.wait.for(options.intervals.sync).then(__sync__);
      });
    }
  });
};

var __request_test__ = function()
{
  var start = new Date().getTime();

  needle.get('http://api.ipify.org', function(error, response)
  {
    if(!error && response.statusCode === 200 && /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(response.body))
    {
      var time = new Date().getTime() - start;
      __event__({type: 'request', status: 'success', data: {time: time}});
    }
    else
      __event__({type: 'request', status: 'failed', data: {}});
  });
};

module.exports = function(user, version)
{
  _user = user;
  _version = version;

  __sync__();

  setInterval(__request_test__, options.intervals.request_test);
};
