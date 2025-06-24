'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const { MessageComponentTypes } = require('../util/Constants');

class TextDisplayComponent extends BaseMessageComponent {
  constructor(data = {}) {
    super({ type: 'TEXT_DISPLAY' }, data);
    this.content = data.content ?? null;
  }

  toJSON() {
    return {
      type: MessageComponentTypes[this.type],
      content: this.content,
    };
  }
}

module.exports = TextDisplayComponent;