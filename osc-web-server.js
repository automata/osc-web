require.paths.unshift(__dirname + '/node-osc/lib');

var fs   = require('fs'),
    sys  = require(process.binding('natives').util ? 'util' : 'sys'),
    url  = require('url'),
    http = require('http'),
    path = require('path'),
    mime = require('mime'),
    io   = require('socket.io'),
    osc  = require('osc');

// HTTP server listening on port 4040.
var server = http.createServer(function(req, res){ 
    res.writeHead(200, {'Content-Type': 'text/html'}); 
    res.end('<h1>Hello world</h1>'); 
});
server.listen(4040);

var socket = io.listen(server);

var OSCServer = new osc.Server(4343, 'localhost'),
    OSCClient = new osc.Client('localhost', 12000);

OSCServer.on('/m1/foo/me', function(msg) {
    if (msg.typetags == 'is') {
        var message = new osc.Message('/node/m1');
        message.add(msg.args[0]);
        this.send(message, OSCClient);
    }
});
OSCServer.on('/m1/bar/you', function(values) {
    console.log(values);
});

socket.on('connection', function(client){
    // tell to lp that it should send messages to us at localhost:4343
    var message = new osc.Message('/lp/dest', 'osc.udp://localhost:4343/browser/');
    OSCServer.send(message, OSCclient);

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
        OSCserver.send(message, OSCclient);
        console.log(localMessage);
        client.broadcast(localMessage);
    });

    client.on('disconnect', function(){
        client.broadcast({ disconnection: client.sessionId});
    });
});
