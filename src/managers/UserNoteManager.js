'use strict';

const { Collection } = require('@discordjs/collection');
const BaseManager = require('./BaseManager');

/**
 * Manages API methods for Client and stores their cache.
 * @extends {BaseManager}
 */
class UserNoteManager extends BaseManager {
  constructor(client, data = {}) {
    super(client);
    /**
     * Cache User Note
     * @type {Collection<Snowflake, string>}
     */
    this.cache = new Collection(Object.entries(data));
  }

  _reload(data = {}) {
    this.cache = new Collection(Object.entries(data));
    return this;
  }

  async updateNote(id, note = null) {
    await this.client.api.users['@me'].notes(id).put({ data: { note } });
    if (!note) this.cache.delete(id, note);
    else this.cache.set(id, note);
    return this;
  }
}

module.exports = UserNoteManager;
