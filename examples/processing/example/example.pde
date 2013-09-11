import oscP5.*;
import netP5.*;

OscP5      _server;
NetAddress _client;
OscMessage _incoming;

PFont      _font;

void setup()
{
  size(400, 160);
  smooth();
  
  _server   = new OscP5(this, 12000);
  _client   = new NetAddress("localhost", 11000);
  
  _font = loadFont("ArialMT-48.vlw");
  textFont(_font, 30);
}

void draw()
{
  background(0);
  fill(255);
  if (_incoming != null)
  {
    text("address     : " + _incoming.addrPattern(), 10, 40);
    text("typetags    : " + _incoming.typetag(), 10, 80);
    text("arguments: ", 10, 120);
    if (_incoming.checkTypetag("iii"))
    {
      for (int i = 0; i < _incoming.arguments().length; i++)
      {
        text(_incoming.get(i).intValue(), 165 + 20 * i, 121);
      }
    }
  }
}

void oscEvent(OscMessage message)
{
  _incoming = message;
  println(_incoming.addrPattern());
}
