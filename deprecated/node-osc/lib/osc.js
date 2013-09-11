require.paths.unshift(__dirname + '/node-jspack');

var dgram  = require('dgram'),
    sys    = require('sys'),
    util   = require('util'),
    events = require('events'),
    jspack = require('jspack').jspack;


/****************************************************
 *
 * OSC Message
 *
 ****************************************************/

function Message(address) {
    this.address  = address;
    this.typetags = '';
    this.args     = [];
    
    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments);
        for (var i = 1; i < args.length; i++) {
            this.add(args[i]);
        }
    }
}

Message.prototype = {
    _add: function(arg) {
        switch (typeof arg) {
            case 'object':
                if ((arg.super && arg.super.name === 'IDataType') || (typeof arg.typetag !== undefined && typeof arg.value !== undefined)) {
                    this.typetags += arg.typetag;
                    this.args.push(arg);
                } else {
                    throw new Error('Message::add - invalid argument' + arg);
                }
                break;
            case 'number':
                if (Math.floor(arg) == arg) {
                    this.typetags += TInt.prototype.typetag;
                    this.args.push(new TInt(Math.floor(arg)));
                } else {
                    this.typetags += TFloat.prototype.typetag;
                    this.args.push(new TFloat(arg));
                }
                break;
            case 'string':
                this.typetags += TString.prototype.typetag;
                this.args.push(new TString(arg));
                break;
            default:
                throw new Error("Message::add - don't know how to encode " + arg);
        }
    },
    
    add: function(args) {
        if (args instanceof Array) {
            for (var i in args) {
                this._add(args[i]);
            }
        } else {
            if (arguments.length == 1) {
                this._add(args);
            } else if (arguments.length > 1) {
                args = Array.prototype.slice.call(arguments);
                for (i in args) {
                    this._add(args[i]);
                }
            } else {
                throw new Error("argument(s) is missing");
            }
        }
    },
    
    clear: function() {
        this.address  = '';
        this.typetags = '';
        this.args     = [];
    },
    
    // check addrPattern eqauls this.address
    checkAddrPattern: function(addrPattern) {
        if (this.address == addrPattern) {
            return true;
        }
        return false;
    },
    
    // check typetag eqauls this.typetags
    checkTypetag: function(typetag) {
        if (this.typetags == typetag) {
            return true;
        }
        return false;
    },
    
    toBinary: function () {
        var address = new TString(this.address),
            binary = [],
            pos = 0;
        
        pos = address.encode(binary, pos);
        if (this.typetags) {
            var typetags = new TString(',' + this.typetags);
            pos = typetags.encode(binary, pos);
            for (var i = 0; i < this.args.length; i++) {
                pos = this.args[i].encode(binary, pos);
            }
        }
        return binary;
    }
};

exports.Message = Message;


/****************************************************
 *
 * OSC Bundle
 *
 ****************************************************/

function Bundle() {
    this.messages = [];
    this.timetag = 1;
}

Bundle.prototype = {
    // offset from 1.1.1900 - 1.1.1970
    TIMETAG_OFFSET: 2208988800,
    
    add: function (arg) {
        if (arg instanceof Message) {
            this.messages.push(arg);
        } else {
            throw new Error('Argument must be instance of Message: ' + arg);
        }
    },
    
    // get message at the index
    getMessage: function(index) {
        return this.messages[index];
    },
    
    // remove message at the index
    remove: function(index) {
        this.messages.splice(index, 1); 
    },
    
    // returns the TTimetag instance based on this.timetag
    getTimetag: function() {
        return new TTimetag(this.timetag);
    },
    
    // set timetag
    // TODO: JavaScript doesn't support 64bit fixed point number.
    //       Current implementation in Bundle for timetag support
    //       is not meet OSC's specifications :(
    setTimetag: function(time) {
        var secsOffset = time / 1000 + this.TIMETAG_OFFSET;
        var secsFractional = ((time % 1000) << 32) / 1000;
        this.timetag = (secsOffset << 32) | secsFractional;
    },
    
    // returns the current time in millisecond. use with setTimetag.
    now: function() {
        return Date.now();
    },
    
    size: function() {
        return this.messages.length;
    },
    
    // return binary representation of this Bundle
    toBinary: function () {
        var bundle = new TString('#bundle'),
            binary = [],
            pos    = bundle.encode(binary, 0);
        
        pos = this.getTimetag().encode(binary, pos);
        
        for (var i = 0; i < this.messages.length; i++) {
            var mBinary = this.getMessage(i).toBinary();
            pos = new TInt(mBinary.length).encode(binary, pos);
            binary = binary.concat(mBinary);
            pos = binary.length;
        }
        return binary;
    }
};

exports.Bundle = Bundle;


/****************************************************
 *
 * OSC Message encoding and decoding functions
 *
 ****************************************************/

function ShortBuffer(type, buf, requiredLength)
{
    this.type = "ShortBuffer";
    var message = "buffer [";
    for (var i = 0; i < buf.length; i++) {
        if (i) {
            message += ", ";
        }
        message += buf.charCodeAt(i);
    }
    message += "] too short for " + type + ", " + requiredLength + " bytes required";
    this.message = message;
}

// Interface / Superclass of all data types
function IDataType(value, typetag) {
    this.value   = value;
    this.typetag = typetag;
}
IDataType.prototype = {
    value  : '',
    typetag: '',
    decode : function() {},
    endode : function() {}
};

