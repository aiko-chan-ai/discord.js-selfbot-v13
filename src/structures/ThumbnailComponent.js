'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const UnfurledMediaItem = require('./UnfurledMediaItem');
const { MessageComponentTypes } = require('../util/Constants');

class ThumbnailComponent extends BaseMessageComponent {
  /**
   * @property {UnfurledMediaItem} [media] A url or attachment
   * @property {String} [description] 	Alt text for the media, max 1024 characters
   * @property {Boolean} [spoiler] Whether the thumbnail should be a spoiler (or blurred out). Defaults to false
   */

  /**
   * @param {ThumbnailComponent | APIThumbnailComponent} [data={}]
   */
  constructor(data = {}) {
    super({ type: 'THUMBNAIL' }, data);
    this.media = new UnfurledMediaItem(data.media);
    this.description = data.description ?? null;
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