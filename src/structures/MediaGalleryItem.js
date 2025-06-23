'use strict';

const { UnfurledMediaItem } = require('./UnfurledMediaItem');

class MediaGalleryItem {
  constructor(data = {}) {
    this.media = new UnfurledMediaItem(data.media);
    this.description = data.description ?? null;
    this.spoiler = data.spoiler ?? false;
  }

  toJSON() {
    return {
      media: this.media.toJSON(),
      description: this.description,
      spoiler: this.spoiler,
    };
  }
}

module.exports = MediaGalleryItem;