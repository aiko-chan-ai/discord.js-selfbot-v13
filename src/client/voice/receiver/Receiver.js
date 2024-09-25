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
   * Emitted whenever there is a video data (Raw)
   * @event VoiceReceiver#videoData
   * @param {number} ssrc SSRC
   * @param {{ userId: Snowflake, hasVideo: boolean }} ssrcData SSRC Data
   * @param {Buffer} header The unencrypted RTP header contains 12 bytes, Buffer<0xbe, 0xde> and the extension size
   * @param {Buffer} packetDecrypt Decrypted contains the extension, if any, the video packet
   * @example
   * // Send packet to VLC
   * const dgram = require('dgram');
   * // Replace these with your actual values
   * const PORT = 5004; // The port VLC is listening on
   * const HOST = '127.0.0.1'; // Your localhost or the IP address of the machine running VLC
   * // Create a UDP socket
   * const socket = dgram.createSocket('udp4');
   * function sendRTPPacket(payload) {
   *   const message = Buffer.from(payload);
   *   socket.send(message, 0, message.length, PORT, HOST, err => {
   *     if (err) {
   *       console.error('Error sending packet:', err);
   *     } else {
   *       console.log(message);
   *     }
   *   });
   * }
   * const connection = await client.voice.joinChannel(channel, {
   *     selfMute: true,
   *     selfDeaf: true,
   *     selfVideo: false,
   *   });
   * connection.receiver.on('videoData', (ssrc, ssrcData, header, packetDecrypt) => {
   *  if (ssrcData.hasVideo) {
   *      header[0] &= 0xef; // Remove the marker bit
   *     // Strip decrypted RTP Header Extension if present
   *     if (header.slice(12, 14).compare(Buffer.from([0xbe, 0xde])) === 0) {
   *       const headerExtensionLength = header.slice(14).readUInt16BE();
   *       packetDecrypt = packetDecrypt.subarray(4 * headerExtensionLength);
   *     }
   *      sendRTPPacket(Buffer.concat([header.slice(0, 12), packetDecrypt]));
   *  }
   * });
   * // VLC SDP file (You can have it with FFmpeg)
   * // ! Very buggy
   * // o=- 0 0 IN IP4 <HOST>
   * // s=No Name
   * // c=IN IP4 <HOST>
   * // t=0 0
   * // a=tool:libavformat 61.1.100
   * // m=video <PORT> RTP/AVP <RTP Dynamic Payload Type>
   * // a=rtpmap:<RTP Dynamic Payload Type> <VP8|VP9|H264|H265>/90000
   */
}

module.exports = VoiceReceiver;
