'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const { MediaGalleryItem } = require('./MediaGalleryItem');
const { MessageComponentTypes } = require('../util/Constants');

class MediaGalleryComponent extends BaseMessageComponent {
  constructor(data = {}) {
    super({ type: 'MEDIA_GALLERY' });
    this.items = data.items?.map(item => new MediaGalleryItem(item)) ?? [];
  }

  toJSON() {
    return {
      type: MessageComponentTypes[this.type],
      items: this.items.map(c => c.toJSON()),
    };
  }
}

module.exports = MediaGalleryComponent;