'use strict';

const { Buffer } = require('buffer');
const { setTimeout } = require('timers');

class Readable extends require('stream').Readable {
  _read() {} // eslint-disable-line no-empty-function
}

/**
 * Receives video packets from a voice connection.
 */
class IvfJoinner {
  constructor(codec = 'VP8') {
    this.codec = codec;
    this.ivfHeader = this.getHeaderIvf();
    this.count = 0;
    /**
     * Readable stream
     * @type {Readable}
     */
    this.stream = new Readable();
    this._tempBuffer = null;
    this._fps = 0;
    this.timeConvert = null;
    this.lastConvert = null;
    this.firstFrame = Buffer.from([0x90, 0x80]);
    this._timeoutFps = null;
  }
  getHeaderIvf() {
    const ivfHeader = Buffer.alloc(32);
    ivfHeader.write('DKIF'); // Signature
    ivfHeader.writeUInt16LE(0, 4); // Version
    ivfHeader.writeUInt16LE(32, 6); // Header length
    ivfHeader.write(`${this.codec}0`, 8); // Codec FourCC
    ivfHeader.writeUInt16LE(0, 12); // Width
    ivfHeader.writeUInt16LE(0, 14); // Height
    ivfHeader.writeUInt32LE(this._fps, 16); // Frame rate
    ivfHeader.writeUInt32LE(1, 20); // Framerate denominator
    ivfHeader.writeUInt32LE(this.count + 1, 24); // Frame count
    return ivfHeader;
  }
  getFramedata() {
    const frameHeader = Buffer.alloc(12);
    frameHeader.writeUInt32LE(this._tempBuffer.length, 0); // Frame size
    frameHeader.writeUInt32LE(this.count, 4); // Timestamp
    return frameHeader;
  }
  push(bufferRaw) {
    if (!this._timeoutFps) {
      this._timeoutFps = setTimeout(() => {
        if (this.stream.destroyed) return;
        this._fps = Math.round((this.lastConvert - this.timeConvert) / this.count);
        // ! Todo: need improved
        this._timeoutFps = null;
      }, 500).unref();
    }
    if (!this.timeConvert) {
      this.timeConvert = performance.now();
    }
    // Ex VP8
    // <Buffer 90 80 80 00 30 b7 01 9d 01 2a 80 07 38 04 0b c7 08 85 85 88 99 84 88 3f 82 00 06 16 04 f7 06 81 64 9f 6b db 9b 27 38 7b 27 38 7b 27 38 7b 27 38 7b 27 ... 1154 more bytes>
    // 90 80: payloadDescriptorBuf (90 80 if first frame | 80 80 else)
    // 80 00: pictureIdBuf
    // n bytes: chunk raw (Ivf splitter)
    const payloadDescriptorBuf = bufferRaw.slice(0, 2);
    const data = bufferRaw.slice(4);
    const isFirstFrame = Buffer.compare(payloadDescriptorBuf, this.firstFrame) === 0;
    if (isFirstFrame && this._tempBuffer) {
      this.count++;
      this.lastConvert = performance.now();
      this.stream.push(Buffer.concat([this.getFramedata(), this._tempBuffer]));
      this._tempBuffer = null;
    }
    if (!this._tempBuffer) {
      this._tempBuffer = data;
    } else {
      this._tempBuffer = Buffer.concat([this._tempBuffer, data]);
    }
  }
  /**
   * Force stop stream
   * @returns {void}
   */
  stop() {
    this.stream.push(null);
    this.stream.emit('end'); // Force close stream;
    this.stream.destroy();
  }
  /**
   * Convert partial file to full file
   * @param {Readable} readable File created by stream (Raw)
   * @param {Writable} writeable Output (Ivf)
   * @returns {void}
   */
  createFinalFile(readable, writeable) {
    if (this.stream.destroyed) {
      writeable.write(this.getHeaderIvf());
      readable.pipe(writeable);
    }
  }
}

module.exports = {
  IvfJoinner,
};
