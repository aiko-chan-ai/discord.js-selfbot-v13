'use strict';

const { Readable } = require('stream');
const prism = require('prism-media');
const { Error } = require('../../../errors');

/**
 * Options that can be passed to stream-playing methods:
 * @typedef {Object} StreamOptions
 * @property {StreamType} [type='unknown'] The type of stream.
 * @property {number} [seek=0] The time to seek to, will be ignored when playing `ogg/opus` or `webm/opus` streams
 * @property {number|boolean} [volume=1] The volume to play at. Set this to false to disable volume transforms for
 * this stream to improve performance.
 * @property {number} [plp] Expected packet loss percentage
 * @property {boolean} [fec] Enabled forward error correction
 * @property {number|string} [bitrate=96] The bitrate (quality) of the audio in kbps.
 * If set to 'auto', the voice channel's bitrate will be used
 * @property {number} [highWaterMark=12] The maximum number of opus packets to make and store before they are
 * actually needed. See https://nodejs.org/en/docs/guides/backpressuring-in-streams/. Setting this value to
 * 1 means that changes in volume will be more instant.
 */

/**
 * An option passed as part of `StreamOptions` specifying the type of the stream.
 * * `unknown`: The default type, streams/input will be passed through to ffmpeg before encoding.
 * Will play most streams.
 * * `converted`: Play a stream of 16bit signed stereo PCM data, skipping ffmpeg.
 * * `opus`: Play a stream of opus packets, skipping ffmpeg. You lose the ability to alter volume.
 * * `ogg/opus`: Play an ogg file with the opus encoding, skipping ffmpeg. You lose the ability to alter volume.
 * * `webm/opus`: Play a webm file with opus audio, skipping ffmpeg. You lose the ability to alter volume.
 * @typedef {string} StreamType
 */

/**
 * An interface class to allow you to play audio over VoiceConnections.
 */
class PlayInterface {
  constructor(player) {
    this.player = player;
  }

  /**
   * Play an audio resource.
   * @param {ReadableStream|string} resource The resource to play.
   * @param {StreamOptions} [options] The options to play.
   * @example
   * // Play a local audio file
   * connection.playAudio('/home/hydrabolt/audio.mp3', { volume: 0.5 });
   * @example
   * // Play a ReadableStream
   * connection.playAudio(ytdl('https://www.youtube.com/watch?v=ZlAU_w7-Xp8', { quality: 'highestaudio' }));
   * @example
   * // Using different protocols: https://ffmpeg.org/ffmpeg-protocols.html
   * connection.playAudio('http://www.sample-videos.com/audio/mp3/wave.mp3');
   * @returns {AudioDispatcher}
   */
  playAudio(resource, options = {}) {
    if (resource instanceof Readable || typeof resource === 'string') {
      const type = options.type || 'unknown';
      if (type === 'unknown') {
        return this.player.playUnknown(resource, options);
      } else if (type === 'converted') {
        return this.player.playPCMStream(resource, options);
      } else if (type === 'opus') {
        return this.player.playOpusStream(resource, options);
      } else if (type === 'ogg/opus') {
        if (!(resource instanceof Readable)) throw new Error('VOICE_PRISM_DEMUXERS_NEED_STREAM');
        return this.player.playOpusStream(resource.pipe(new prism.opus.OggDemuxer()), options);
      } else if (type === 'webm/opus') {
        if (!(resource instanceof Readable)) throw new Error('VOICE_PRISM_DEMUXERS_NEED_STREAM');
        return this.player.playOpusStream(resource.pipe(new prism.opus.WebmDemuxer()), options);
      }
    }
    throw new Error('VOICE_PLAY_INTERFACE_BAD_TYPE');
  }

  /**
   * Options that can be passed to stream-playing methods:
   * @typedef {Object} VideoOptions
   * @property {number} [seek=0] The time to seek to
   * @property {number} [fps] Video fps
   * @property {number} [highWaterMark=12] The maximum number of opus packets to make and store before they are
   * actually needed. See https://nodejs.org/en/docs/guides/backpressuring-in-streams/. Setting this value to
   * 1 means that changes in volume will be more instant.
   * @property {'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow'} [presetH26x='veryfast'] ffmpeg preset h264
   * @property {boolean} [hwAccel=false]  Enables hardware accelerated video decoding. Enabling this option might result in an exception
   * being thrown by Ffmpeg process if your system does not support hardware acceleration
   * @property {string[]} [inputFFmpegArgs] input ffmpeg
   * Ex: ['-config1', 'value1', '-config2', 'value2']
   * @property {string[]} [outputFFmpegArgs] output ffmpeg
   * Ex: ['-config1', 'value1', '-config2', 'value2']
   * @property {number|'auto'} [bitrate=2000] The bitrate (quality) of the video in kbps.
   * If set to 'auto', ffmpeg will automatically select
   */

  /**
   * Play a video resource.
   * @param {ReadableStream|string} resource The resource to play.
   * @param {VideoOptions} [options] The options to play.
   * @example
   * // Play a local video file
   * connection.playVideo('/home/hydrabolt/video.mp4');
   * @example
   * // Using different protocols: https://ffmpeg.org/ffmpeg-protocols.html
   * connection.playVideo('http://www.sample-videos.com/video/mp4/wave.mp4');
   * @returns {VideoDispatcher}
   */
  playVideo(resource, options = {}) {
    if (resource instanceof Readable || typeof resource === 'string') {
      return this.player.playUnknownVideo(resource, options);
    }
    throw new Error('VOICE_PLAY_INTERFACE_BAD_TYPE');
  }

  static applyToClass(structure) {
    for (const prop of ['playAudio', 'playVideo']) {
      Object.defineProperty(structure.prototype, prop, Object.getOwnPropertyDescriptor(PlayInterface.prototype, prop));
    }
  }
}

module.exports = PlayInterface;
