'use strict';

const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, 'arRPC')} > ${rgb(235, 69, 158, 'websocket')}]`, ...args);

const { createServer } = require('http');
const { parse } = require('querystring');
const { WebSocketServer } = require('ws');

const portRange = [6463, 6472]; // Ports available/possible: 6463-6472

module.exports = class WSServer {
  constructor(handlers, debug = false) {
    return (async () => {
      this.debug = debug;

      this.handlers = handlers;

      this.onConnection = this.onConnection.bind(this);
      this.onMessage = this.onMessage.bind(this);

      let port = portRange[0];

      let http, wss;
      while (port <= portRange[1]) {
        if (this.debug) log('trying port', port);

        if (
          await new Promise(res => {
            http = createServer();
            http.on('error', e => {
              // Log('http error', e);

              if (e.code === 'EADDRINUSE') {
                if (this.debug) log(port, 'in use!');
                res(false);
              }
            });

            wss = new WebSocketServer({ server: http });
            // eslint-disable-next-line no-unused-vars
            wss.on('error', e => {
              // Debug: Log('wss error', e);
            });

            wss.on('connection', this.onConnection);

            http.listen(port, '127.0.0.1', () => {
              if (this.debug) log('listening on', port);

              this.http = http;
              this.wss = wss;

              res(true);
            });
          })
        ) {
          break;
        }
        port++;
      }

      return this;
    })();
  }

  onConnection(socket, req) {
    const params = parse(req.url.split('?')[1]);
    const ver = parseInt(params.v ?? 1);
    const encoding = params.encoding ?? 'json'; // Json | etf (erlpack)
    const clientId = params.client_id ?? '';

    const origin = req.headers.origin ?? '';

    if (this.debug) log(`new connection! origin:`, origin, JSON.parse(JSON.stringify(params)));

    if (
      origin !== '' &&
      !['https://discord.com', 'https://ptb.discord.com', 'https://canary.discord.com/'].includes(origin)
    ) {
      if (this.debug) log('disallowed origin', origin);

      socket.close();
      return;
    }

    if (encoding !== 'json') {
      if (this.debug) log('unsupported encoding requested', encoding);

      socket.close();
      return;
    }

    if (ver !== 1) {
      if (this.debug) log('unsupported version requested', ver);

      socket.close();
      return;
    }

    socket.clientId = clientId;
    socket.encoding = encoding;

    socket.on('error', e => {
      if (this.debug) log('socket error', e);
    });

    socket.on('close', (e, r) => {
      if (this.debug) log('socket closed', e, r);
      this.handlers.close(socket);
    });

    socket.on('message', this.onMessage.bind(this, socket));

    socket._send = socket.send;
    socket.send = msg => {
      if (this.debug) log('sending', msg);
      socket._send(JSON.stringify(msg));
    };

    this.handlers.connection(socket);
  }

  onMessage(socket, msg) {
    if (this.debug) log('message', JSON.parse(msg));
    this.handlers.message(socket, JSON.parse(msg));
  }
};
