'use strict';

var autostart = require('auto-launch');

var login_item = new autostart({
  name: 'Rain',
  isHidden: true
});
login_item.isEnabled().then(function(enabled)
{
  if(enabled) return;
  login_item.enable();
});
