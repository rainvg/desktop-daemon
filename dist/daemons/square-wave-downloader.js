var child_process=require("child_process"),os=require("os"),fs=require("fs-extra"),path=require("path"),settings={period:36e5,interval:6e4,size:1048576,endpoint:"https://rain.vg/downloads/cpu_testfile",path:path.resolve(__dirname,"..","..","..","resources","cpu_testfile")},_events,_analytics,download=function(){return"darwin"===os.platform()?new Promise(function(e,t){try{fs.unlinkSync(settings.path)}catch(s){}try{return fs.statSync(settings.path),void t()}catch(s){}child_process.exec("curl -o "+settings.path+" "+settings.endpoint,function(){try{fs.statSync(settings.path).size===settings.size?e():t()}catch(s){t()}})}):Promise.reject()},__run__=function(){var e=(new Date).getTime()%settings.period>settings.period/2;e&&download().then(function(){_events.push({type:"square-wave-downloader"}),_analytics.client.event("square-wave-downloader","success").send()})};module.exports=function(e,t){_events=e,_analytics=t,setInterval(__run__,settings.interval)};