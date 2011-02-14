var fs = require('fs'),
    sys = require(process.binding('natives').util ? 'util' : 'sys'),
    url = require('url'),
    http = require('http'),
    path = require('path'),
    mime = require('mime'),
    io = require('socket.io');

require.paths.unshift(__dirname + '/node-osc/lib');
// FIXME: commit to node-osc and try to eliminate jspack dependency
var osc = require('osc');
// FIXME: implement the OSCServer on node-osc, so we will not need dgram here
var dgram = require('dgram');

server = http.createServer(function(req, res){ 
    res.writeHead(200, {'Content-Type': 'text/html'}); 
    res.end('<h1>Hello world</h1>'); 
});

server.listen(4040);

var io = io.listen(server);

io.on('connection', function(client){
    var OSCclient = new osc.Client(17144, '127.0.0.1');

    // tell to lp that it should send messages to us at localhost:4343
    OSCmsg = new osc.Message('/lp/dest');
    OSCmsg.append('osc.udp://localhost:4343/browser/');
    OSCclient.send(OSCmsg);

    // so let's start to listen on 4343
    var OSCserver = dgram.createSocket("udp4");
        
    OSCserver.bind(4343);

    // when we receive messages on 4343, have to pass to the browser
    OSCserver.on("message", function (msg, rinfo) {
        console.log("server got: " + msg + " from " +
                    rinfo.address + ":" + rinfo.port);
        client.send({message: 'got message from OSC'});
    });

    OSCserver.on("listening", function () {
        var address = OSCserver.address();
        console.log("server listening " +
                    address.address + ":" + address.port);
    });

    client.broadcast({ connection: client.sessionId});
    
    client.on('message', function(message){
        var msg = { message: [client.sessionId, message] };
        var OSCargs = message.split(' ');
        OSCmsg = new osc.Message('/lp/matrix');
        for (i=0; i<OSCargs.length; i++) {
                    OSCmsg.append(parseInt(OSCargs[i]));
        } 
        OSCclient.send(OSCmsg);
        console.log(msg);
        client.broadcast(msg);
    });

    client.on('disconnect', function(){
        client.broadcast({ disconnection: client.sessionId});
    });
});

