'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const UnfurledMediaItem = require('./UnfurledMediaItem');
const { MessageComponentTypes } = require('../util/Constants');


class FileComponent extends BaseMessageComponent {
  /**
   * @property {UnfurledMediaItem} [file] This unfurled media item is unique in that it only supports attachment references using the attachment://<filename> syntax
   * @property {Boolean} [spoiler] Whether the container should be a spoiler (or blurred out). Defaults to false.
   */

  /**
   * @param {} [data={}]
   */
  constructor(data = {}) {
    super({ type: 'FILE' }, data);
    
    /**
     * This unfurled media item is unique in that it only supports attachment references using the attachment://<filename> syntax
     * @type {UnfurledMediaItem} 
     */
    this.file = new UnfurledMediaItem(data.file) ?? null;

    /**
     * Whether the container should be a spoiler (or blurred out). Defaults to false.
     * @type {Boolean}
     */
    this.spoiler = data.spoiler ?? false;
  }

  
  /**
   * @returns {APIFileComponent}  
   */
  toJSON() {
    return {
      type: MessageComponentTypes[this.type],
      file: this.content,
    };
  }
}

module.exports = FileComponent;