'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const UnfurledMediaItem = require('./UnfurledMediaItem');
const { MessageComponentTypes } = require('../util/Constants');

class ThumbnailComponent extends BaseMessageComponent {
  /**
   * @property {UnfurledMediaItem} [media] A url or attachment
   * @property {String} [description] Alt text for the media, max 1024 characters
   * @property {Boolean} [spoiler] Whether the thumbnail should be a spoiler (or blurred out). Defaults to false
   */

  /**
   * @param {ThumbnailComponent | APIThumbnailComponent} [data={}] The data
   */
  constructor(data = {}) {
    super({ type: 'THUMBNAIL' });

    this.setup(data);
  }

  setup(data) {
    super.setup(data);
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
     * Whether the thumbnail should be a spoiler (or blurred out). Defaults to false
     * @type {Boolean}
     */
    this.spoiler = data.spoiler ?? false;
  }

  /**
   * @returns {APIThumbnailComponent}
   */
  toJSON() {
    return {
      type: MessageComponentTypes[this.type],
      media: this.media.toJSON(),
      description: this.description,
      spoiler: this.spoiler,
    };
  }
}

module.exports = ThumbnailComponent;
