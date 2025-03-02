'use strict';

const { Buffer } = require('node:buffer');
const { Transform } = require('node:stream');

class PCMInsertSilence extends Transform {
  constructor(options) {
    super(options);
    // 48Khz, 2 channels, 16-bit (2 bytes per channel)
    this.sampleRate = 48000;
    this.channels = 2;
    // 4 bytes per frame (2 channels * 2 bytes)
    this.bytesPerFrame = this.channels * 2;
    this.lastChunkTime = Date.now();
    this.silenceThresholdMs = 50;
  }

  _transform(chunk, encoding, callback) {
    const now = Date.now();
    const gap = now - this.lastChunkTime;

    if (gap >= this.silenceThresholdMs) {
      const missingFrames = Math.floor((gap / 1000) * this.sampleRate);
      const silenceBuffer = Buffer.alloc(missingFrames * this.bytesPerFrame, 0);
      this.push(silenceBuffer);
    }

    this.lastChunkTime = now;

    this.push(chunk);
    callback();
  }
}

module.exports = {
  PCMInsertSilence,
};
