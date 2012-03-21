var fs = require('fs'),
    sys = require(process.binding('natives').util ? 'util' : 'sys'),
    url = require('url'),
    http = require('http'),
    path = require('path'),
    mime = require('mime'),
    io = require('socket.io');

// require.paths.unshift(__dirname + '/node-osc/lib');

var osc = require('./node-osc/lib/osc');
// FIXME: implement the OSCServer on node-osc, so we will not need dgram here
var dgram = require('dgram');

server = http.createServer(function(req, res){ 
    res.writeHead(200, {'Content-Type': 'text/html'}); 
    res.end('<h1>Hello world</h1>'); 
});

server.listen(4040);

var io = io.listen(server);

io.on('connection', function(client){
    var OSCclient = new osc.Client(11720, '127.0.0.1');

    // tell to lp that it should send messages to us at localhost:4343
    var message = new osc.Message('/lp/dest', 'osc.udp://localhost:4343/browser/');
    OSCclient.send(message);

    // so let's start to listen on 4343
    var OSCserver = new osc.Server(4343, '127.0.0.1');

    OSCserver.on('/lp/matrix', function (args) {
        client.send({ message: args });
    });

    OSCserver.on('/lp/ctrl', function (args) {
        client.send({ message: '/lp/ctrl ' + args });
    });

    OSCserver.on('/lp/scene', function (args) {
        client.send({ message: '/lp/scene ' + args });
    });

    client.broadcast({ connection: client.sessionId });
    
    client.on('message', function(message) {
        var localMessage = { message: [client.sessionId, message] };
        var message = new osc.Message('/lp/matrix', message.split(' '));
        OSCclient.send(message);
        console.log(localMessage);
        client.broadcast(localMessage);
    });

    client.on('disconnect', function(){
        client.broadcast({ disconnection: client.sessionId});
    });
});
