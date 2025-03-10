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

const EventEmitter = require('events');
const { Readable: ReadableStream } = require('stream');
const prism = require('prism-media');
const { H264NalSplitter, H265NalSplitter } = require('./processing/AnnexBNalSplitter');
const { IvfTransformer } = require('./processing/IvfSplitter');
const { H264Dispatcher } = require('../dispatcher/AnnexBDispatcher');
const AudioDispatcher = require('../dispatcher/AudioDispatcher');
const { VP8Dispatcher } = require('../dispatcher/VPxDispatcher');

const FFMPEG_OUTPUT_PREFIX = ['-use_wallclock_as_timestamps', '1', '-copyts', '-analyzeduration', '0'];
const FFMPEG_INPUT_PREFIX = [
  '-reconnect',
  '1',
  '-reconnect_at_eof',
  '1',
  '-reconnect_streamed',
  '1',
  '-reconnect_delay_max',
  '4294',
];
const FFMPEG_PCM_ARGUMENTS = ['-f', 's16le', '-ar', '48000', '-ac', '2'];
const FFMPEG_VP8_ARGUMENTS = ['-f', 'ivf', '-deadline', 'realtime', '-c:v', 'libvpx'];
const FFMPEG_H264_ARGUMENTS = options => [
  '-c:v',
  'libx264',
  '-f',
  'h264',
  '-tune',
  'zerolatency',
  // '-pix_fmt',
  // 'yuv420p',
  '-preset',
  options?.presetH26x || 'faster',
  '-profile:v',
  'baseline',
  // '-g',
  // `${options?.fps}`,
  // '-x264-params',
  // `keyint=${options?.fps}:min-keyint=${options?.fps}`,
  '-bf',
  '0',
  '-bsf:v',
  'h264_metadata=aud=insert',
];

const FFMPEG_H265_ARGUMENTS = options => [
  '-c:v',
  'libx265',
  '-f',
  'hevc',
  '-preset',
  options?.presetH265 || 'faster',
  '-profile:v',
  'main',
  '-bf',
  '0',
];

/**
 * Player for a Voice Connection.
 * @private
 * @extends {EventEmitter}
 */
class MediaPlayer extends EventEmitter {
  constructor(voiceConnection, isScreenSharing) {
    super();

    this.dispatcher = null;

    this.videoDispatcher = null;
    /**
     * The voice connection that the player serves
     * @type {VoiceConnection}
     */
    this.voiceConnection = voiceConnection;

    this.isScreenSharing = isScreenSharing;
  }

  destroy() {
    this.destroyDispatcher();
    this.destroyVideoDispatcher();
  }

  destroyDispatcher() {
    if (this.dispatcher) {
      this.dispatcher.destroy();
      this.dispatcher = null;
    }
  }

  destroyVideoDispatcher() {
    if (this.videoDispatcher) {
      this.videoDispatcher.destroy();
      this.videoDispatcher = null;
    }
  }

  playUnknown(input, options, streams = {}) {
    this.destroyDispatcher();
    const isStream = input instanceof ReadableStream;
    const args = [...FFMPEG_OUTPUT_PREFIX, ...FFMPEG_PCM_ARGUMENTS];
    if (!isStream) args.unshift('-i', input);
    if (options.seek) args.unshift('-ss', String(options.seek));
    // Check input
    if (typeof input == 'string' && input.startsWith('http')) {
      args.unshift(...FFMPEG_INPUT_PREFIX);
    }

    const ffmpeg = new prism.FFmpeg({ args });
    this.emit('debug', `[ffmpeg-audio_process] Spawn process with args:\n${args.join(' ')}`);

    ffmpeg.process.stderr.on('data', data => {
      this.emit('debug', `[ffmpeg-audio_process]: ${data.toString()}`);
    });

    streams.ffmpeg = ffmpeg;
    if (isStream) {
      streams.input = input;
      input.pipe(ffmpeg);
    }
    return this.playPCMStream(ffmpeg, options, streams);
  }

  playPCMStream(stream, options, streams = {}) {
    this.destroyDispatcher();
    const opus = (streams.opus = new prism.opus.Encoder({ channels: 2, rate: 48000, frameSize: 960 }));
    if (options && options.volume === false) {
      stream.pipe(opus);
      return this.playOpusStream(opus, options, streams);
    }
    streams.volume = new prism.VolumeTransformer({ type: 's16le', volume: options ? options.volume : 1 });
    stream.pipe(streams.volume).pipe(opus);
    return this.playOpusStream(opus, options, streams);
  }

