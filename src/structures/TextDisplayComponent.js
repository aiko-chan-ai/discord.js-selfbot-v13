'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const { MessageComponentTypes } = require('../util/Constants');

class TextDisplayComponent extends BaseMessageComponent {
  /**
   * @property {String} [content] Text that will be displayed similar to a message
   */

  /**
   * @param {TextDisplayComponent | APITextDisplayComponent} [data={}] The data
   */
  constructor(data = {}) {
    super({ type: 'TEXT_DISPLAY' });

    this.setup(data);
  }

  setup(data) {
    super.setup(data);
    /**
     * Text that will be displayed similar to a message
     * @type {String}
     */
    this.content = data.content ?? null;
  }

  /**
   * @returns {APITextDisplayComponent}
   */
  toJSON() {
    return {
      type: MessageComponentTypes[this.type],
      content: this.content,
    };
  }
}

module.exports = TextDisplayComponent;
