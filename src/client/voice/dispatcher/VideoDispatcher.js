'use strict';

const BaseDispatcher = require('./BaseDispatcher');

/**
 * The class that sends video packet data to the voice connection.
 * ```js
 * // Obtained using:
 * client.voice.joinChannel(channel).then(connection => {
 *   // You can play a file or a stream here:
 *   const dispatcher = connection.playVideo('/home/hydrabolt/video.mp4', { fps: 60, preset: 'ultrafast' });
 * });
 * ```
 * @extends {BaseDispatcher}
 */
class VideoDispatcher extends BaseDispatcher {
  constructor(player, highWaterMark = 12, streams, fps) {
    super(player, highWaterMark, 101, true, streams);
    this.fps = fps;
  }

  /**
   * Set FPS
   * @param {number} value fps
   */
  setFPSSource(value) {
    this.fps = value;
  }
}

module.exports = VideoDispatcher;
