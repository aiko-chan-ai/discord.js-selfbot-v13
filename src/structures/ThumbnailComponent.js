'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const { UnfurledMediaItem } = require('./UnfurledMediaItem');
const { MessageComponentTypes } = require('../util/Constants');

class ThumbnailComponent extends BaseMessageComponent {
  constructor(data = {}) {
    super({ type: 'THUMBNAIL' });
    this.media = new UnfurledMediaItem(data.media) ?? null;
    this.description = data.description ?? null;
    this.spoiler = data.spoiler ?? false;
  }

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