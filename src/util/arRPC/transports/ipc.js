'use strict';

const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, 'arRPC')} > ${rgb(254, 231, 92, 'ipc')}]`, ...args);

const { Buffer } = require('buffer');
const { unlinkSync } = require('fs');
const { createServer, createConnection } = require('net');
const { setTimeout } = require('node:timers');
const { join } = require('path');
const { platform, env } = require('process');

const SOCKET_PATH =
  platform === 'win32'
    ? '\\\\?\\pipe\\discord-ipc'
    : join(env.XDG_RUNTIME_DIR || env.TMPDIR || env.TMP || env.TEMP || '/tmp', 'discord-ipc');

// Enums for various constants
const Types = {
  // Types of packets
  HANDSHAKE: 0,
  FRAME: 1,
  CLOSE: 2,
  PING: 3,
  PONG: 4,
};

const CloseCodes = {
  // Codes for closures
  CLOSE_NORMAL: 1000,
  CLOSE_UNSUPPORTED: 1003,
  CLOSE_ABNORMAL: 1006,
};

const ErrorCodes = {
  // Codes for errors
  INVALID_CLIENTID: 4000,
  INVALID_ORIGIN: 4001,
  RATELIMITED: 4002,
  TOKEN_REVOKED: 4003,
  INVALID_VERSION: 4004,
  INVALID_ENCODING: 4005,
};

let uniqueId = 0;

const encode = (type, data) => {
  data = JSON.stringify(data);
  const dataSize = Buffer.byteLength(data);

  const buf = Buffer.alloc(dataSize + 8);
  buf.writeInt32LE(type, 0); // Type
  buf.writeInt32LE(dataSize, 4); // Data size
  buf.write(data, 8, dataSize); // Data

  return buf;
};

const read = socket => {
  let resp = socket.read(8);
  if (!resp) return;

  resp = Buffer.from(resp);
  const type = resp.readInt32LE(0);
  const dataSize = resp.readInt32LE(4);

  if (type < 0 || type >= Object.keys(Types).length) throw new Error('invalid type');

  let data = socket.read(dataSize);
  if (!data) throw new Error('failed reading data');

  data = JSON.parse(Buffer.from(data).toString());

  switch (type) {
    case Types.PING:
      socket.emit('ping', data);
      socket.write(encode(Types.PONG, data));
      break;

    case Types.PONG:
      socket.emit('pong', data);
      break;

    case Types.HANDSHAKE:
      if (socket._handshook) throw new Error('already handshook');

      socket._handshook = true;
      socket.emit('handshake', data);
      break;

    case Types.FRAME:
      if (!socket._handshook) throw new Error('need to handshake first');

      socket.emit('request', data);
      break;

    case Types.CLOSE:
      socket.end();
      socket.destroy();
      break;
  }

  read(socket);
};

const socketIsAvailable = async socket => {
  socket.pause();
  socket.on('readable', () => {
    try {
      read(socket);
    } catch (e) {
      // Debug: log('error whilst reading', e);
      socket.end(
        encode(Types.CLOSE, {
          code: CloseCodes.CLOSE_UNSUPPORTED,
          message: e.message,
        }),
      );
      socket.destroy();
    }
  });

  const stop = () => {
    try {
      socket.end();
      socket.destroy();
    } catch {
      // Debug
    }
  };

  const possibleOutcomes = Promise.race([
    new Promise(res => socket.on('error', res)), // Errored
    // eslint-disable-next-line prefer-promise-reject-errors
    new Promise((res, rej) => socket.on('pong', () => rej('socket ponged'))), // Ponged
    // eslint-disable-next-line prefer-promise-reject-errors
    new Promise((res, rej) => setTimeout(() => rej('timed out'), 1000).unref()), // Timed out
  ]).then(
    () => true,
    e => e,
  );

  socket.write(encode(Types.PING, ++uniqueId));

  const outcome = await possibleOutcomes;
  stop();
  // Debug: log('checked if socket is available:', outcome === true, outcome === true ? '' : `- reason: ${outcome}`);

  return outcome === true;
};

const getAvailableSocket = async (tries = 0) => {
  if (tries > 9) {
    throw new Error('ran out of tries to find socket', tries);
  }

  const path = `${SOCKET_PATH}-${tries}`;
  const socket = createConnection(path);

  // Debug: log('checking', path);

  if (await socketIsAvailable(socket)) {
    if (platform !== 'win32') {
      try {
        unlinkSync(path);
      } catch {
        // Debug
      }
    }

    return path;
  }

  // Debug: log(`not available, trying again (attempt ${tries + 1})`);
  return getAvailableSocket(tries + 1);
};

module.exports = class IPCServer {
  constructor(handers, debug = false) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async res => {
      this.debug = debug;
      this.handlers = handers;

      this.onConnection = this.onConnection.bind(this);
      this.onMessage = this.onMessage.bind(this);

      const server = createServer(this.onConnection);
      server.on('error', e => {
        if (this.debug) log('server error', e);
      });

      const socketPath = await getAvailableSocket();
      server.listen(socketPath, () => {
        if (this.debug) log('listening at', socketPath);
        this.server = server;

        res(this);
      });
    });
  }

  onConnection(socket) {
    if (this.debug) log('new connection!');

    socket.pause();
    socket.on('readable', () => {
      try {
        read(socket);
      } catch (e) {
        if (this.debug) log('error whilst reading', e);

        socket.end(
          encode(Types.CLOSE, {
            code: CloseCodes.CLOSE_UNSUPPORTED,
            message: e.message,
          }),
        );
        socket.destroy();
      }
    });

    socket.once('handshake', params => {
      if (this.debug) log('handshake:', params);

      const ver = parseInt(params.v ?? 1);
      const clientId = params.client_id ?? '';
      // Encoding is always json for ipc

      socket.close = (code = CloseCodes.CLOSE_NORMAL, message = '') => {
        socket.end(
          encode(Types.CLOSE, {
            code,
            message,
          }),
        );
        socket.destroy();
      };

      if (ver !== 1) {
        if (this.debug) log('unsupported version requested', ver);

        socket.close(ErrorCodes.INVALID_VERSION);
        return;
      }

      if (clientId === '') {
        if (this.debug) log('client id required');

        socket.close(ErrorCodes.INVALID_CLIENTID);
        return;
      }

      socket.on('error', e => {
        if (this.debug) log('socket error', e);
      });

      socket.on('close', e => {
        if (this.debug) log('socket closed', e);
        this.handlers.close(socket);
      });

      socket.on('request', this.onMessage.bind(this, socket));

      socket._send = socket.send;
      socket.send = msg => {
        if (this.debug) log('sending', msg);
        socket.write(encode(Types.FRAME, msg));
      };

      socket.clientId = clientId;

      this.handlers.connection(socket);
    });
  }

  onMessage(socket, msg) {
    if (this.debug) log('message', msg);
    this.handlers.message(socket, msg);
  }
};
