'use strict';

const { Collection } = require('@discordjs/collection');
const BaseManager = require('./BaseManager');

/**
 * Manages API methods for users and stores their cache.
 * @extends {BaseManager}
 */
class GuildFolderManager extends BaseManager {
  constructor(client) {
    super(client);
    /**
     * The guild folder cache (Index, GuildFolder)
     * @type {Collection<number, GuildFolder>}
     */
    this.cache = new Collection();
  }
  _refresh() {
    this.cache.clear();
  }
}

module.exports = GuildFolderManager;
