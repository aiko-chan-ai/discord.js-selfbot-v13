'use strict';

class UnfurledMediaItem {
  /**
   * @property {string} [url] Supports arbitrary urls and `attachment://<filename>` references
  */
  /**
   * @param {UnfurledMediaItem | APIUnfurledMediaItem} [data={}] The data
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