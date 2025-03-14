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

const { Buffer } = require('node:buffer');
const VideoDispatcher = require('./VideoDispatcher');
const Util = require('../../../util/Util');

class VP8Dispatcher extends VideoDispatcher {
  constructor(player, highWaterMark = 12, streams, fps) {
    super(player, highWaterMark, streams, fps, Util.getPayloadType('VP8'));
  }

  makeChunk(buffer, isFirstPacket) {
    // Vp8 payload descriptor
    const payloadDescriptorBuf = Buffer.alloc(2);
    payloadDescriptorBuf[0] = 0x80;
    payloadDescriptorBuf[1] = 0x80;
    if (isFirstPacket) {
      payloadDescriptorBuf[0] |= 1 << 4; // Mark S bit, indicates start of frame
    }
    // Vp8 pictureid payload extension
    const pictureIdBuf = Buffer.alloc(2);
    pictureIdBuf.writeUintBE(this.count, 0, 2);
    pictureIdBuf[0] |= 0x80;
    return Buffer.concat([this.createPayloadExtension(), payloadDescriptorBuf, pictureIdBuf, buffer]);
  }

  _codecCallback(chunk) {
    const chunkSplit = this.partitionMtu(chunk).map((c, i) => this.makeChunk(c, i === 0));
    for (let i = 0; i < chunkSplit.length; i++) {
      this._playChunk(chunkSplit[i], i + 1 === chunkSplit.length);
    }
  }
}

module.exports = {
  VP8Dispatcher,
};