function TString(value) { this.super(value, this.typetag); }
TString.prototype = {
    super: IDataType,
    typetag: 's',
    decode: function (data) {
        var end = 0;
        while (data[end] && end < data.length) {
            end++;
        }
        if (end == data.length) {
            throw Error("OSC string not null terminated");
        }
        this.value = data.toString('ascii', 0, end);
        var nextData = parseInt(Math.ceil((end + 1) / 4.0) * 4);
        return data.slice(nextData);
    },
    encode: function (buf, pos) {
        var len = Math.ceil((this.value.length + 1) / 4.0) * 4;
        return jspack.PackTo('>' + len + 's', buf, pos, [ this.value ]);
    }
};

function TInt(value) { this.super(value, this.typetag); }
TInt.prototype = {
    super: IDataType,
    typetag: 'i',
    decode: function (data) {
        if (data.length < 4) {
            throw new ShortBuffer('int', data, 4);
        }

        this.value = jspack.Unpack('>i', data.slice(0, 4))[0];
        return data.slice(4);
    },
    encode: function (buf, pos) {
        return jspack.PackTo('>i', buf, pos, [ this.value ]);
    }
};

function TTimetag(value) { this.super(value, this.typetag); }
TTimetag.prototype = {
    super: IDataType,
    typetag: 't',
    decode: function (data) {
        if (data.length < 8) {
            throw new ShortBuffer('time', data, 8);
        }
        this.value = jspack.Unpack('>ll', data.slice(0, 8))[0];
        return data.slice(8);
    },
    encode: function (buf, pos) {
        return jspack.PackTo('>ll', buf, pos, this.value);
    }
};

function TFloat(value) { this.super(value, this.typetag); }
TFloat.prototype = {
    super: IDataType,
    typetag: 'f',
    decode: function (data) {
        if (data.length < 4) {
            throw new ShortBuffer('float', data, 4);
        }

        this.value = jspack.Unpack('>f', data.slice(0, 4))[0];
        return data.slice(4);
    },
    encode: function (buf, pos) {
        return jspack.PackTo('>f', buf, pos, [ this.value ]);
    }
};

function TBlob(value) { this.super(value, this.typetag); }
TBlob.prototype = {
    super: IDataType,
    typetag: 'b',
    decode: function (data) {
        var length = jspack.Unpack('>i', data.slice(0, 4))[0];
        var nextData = parseInt(Math.ceil((length) / 4.0) * 4) + 4;
        this.value = data.slice(4, length + 4);
        return data.slice(nextData);
    },
    encode: function (buf, pos) {
        var len = Math.ceil((this.value.length) / 4.0) * 4;
        return jspack.PackTo('>i' + len + 's', buf, pos, [len, this.value]);
    }
};

function TDouble(value) { this.super(value, this.typetag); }
TDouble.prototype = {
    super: IDataType,
    typetag: 'd',
    decode: function (data) {
        if (data.length < 8) {
            throw new ShortBuffer('double', data, 8);
        }
        this.value = jspack.Unpack('>d', data.slice(0, 8))[0];
        return data.slice(8);
    },
    encode: function (buf, pos) {
        return jspack.PackTo('>d', buf, pos, [ this.value ]);
    }
};

// for each OSC type tag we use a specific constructor function to decode its respective data
var tagToConstructor = {
    'i': function () { return new TInt },
    'f': function () { return new TFloat },
    's': function () { return new TString },
    'b': function () { return new TBlob },
    'd': function () { return new TDouble }
};

function decode (data) {
    var message = new Message();
    
    // we start getting the <address> and <rest> of OSC msg /<address>\0<rest>\0<typetags>\0<data>
    var address = new TString;
    data = address.decode(data);
    message.address = address.value;

    // if we have rest, maybe we have some typetags... let see...
    if (data.length > 0) {
        // now we advance on the old rest, getting <typetags>
        var typetags = new TString();
        data = typetags.decode(data);
        typetags = typetags.value;
        
        // so we start building our message list
        if (typetags[0] != ',') {
            throw "invalid type tag in incoming OSC message, must start with comma";
        }
        
        for (var i = 1; i < typetags.length; i++) {
            var constructor = tagToConstructor[typetags[i]];
            if (!constructor) {
                throw "Unsupported OSC type tag " + typetags[i] + " in incoming message";
            }
            var argument = constructor();
            data = argument.decode(data);
            message.add(argument);
        }
    }
    
    return message;
}


/****************************************************
 *
 * OSC Server
 *
 ****************************************************/

function Server(port, host) {
    events.EventEmitter.call(this);
    
    this.port = port;
    this.host = host;
    this._sock = dgram.createSocket('udp4');
    this._sock.bind(this.port, this.host);
    
    var oscServer = this,
        _callbacks = [];
    
    this._sock.on('message', function (msg, rinfo) {
        // decoded message is now chenged into Message.
        var decoded = decode(msg);
        try {
            if (decoded) {
                oscServer.emit('oscmessage', decoded, rinfo);
            }
        }
        catch (e) {
            console.log("can't decode incoming message: " + e.message);
        }
    });
}

util.inherits(Server, events.EventEmitter);

Server.prototype.send = function (msg, client) {
    console.log(arguments);
    if (!client || !client instanceof Client) {
        throw new Error('Server::send - invalid client');
    }
    
    var binary;
    if (msg.toBinary && typeof msg.toBinary === 'function') {
        binary = msg.toBinary();
    } else {
        // cheesy
        var message = {};
        Message.apply(message, arguments)
        binary = Message.prototype.toBinary.call(message);
    }
    var buf = new Buffer(binary, 'binary');
    this._sock.send(buf, 0, buf.length, client.port, client.host);
};

Server.prototype.dispose = function() {
    this._sock.close();
};

exports.Server = Server;


/****************************************************
 *
 * OSC Client
 *
 ****************************************************/

function Client(host, port) {
    this.port = port;
    this.host = host;
}

exports.Client = Client;