'use strict';

class UnfurledMediaItem {
  /**
   * 
   * @param {*} data 
   */
  constructor(data = {}) {
    /**
     * @type {string}
     */
    this.url = data.url ?? null;
  }
  /**
   * 
   * @returns {APIUnfurledMediaItem}
   */
  toJSON() {
    return {
      url: this.url,
    };
  }
}

module.exports = UnfurledMediaItem;