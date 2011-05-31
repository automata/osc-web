$(function() {

    //
    // UI
    //

    $( ".tonematrix" ).draggable();
    $( "input:checkbox", ".tonematrix").button().click(function () {
        var id = $(this).attr('id');
        if ($(this).attr('checked')) {
            socket.send({
                address: '/lp/matrix',
                message: [parseInt(id[1]), parseInt(id[2]), 1]
            });
        } else {
            socket.send({
                address: '/lp/matrix',
                message: [parseInt(id[1]), parseInt(id[2]), 0]
            });
        }
    });
    
    // create Growl like notification.
    function notify(msg) {
        $('<div></div>')
            .addClass('notification')
            .text(msg)
            .appendTo('#info')
            .fadeIn(1000)
            .delay(2000)
            .fadeOut(500);
    }

    //
    // socket.io
    //
    
    // create the socket to the local OSC server
    var socket = new io.Socket("localhost", { port: 3000, rememberTransport: false });
    
    // NOTE: we can create sockets to remote hosts too!!!

    // connect to the socket.
    socket.connect();
    
    // bind callbacks for each events.
    socket.on('connect', function() {
        notify('System Connected');
        socket.send({
            config: {
                server: {
                    port: 11000,
                    host: 'localhost'
                },
                client: {
                    port: 12000,
                    host: 'localhost'
                }
            }
        });
        socket.send({
            address: '/lp/matrix',
            message: 'clear'
        });
    });
    
    socket.on('message', function(obj) {
        if ('OSCMessage' in obj) {
            var msg = obj.OSCMessage;
            notify('Incoming message: ' + "\n" +
                   'address: '+ msg.address + "\n" +
                   'args: ' + msg.args);
            
            switch (msg.address) {
                case '/lp/matrix':
                    $('#c' + msg.args[0].value + msg.args[1].value)
                        .attr('checked', msg.args[2].value == 0 ? false : true);
                    console.log($('#c' + msg.args[0].value + msg.args[1].value).attr('checked'));
                    break;
                default:
                break;
            }
        } else if ('info' in obj) {
            notify(obj.message);
        }
    });
    socket.on('disconnect', function() {
        notify('System Disconnected');
    });
    socket.on('reconnect', function() {
        notify('System Reconnected to server');
    });
    socket.on('reconnecting', function(nextRetry){
        notify('System Attempting to re-connect to the server, next attempt in ' + nextRetry + 'ms');
    });
    socket.on('reconnect_failed', function() {
        notify('System Reconnected to server FAILED.');
    });
});

