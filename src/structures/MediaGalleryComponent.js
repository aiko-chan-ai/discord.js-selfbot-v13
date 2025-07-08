'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const MediaGalleryItem = require('./MediaGalleryItem');
const { MessageComponentTypes } = require('../util/Constants');

class MediaGalleryComponent extends BaseMessageComponent {
  /**
   * @property {MediaGalleryItem[]} [items] 1 to 10 media gallery items
   */

  /**
   * @param {MediaGalleryComponent | APIMediaGalleryComponent} [data={}] The data
   */
  constructor(data = {}) {
    super({ type: 'MEDIA_GALLERY' });

    this.setup(data);
  }

  setup(data) {
    super.setup(data);
    /**
     * 1 to 10 media gallery items
     * @type {MediaGalleryItem[]}
     */
    this.items = data.items?.map(item => new MediaGalleryItem(item)) ?? [];
  }

  /**
   * @returns {APIMediaGalleryComponent}
   */
  toJSON() {
    return {
      type: MessageComponentTypes[this.type],
      items: this.items.map(c => c.toJSON()),
    };
  }
}

module.exports = MediaGalleryComponent;
