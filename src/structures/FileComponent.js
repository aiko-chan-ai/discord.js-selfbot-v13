'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const { UnfurledMediaItem } = require('./UnfurledMediaItem');
const { MessageComponentTypes } = require('../util/Constants');

class FileComponent extends BaseMessageComponent {
  constructor(data = {}) {
    super({ type: 'FILE' });
    this.file = new UnfurledMediaItem(data.file) ?? null;
    this.spoiler = data.spoiler ?? false;
  }

  toJSON() {
    return {
      type: MessageComponentTypes[this.type],
      file: this.content,
    };
  }
}

module.exports = FileComponent;