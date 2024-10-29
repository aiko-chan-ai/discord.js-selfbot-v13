'use strict';

const EventEmitter = require('events');
const prism = require('prism-media');
const PacketHandler = require('./PacketHandler');
const { Error } = require('../../../errors');

/**
 * Receives audio packets from a voice connection.
 * @example
 * const receiver = connection.createReceiver();
 * // opusStream is a ReadableStream - that means you could play it back to a voice channel if you wanted to!
 * const opusStream = receiver.createStream(user);
 */
class VoiceReceiver extends EventEmitter {
  constructor(connection) {
    super();
    this.connection = connection;
    this.packets = new PacketHandler(this);
    /**
     * Emitted whenever there is a warning
     * @event VoiceReceiver#debug
     * @param {Error|string} error The error or message to debug
     */
    this.packets.on('error', err => this.emit('debug', err));
  }

  /**
   * Options passed to `VoiceReceiver#createStream`.
   * @typedef {Object} ReceiveStreamOptions
   * @property {string} [mode='opus'] The mode for audio output. This defaults to opus, meaning discord.js won't decode
   * the packets for you. You can set this to 'pcm' so that the stream's output will be 16-bit little-endian stereo
   * audio
   * @property {string} [end='silence'] When the stream should be destroyed. If `silence`, this will be when the user
   * stops talking. Otherwise, if `manual`, this should be handled by you.
   */

  /**
   * Creates a new audio receiving stream. If a stream already exists for a user, then that stream will be returned
   * rather than generating a new one.
   * @param {UserResolvable} user The user to start listening to.
   * @param {ReceiveStreamOptions} options Options.
   * @returns {ReadableStream}
   */
  createStream(user, { mode = 'opus', end = 'silence' } = {}) {
    user = this.connection.client.users.resolve(user);
    if (!user) throw new Error('VOICE_USER_MISSING');
    const stream = this.packets.makeStream(user.id, end);
    if (mode === 'pcm') {
      const decoder = new prism.opus.Decoder({ channels: 2, rate: 48000, frameSize: 960 });
      stream.pipe(decoder);
      return decoder;
    }
    return stream;
  }

  /**
   * Options passed to `VoiceReceiver#createVideoStream`.
   * @typedef {Object} ReceiveVideoStreamOptions
   * @property {number} portUdp The UDP port to use for the video stream (local stream).
   * @property {WritableStream|string} output Output stream or file path to write the video stream to.
   * @property {boolean} [isEnableAudio=false] Enable audio for the video stream.
   * <info>If you intend to record the stream with audio, make sure that `portUdp` and `portUdp + 2` are not in use.</info>
   */

  /**
   * Creates a new video receiving stream. If a stream already exists for a user, then that stream will be returned
   * rather than generating a new one.
   * <info>Proof of concept - Requires a very good internet connection</info>
   * @param {UserResolvable} user The user to start listening to.
   * @param {ReceiveVideoStreamOptions} options Options.
   * @returns {FFmpegHandler} The video stream for the specified user.
   */
  createVideoStream(user, { portUdp, output, isEnableAudio = false } = {}) {
    user = this.connection.client.users.resolve(user);
    if (!user) throw new Error('VOICE_USER_MISSING');
    const stream = this.packets.makeVideoStream(user.id, portUdp, 'H264', output, isEnableAudio);
    return stream;
  }

  /**
   * Emitted whenever there is a video data (Raw)
   * @event VoiceReceiver#videoData
   * @param {number} ssrc SSRC
   * @param {{ userId: Snowflake, hasVideo: boolean }} ssrcData SSRC Data
   * @param {Buffer} header The unencrypted RTP header contains 12 bytes, Buffer<0xbe, 0xde> and the extension size
   * @param {Buffer} packetDecrypt Decrypted contains the extension, if any, the video packet
   */
}

module.exports = VoiceReceiver;
