'use strict';

class UnfurledMediaItem {
  constructor(data = {}) {
    this.url = data.url ?? null;
  }

  toJSON() {
    return {
      url: this.url,
    };
  }
}

module.exports = UnfurledMediaItem;