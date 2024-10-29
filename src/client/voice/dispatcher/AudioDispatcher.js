'use strict';

const BaseDispatcher = require('./BaseDispatcher');
const Util = require('../../../util/Util');
const Silence = require('../util/Silence');
const VolumeInterface = require('../util/VolumeInterface');

/**
 * @external WritableStream
 * @see {@link https://nodejs.org/api/stream.html#stream_class_stream_writable}
 */

/**
 * The class that sends voice packet data to the voice connection.
 * ```js
 * // Obtained using:
 * client.voice.joinChannel(channel).then(connection => {
 *   // You can play a file or a stream here:
 *   const dispatcher = connection.playAudio('/home/hydrabolt/audio.mp3');
 * });
 * ```
 * @implements {VolumeInterface}
 * @extends {BaseDispatcher}
 */
class AudioDispatcher extends BaseDispatcher {
  constructor(player, { seek = 0, volume = 1, fec, plp, bitrate = 96, highWaterMark = 12 } = {}, streams) {
    const streamOptions = { seek, volume, fec, plp, bitrate, highWaterMark };
    super(player, highWaterMark, Util.getPayloadType('opus'), false, streams);

    this.streamOptions = streamOptions;

    this.streams.silence = new Silence();

    this.setVolume(volume);
    this.setBitrate(bitrate);
    if (typeof fec !== 'undefined') this.setFEC(fec);
    if (typeof plp !== 'undefined') this.setPLP(plp);
  }

  /**
   * Set the bitrate of the current Opus encoder if using a compatible Opus stream.
   * @param {number} value New bitrate, in kbps
   * If set to 'auto', the voice channel's bitrate will be used
   * @returns {boolean} true if the bitrate has been successfully changed.
   */
  setBitrate(value) {
    if (!value || !this.bitrateEditable) return false;
    const bitrate = value === 'auto' ? this.player.voiceConnection.channel.bitrate : value;
    this.streams.opus.setBitrate(bitrate * 1000);
    return true;
  }

  /**
   * Sets the expected packet loss percentage if using a compatible Opus stream.
   * @param {number} value between 0 and 1
   * @returns {boolean} Returns true if it was successfully set.
   */
  setPLP(value) {
    if (!this.bitrateEditable) return false;
    this.streams.opus.setPLP(value);
    return true;
  }

  /**
   * Enables or disables forward error correction if using a compatible Opus stream.
   * @param {boolean} enabled true to enable
   * @returns {boolean} Returns true if it was successfully set.
   */
  setFEC(enabled) {
    if (!this.bitrateEditable) return false;
    this.streams.opus.setFEC(enabled);
    return true;
  }

  get volumeEditable() {
    return Boolean(this.streams.volume);
  }

  /**
   * Whether or not the Opus bitrate of this stream is editable
   * @type {boolean}
   * @readonly
   */
  get bitrateEditable() {
    return this.streams.opus && this.streams.opus.setBitrate;
  }

  // Volume
  get volume() {
    return this.streams.volume ? this.streams.volume.volume : 1;
  }

  setVolume(value) {
    if (!this.streams.volume) return false;
    /**
     * Emitted when the volume of this dispatcher changes.
     * @event AudioDispatcher#volumeChange
     * @param {number} oldVolume The old volume of this dispatcher
     * @param {number} newVolume The new volume of this dispatcher
     */
    this.emit('volumeChange', this.volume, value);
    this.streams.volume.setVolume(value);
    return true;
  }

  // Volume stubs for docs
  /* eslint-disable no-empty-function*/
  get volumeDecibels() {}
  get volumeLogarithmic() {}
  setVolumeDecibels() {}
  setVolumeLogarithmic() {}
}

VolumeInterface.applyToClass(AudioDispatcher);

module.exports = AudioDispatcher;
