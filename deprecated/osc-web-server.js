require.paths.unshift(__dirname + '/node-osc/lib');

var http = require('http'),
    io   = require('socket.io'),
    osc  = require('osc');

// HTTP server listening on port 3000.
var server = http.createServer(function(req, res){ 
    res.writeHead(200, {'Content-Type': 'text/html'}); 
    res.end('<h1>Hello world</h1>'); 
});
server.listen(3000);

// OSCServer and OSCClient is just defined here.
// create the socket for communicating to the browser.
var OSCServer,
    OSCClient,
    socket = io.listen(server);

// bind callbacks.
socket.on('connection', function(client){
    client.broadcast({ info: client.sessionId + ' connected' });
    
    client.on('message', function(obj) {
        // in this example, first browser-client sends a configuration object.
        // it contains 'port' and 'host' settings for Server and Client.
        if ('config' in obj) {
            var config = obj.config;
            OSCServer = new osc.Server(config.server.port, config.server.host);
            OSCClient = new osc.Client(config.client.host, config.client.port);
            
            var message = new osc.Message('/status', client.sessionId + ' connected');
            OSCServer.send(message, OSCClient);
            
            // OSCServer dispatches 'oscmessage' event when receives the message.
            // so we attach handler on the event for global message handling.
            OSCServer.on('oscmessage', function(msg) {
                // check message's address pattern.
                if (msg.checkAddrPattern('/lp/matrix')) {
                    // and check messages typetag.
                    if (msg.checkTypetag('iii')) {
                        client.send({
                            OSCMessage: {
                                address: msg.address,
                                typetags: msg.typetags,
                                args: msg.args
                            }
                        });
                    }
                }
            });
        } else {
            // Bundle is now available.
            var bundle   = new osc.Bundle(),
                message1 = new osc.Message(obj.address, obj.message),
                message2 = new osc.Message('/status', 'from ' + client.sessionId + ' at ' + new Date().toString());
            
            // to bundle messages, simply call 'add()' with instance of the Message.
            bundle.add(message1);
            bundle.add(message2);
            // set timetag.
            bundle.setTimetag(bundle.now());
            
            // we can send Bundle in the same way as Message.
            OSCServer.send(bundle, OSCClient);
        }
    });
    
    client.on('disconnect', function(){
        client.broadcast({ disconnection: client.sessionId});
    });
});