  playOpusStream(stream, options, streams = {}) {
    this.destroyDispatcher();
    streams.opus = stream;
    if (options.volume !== false && !streams.input) {
      streams.input = stream;
      const decoder = new prism.opus.Decoder({ channels: 2, rate: 48000, frameSize: 960 });
      streams.volume = new prism.VolumeTransformer({ type: 's16le', volume: options ? options.volume : 1 });
      streams.opus = stream
        .pipe(decoder)
        .pipe(streams.volume)
        .pipe(new prism.opus.Encoder({ channels: 2, rate: 48000, frameSize: 960 }));
    }
    const dispatcher = this.createDispatcher(options, streams);
    streams.opus.pipe(dispatcher);
    return dispatcher;
  }

  playUnknownVideo(input, options = {}) {
    this.destroyVideoDispatcher();
    const isStream = input instanceof ReadableStream;
    if (!options?.fps) options.fps = 30;

    const args = [
      '-i',
      isStream ? '-' : input,
      ...FFMPEG_OUTPUT_PREFIX,
      '-flags',
      'low_delay',
      '-r',
      `${options?.fps}`,
    ];

    if (options?.bitrate && typeof options?.bitrate === 'number') {
      args.push('-b:v', `${options?.bitrate}K`);
    }

    if (options?.hwAccel === true) {
      args.unshift('-hwaccel', 'auto');
    }

    if (options.seek) args.unshift('-ss', String(options.seek));

    // Check input
    if (typeof input == 'string' && input.startsWith('http')) {
      args.unshift(...FFMPEG_INPUT_PREFIX);
    }

    // Get stream type
    if (this.voiceConnection.videoCodec === 'VP8') {
      args.push(...FFMPEG_VP8_ARGUMENTS);
      // Remove  '-speed', '5' bc bad quality
    }

    if (this.voiceConnection.videoCodec === 'H264') {
      args.push(...FFMPEG_H264_ARGUMENTS(options));
    }

    if (this.voiceConnection.videoCodec === 'H265') {
      args.push(...FFMPEG_H265_ARGUMENTS(options));
    }

    args.push('-force_key_frames', '00:02');

    if (options?.inputFFmpegArgs) {
      args.unshift(...options.inputFFmpegArgs);
    }

    if (options?.outputFFmpegArgs) {
      args.push(...options.outputFFmpegArgs);
    }

    const ffmpeg = new prism.FFmpeg({ args });
    const streams = { ffmpeg };

    if (isStream) {
      streams.input = input;
      input.pipe(ffmpeg);
    }

    this.emit('debug', `[ffmpeg-video_process] Spawn process with args:\n${args.join(' ')}`);

    ffmpeg.process.stderr.on('data', data => {
      this.emit('debug', `[ffmpeg-video_process]: ${data.toString()}`);
    });

    switch (this.voiceConnection.videoCodec) {
      case 'VP8': {
        return this.playIvfVideo(ffmpeg, options, streams);
      }
      case 'H264': {
        return this.playAnnexBVideo(ffmpeg, options, streams, 'H264');
      }
      default: {
        throw new Error('Invalid codec (Supported: VP8, H264)');
      }
    }
  }

  playIvfVideo(stream, options, streams) {
    this.destroyVideoDispatcher();
    const videoStream = new IvfTransformer();
    stream.pipe(videoStream);
    streams.video = videoStream;
    const dispatcher = this.createVideoDispatcher(options, streams);
    videoStream.pipe(dispatcher);
    return dispatcher;
  }

  // eslint-disable-next-line no-unused-vars
  playAnnexBVideo(stream, options, streams, type) {
    this.destroyVideoDispatcher();
    let videoStream;
    if (type === 'H264') {
      videoStream = new H264NalSplitter();
    } else if (type === 'H265') {
      videoStream = new H265NalSplitter();
    }
    stream.pipe(videoStream);
    streams.video = videoStream;
    const dispatcher = this.createVideoDispatcher(options, streams);
    videoStream.pipe(dispatcher);
    return dispatcher;
  }

  createDispatcher(options, streams) {
    this.destroyDispatcher();
    const dispatcher = (this.dispatcher = new AudioDispatcher(this, options, streams));
    return dispatcher;
  }

  /**
   * Create
   * @private
   * @param {Object} options any
   * @param {Object} streams any
   * @returns {VideoDispatcher}
   */
  createVideoDispatcher(options, streams) {
    this.destroyVideoDispatcher();
    switch (this.voiceConnection.videoCodec) {
      case 'VP8': {
        const dispatcher = (this.videoDispatcher = new VP8Dispatcher(
          this,
          options?.highWaterMark,
          streams,
          options?.fps,
        ));
        return dispatcher;
      }
      case 'H264': {
        const dispatcher = (this.videoDispatcher = new H264Dispatcher(
          this,
          options?.highWaterMark,
          streams,
          options?.fps,
        ));
        return dispatcher;
      }
      default: {
        throw new Error('Invalid codec');
      }
    }
  }
}

module.exports = MediaPlayer;
