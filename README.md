# Open Sound Control Web Bridge

Creates a simple bridge between your Web page and an OSC app or device.

    .----------.              .----------------------.    .------------------.                 .----------.
    | OSC  app | --tcp/udp--> | bridge.js OSC server | => | socket.io client | --websockets--> | web page |
    `--(3334)--'              `-------( 3333 )-------'    `------------------'                 `----------'
         ^                                                                                          |
         |                                                                                          |
         |                                                                                          |
         |                .----------------------.    .------------------.                          |
         `---tcp/udp----- | bridge.js OSC client | <= | socket.io server | <-------websockets-------'
                          `----------------------'    `-----( 8081 )-----'

## Introduction

OSC (Open Sound Control) is a protocol on top of UDP commonly used by
audio applications. It could be seem as a /MIDI evolution/. 

The objective of *osc-web* is to make possible to send and receive
OSC messages on the Web browser. With this browser capability we could
do interesting things like:

- Connect OSC supported controllers to the Web browser
- Use the Web browser as a controller to OSC supported applications
  (like Puredata, SuperCollider, Max/MSP, ...)
- Create a Web /OSC proxy/ where people all over the world could
  connect yours OSC controllers or applications without complications
  with /port fordwarding/

### History

Long time ago I was asking for awesome people on AudioXG about that
and we come with some options:

1. create a Firefox extension using nsISocketTransport
2. create a kind of HTTP proxy (thanks @corban, @F1LT3R, @humph and yury!)

The first one works but seems to be a security hole (as yuri saids, no
one wants UDP connections on its browsers). Now I'm trying the second
alternative, using node.js and socket.io to create a bridge between
OSC controllers/applications and the browser.

## Prerequisites

- [Node.js](https://nodejs.org)
- [Socket.io](https://socket.io)
- Some application (Puredata, Renoise, Reaktor, ...) or hardware controller that supports OSC

## Installation

First of all, download and install Nodejs LTS from http://nodejs.org, then:

```
$ git clone git://github.com/automata/osc-web.git
$ cd osc-web/
$ npm install
```

## Using

Run the bridge app on your machine (localhost):

```
$ cd osc-web
$ node bridge.js
```

An example is avaitable at `web-side/app.html`. Host this static asset the way you like:

```
$ cd web-side/
$ python -m SimpleHTTPServer 5000
```

Open your browser at http://localhost:5000/app.html.

Now you can run your favorite OSC app/device and send OSC messages
through port 3333. Those messages will be send to the HTML page by
WebSockets.

Configure your favore OSC app/device to listen to OSC messages coming
into port 3334. Any message sent by app.html (hit the button!) will be
sent to your OSC app/device.

**So, you can see the HTML page as an "OSC node", listening to messages
on 3333 and sending messages to 3334.**

Take a look at osc-side/ to examples of OSC apps.

## Projects using it

- 2011 Experience Design class project: http://codes.nevercool.com and https://vimeo.com/album/1636910
- Shapes (Keely Honeywell) at Laboratory! by Alan Chatham: http://laboratoryspokane.com/2013/10/30/005/ and source code at https://github.com/AlanChatham/005-Values

## Related solutions

- [npTuioClient](https://github.com/fajran/npTuioClient): a NPAPI plugin implementing a TUIOClient clone
- [PookyTouch](http://pooky.sourceforge.net/wiki/PookyTouch): similar to npTuioClient using Java-JS LiveConnect bridge
- [Lily's approach](http://blog.lilyapp.org/2007/05/lily_osc_1.html): some good notes. Also uses LiveConnect
- [MaxJax]([http://tirl.org/software/maxjax/): OSC bridge using Python Twisted (just sending OSC)

## References

- [Socket connections in FF](http://www.midnightresearch.com/index.php?s=nsisockettransportservice)
- [OSC Best Practices](http://opensoundcontrol.org/files/osc-best-practices-final.pdf)
- [OSC 1.0 Specification](http://opensoundcontrol.org/spec-1_0)
