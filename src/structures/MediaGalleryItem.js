'use strict';

const UnfurledMediaItem = require('./UnfurledMediaItem');

class MediaGalleryItem {
  /**
   * @property {UnfurledMediaItem} [media] A url or attachment
   * @property {String} [description] Alt text for the media, max 1024 characters
   * @property {Boolean} [spoiler] Whether the media should be a spoiler (or blurred out). Defaults to false
   */

  /**
   * @param {MediaGalleryItem | APIMediaGalleryItem} [data={}] The data
   */
  constructor(data = {}) {
    /**
     * A url or attachment
     * @type {UnfurledMediaItem}
     */
    this.media = new UnfurledMediaItem(data.media);

    /**
     * Alt text for the media, max 1024 characters
     * @type {String}
     */
    this.description = data.description ?? null;

    /**
     * Whether the media should be a spoiler (or blurred out). Defaults to false
     * @type {Boolean}
     */
    this.spoiler = data.spoiler ?? false;
  }

  /**
   * @returns {APIMediaGalleryItem}
   */
  toJSON() {
    return {
      media: this.media.toJSON(),
      description: this.description,
      spoiler: this.spoiler,
    };
  }
}

module.exports = MediaGalleryItem;
