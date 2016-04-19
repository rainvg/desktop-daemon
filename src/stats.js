var path = require('path');
var fs = require('fs');
var needle = require('needle');
var nappy = require('nappy');
var network = require('network');
var arp = require('node-arp');
var speedtest = require('speedtest-net');
var analytics = require('universal-analytics');
var web_socket = require('ws');

var _user;
var _version;
var _usage;

var options = {remote: 'https://rain.vg/api/events', thresholds: {event_flush: 20}, intervals: {sync: 30000, request_test: 60000, speed_test: 3600000, ws_test: 30000, analytics: 120000}};
var endpoints = {ws: {remote: 'https://rain.vg/api/ws/remote'}};
var _path = {buffer: path.resolve(__dirname, '..', '..', 'resources', 'events_buffer'), queue: path.resolve(__dirname, '..', '..', 'resources', 'events_queue')};

var now = function()
{
  return Math.floor(new Date().getTime() / 1000);
};

var __get_gateway_mac__ = function()
{
  return new Promise(function(resolve)
  {
    network.get_gateway_ip(function(err, ip)
    {
      if(err)
        resolve();
      else
        arp.getMAC(ip, function(err, mac)
        {
          if(err)
            resolve();

          resolve(mac);
        });
    });
  });
};

var __event__ = function(event)
{
  __get_gateway_mac__().then(function(mac)
  {
    event.user = _user;
    if(mac) event.mac = mac;
    event.time = now();
    event.version = _version;

    fs.appendFileSync(_path.buffer, JSON.stringify(event) + '\n');
  });
};

var __sync__ = function()
{
  nappy.wait.connection().then(function()
  {
    _usage.event('sync', 'try').send();
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

    var events = [];
    lines.forEach(function(line)
    {
      try
      {
        events.push(JSON.parse(line));
      }
      catch(error){}
    });

    if(events.length < options.thresholds.event_flush)
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
            _usage.event('sync', 'success').send();
          }
          catch(error)
          {
            _usage.event('sync', 'failed').send();
          }
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
      __event__({type: 'request', status: 'success', public_ip: response.body, data: {time: time}});
      _usage.event('request', 'success').send();
    }
    else
      __event__({type: 'request', status: 'failed'});
  });
};

var __speed_test__ = function()
{
  var test = speedtest({maxTime: 5000});

  _usage.event('speed_test', 'try').send();

  test.on('data', function(data)
  {
    test.removeAllListeners('data');
    test.on('data', function(){});

    __event__({type: 'speed', status: 'success', data: data});
    _usage.event('speed_test', 'success').send();
  });

  test.on('error', function()
  {
    test.removeAllListeners('error');
    test.on('error', function(){});

    __event__({type: 'speed', status: 'failed'});
    _usage.event('speed_test', 'failed').send();
  });
};

var __analytics_ack__ = function()
{
  _usage.event('event', 'new').send();
};

var __ws_test__ = function()
{
  _usage.event('ws', 'try').send();
  needle.get(endpoints.ws.remote, {json: true}, function(error, response)
  {
    if(!error && response.statusCode === 200)
    {
      var server = response.body;
      var ws  = new web_socket('ws://' + server.ip + ':7000');

      var time = {start: new Date().getTime()};

      ws.on('open', function()
      {
        time.connection = new Date().getTime() - time.start;

        ws.on('message', function(data)
        {
          time.message = new Date().getTime() - time.start;
          if(data.toString() === 'Hello World!')
          {
            __event__({type: 'ws', status: 'success', data: {time: {connection: time.connection, message: time.message}}});
            _usage.event('ws', 'success').send();
          }
          else
          {
            __event__({type: 'ws', status: 'corrupted', data: {time: {connection: time.connection, message: time.message}}});
            _usage.event('ws', 'corrupted').send();
          }
        });
      });

      ws.on('error', function()
      {
        __event__({type: 'ws', status: 'failed'});
        _usage.event('ws', 'failed').send();
      });
    }
    else
    {
      __event__({type: 'ws', status: 'failed'});
      _usage.event('ws', 'failed').send();
    }
  });
};

module.exports = function(user, version)
{
  _user = user;
  _version = version;
  _usage = analytics('UA-76368254-1', _user, {https: true, strictCidFormat: false});

  __sync__();

  setInterval(__request_test__, options.intervals.request_test);
  setInterval(__speed_test__, options.intervals.speed_test);
  setInterval(__ws_test__, options.intervals.ws_test);
  setInterval(__analytics_ack__, options.intervals.analytics);

};
