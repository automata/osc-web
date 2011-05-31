$(function() {

    //
    // UI
    //

    $( ".tonematrix" ).draggable();
    $( "input:checkbox", ".tonematrix").button().click(function () {
        var id = $(this).attr('id');
        if ($(this).attr('checked')) {
            console.log(id, id[1], id[2]);
            socket.send(id[1] + ' ' + id[2] + ' 127');
        } else {
            socket.send(id[1] + ' ' + id[2] + ' 0');
        }
    });

    //
    // socket.io
    //
    
    // create the socket to the local OSC server
    var socket = new io.Socket("localhost", {port: 4040, rememberTransport: false});

    // NOTE: we can create sockets to remote hosts too!!!

    // connect to the socket
    socket.connect();

    // when a message from server was received...
    socket.on('message', function(obj) { 
        // var status = document.getElementById('status');
        // var el = document.createElement('p');
        if ('connection' in obj) {
            // el.innerHTML = 'user ' + obj.connection + ' connected';
        } else if ('disconnection' in obj) {
            // el.innerHTML = 'user ' + obj.disconnection + ' disconnected';
        } else if ('message' in obj) {
            // el.innerHTML = 'user sends: ' + obj.message;

            var pos = obj.message.toString().split(',');
            // check the checkbox...
            if (pos[2] == '127') {
                $('#c' + pos[0] + pos[1]).attr('checked', true);
            } else {
                $('#c' + pos[0] + pos[1]).attr('checked', false);
            }
            $('#c' + pos[0] + pos[1]).button('refresh');

            // ... and check the lp
            socket.send(pos[0] + ' ' + pos[1] + ' ' + pos[2]);
        }
        // status.appendChild(el);
    });      

});

