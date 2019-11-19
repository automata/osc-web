<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML//EN">
<html> <head>
<title></title>
</head>

<body>

<p>Connect your OSC app/device at port 3333 to send messages to this
page.<br /><br />Configure your OSC app/device to listen at port 3334
to messages I send from this page.</p>

<pre>
        OSC app ----> bridge.js server : 3333 -----> web page
          /\                                             |
           `--------- bridge.js server : 3334 <----------'
</pre>

Under the hood what really happens is:

<pre>
        OSC app --[TCP/UDP]--> bridge.js oscServer:3333 ; bridge.js socketio client --[WebSockets]--> website app.js

        website app.js --[WebSockets]--> bridge.js socket.io server:8081 ; bridge.js oscClient --[TCP/UDP]--> OSC app:3334    
</pre>

<hr />

Received from an OSC app/device at : <div id="status"></div>

<hr />

<script src="http://127.0.0.1:8081/socket.io/socket.io.js"></script>

<script>
   var socket = io('http://127.0.0.1:8081');
   socket.on('connect', function() {
        // sends to socket.io server the host/port of oscServer
        // and oscClient
        socket.emit('config',
            {
                server: {
                    port: 3333,
                    host: '127.0.0.1'
                },
                client: {
                    port: 3334,
                    host: '127.0.0.1'
                }
            }
        );
    });

    socket.on('message', function(obj) {
        var status = document.getElementById("status");
        status.innerHTML = obj[0];
        console.log(obj);
    });
</script>

<button onclick="socket.emit('message', '/foo/bar 1 2 3');">Send /foo/bar/ 1 2 3</button>

</body> </html>
