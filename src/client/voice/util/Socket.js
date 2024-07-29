'use strict';

/*
Credit: https://github.com/dank074/Discord-video-stream
The use of video streaming in this library is an incomplete implementation with many bugs, primarily aimed at lazy users.
The video streaming features in this library are sourced from https://github.com/dank074/Discord-video-stream.

Please use the @dank074/discord-video-stream library to access all advanced and professional features,
along with comprehensive support. I will not actively fix bugs related to streaming and encourage everyone to
use https://github.com/dank074/Discord-video-stream for stable and smooth streaming.

To reiterate: This is an incomplete implementation of the library https://github.com/dank074/Discord-video-stream.

Thanks to dank074 and longnguyen2004 for implementing new codecs (H264, H265).
Thanks to mrjvs for discovering how Discord transmits data and the VP8 codec.

Please use the @dank074/discord-video-stream library for the best support.
*/

const fs = require('fs');
const net = require('net');
const path = require('path');
const process = require('process');

let counter = 0;

class UnixStream {
  constructor(stream, onSocket) {
    if (process.platform === 'win32') {
      const pipePrefix = '\\\\.\\pipe\\';
      const pipeName = `node-webrtc.${++counter}.sock`;
      this.socketPath = path.join(pipePrefix, pipeName);
      this.url = this.socketPath;
    } else {
      this.socketPath = `./${++counter}.sock`;
      this.url = `unix:${this.socketPath}`;
    }

    try {
      fs.statSync(this.socketPath);
      fs.unlinkSync(this.socketPath);
    } catch (err) {
      // Null
    }

    const server = net.createServer(onSocket);
    stream.on('finish', () => {
      server.close();
    });
    server.listen(this.socketPath);
  }
}

function StreamInput(stream) {
  return new UnixStream(stream, socket => stream.pipe(socket));
}

function StreamOutput(stream) {
  return new UnixStream(stream, socket => socket.pipe(stream));
}

module.exports = { StreamOutput, StreamInput, UnixStream };
