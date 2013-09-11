OscSend xmit;
xmit.setHost("127.0.0.1", 3333);
xmit.startMsg("foo, i, f, s");
xmit.addInt(42);
xmit.addFloat(42.5);
xmit.addString("bar baz");