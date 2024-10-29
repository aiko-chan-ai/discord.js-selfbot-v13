'use strict';

const { spawn } = require('child_process');
const { createSocket } = require('dgram');
const { EventEmitter } = require('events');
const { Buffer } = require('node:buffer');
const { Writable } = require('stream');
const find = require('find-process');
const kill = require('tree-kill');
const Util = require('../../../util/Util');
const { StreamOutput } = require('../util/Socket');

/**
 * Represents a FFmpeg handler
 * @extends {EventEmitter}
 */
class FFmpegHandler extends EventEmitter {
  constructor(receiver, userId, codec, portUdp, output, isEnableAudio) {
    super();

    Object.defineProperty(this, 'receiver', { value: receiver });

    /**
     * The user ID
     * @type {Snowflake}
     */
    this.userId = userId;

    /**
     * If the audio is enabled
     * @type {boolean}
     */
    this.isEnableAudio = isEnableAudio;

    /**
     * The codec of the stream
     * @type {VideoCodec}
     */
    this.codec = codec;

    /**
     * The UDP port to listen to
     * @type {number}
     */
    this.portUdp = portUdp;

    const isStream = output instanceof Writable;
    if (isStream) {
      this.outputStream = StreamOutput(output);
    }

    /**
     * The output of the stream
     * @type {string|Readable}
     */
    this.output = output;

    const sdpData = Util.getSDPCodecName(portUdp, this.isEnableAudio);

    /**
     * The FFmpeg process is ready or not
     * @type {boolean}
     */
    this.ready = false;

    const stream = spawn('ffmpeg', [
      '-reorder_queue_size',
      '50',
      '-err_detect',
      'ignore_err',
      '-flags2',
      '+export_mvs',
      '-fflags',
      '+genpts',
      '-fflags',
      '+discardcorrupt',
      '-use_wallclock_as_timestamps',
      '1',
      '-protocol_whitelist',
      'file,udp,rtp,pipe,fd',
      '-i',
      '-', // Read from stdin
      '-buffer_size',
      '1000000',
      '-max_delay',
      '500000',
      '-y',
      '-f',
      'matroska',
      isStream ? this.outputStream.url : output,
    ]);

    /**
     * The FFmpeg process
     * @type {ChildProcessWithoutNullStreams}
     */
    this.stream = stream;
    this.stream.stdin.write(sdpData);
    this.stream.stdin.end();
    this.stream.stderr.once('data', data => {
      this.emit('debug', `stderr: ${data}`);
      this.ready = true;
      this.emit('ready');
    });
    this.socket = createSocket('udp4');
    this.socketAudio = createSocket('udp4');
  }
  /**
   * Send a payload to FFmpeg via UDP
   * @param {Buffer} payload The payload
   * @param {boolean} isAudio If the payload is audio
   * @param {*} callback Callback
   */
  sendPayloadToFFmpeg(
    payload,
    isAudio = false,
    callback = e => {
      if (e) {
        console.error('Error sending packet:', e);
      }
    },
  ) {
    const message = Buffer.from(payload);
    if (isAudio && !this.isEnableAudio) {
      return;
    }
    if (isAudio) {
      this.socketAudio.send(message, 0, message.length, this.portUdp + 2, '127.0.0.1', callback);
    } else {
      this.socket.send(message, 0, message.length, this.portUdp, '127.0.0.1', callback);
    }
  }

  destroy() {
    const ffmpegPid = this.stream.pid; // But it is ppid ;-;
    const args = this.stream.spawnargs.slice(1).join(' '); // Skip ffmpeg
    find('name', 'ffmpeg', true).then(list => {
      let process = list.find(o => o.pid === ffmpegPid || o.ppid === ffmpegPid || o.cmd.includes(args));
      if (process) {
        kill(process.pid);
        this.receiver.videoStreams.delete(this.userId);
        this.emit('closed');
      }
    });
  }

  /**
   * Emitted when the FFmpegHandler becomes ready to start working.
   * @event FFmpegHandler#ready
   */

  /**
   * Emitted when the FFmpegHandler is closed.
   * @event FFmpegHandler#closed
   */
}

module.exports = FFmpegHandler;
