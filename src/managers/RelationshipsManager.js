'use strict';

const { Collection } = require('@discordjs/collection');
const { GuildMember } = require('../structures/GuildMember');
const { Message } = require('../structures/Message');
const ThreadMember = require('../structures/ThreadMember');
const User = require('../structures/User');
const { RelationshipTypes } = require('../util/Constants');

/**
 * Manages API methods for Relationships and stores their cache.
 */
class RelationshipsManager {
  constructor(client, users) {
    this.client = client;
    this.cache = new Collection();
    this._setup(users);
  }

  /**
   * @private
   * @param {Array<User>} users An array of users to add to the cache
   * @returns {void}
   */
  _setup(users) {
    if (!Array.isArray(users)) return;
    for (const relationShip of users) {
      this.cache.set(relationShip.id, relationShip.type);
    }
  }

  /**
   * Resolves a {@link UserResolvable} to a {@link User} id.
   * @param {UserResolvable} user The UserResolvable to identify
   * @returns {?Snowflake}
   */
  resolveId(user) {
    if (user instanceof ThreadMember) return user.id;
    if (user instanceof GuildMember) return user.user.id;
    if (user instanceof Message) return user.author.id;
    if (user instanceof User) return user.id;
    return user;
  }

  /**
   * Obtains a user from Discord, or the user cache if it's already available.
   * @param {UserResolvable} user The user to fetch
   * @param {BaseFetchOptions} [options] Additional options for this fetch
   * @returns {Promise<User>}
   */
  async fetch(user, { force = false } = {}) {
    const id = this.resolveId(user);
    if (!force) {
      const existing = this.cache.get(id);
      if (existing && !existing.partial) return existing;
    }

    const data = await this.client.api.users['@me'].relationships.get();
    await this._setup(data);
    return this.cache.get(id);
  }

  // Some option .-.

  async deleteFriend(user) {
    const id = this.resolveId(user);
    // Check if already friends
    if (this.cache.get(id) !== RelationshipTypes.FRIEND) return false;
    await this.client.api.users['@me'].relationships[id].delete(); // 204 status and no data
    return true;
  }

  async deleteBlocked(user) {
    const id = this.resolveId(user);
    // Check if already blocked
    if (this.cache.get(id) !== RelationshipTypes.BLOCKED) return false;
    await this.client.api.users['@me'].relationships[id].delete(); // 204 status and no data
    return true;
  }

  async sendFriendRequest(username, discriminator) {
    await this.client.api.users('@me').relationships.post({
      data: {
        username,
        discriminator: parseInt(discriminator),
      },
    });
    return true;
  }

  async addFriend(user) {
    const id = this.resolveId(user);
    // Check if already friends
    if (this.cache.get(id) === RelationshipTypes.FRIEND) return false;
    // Check if outgoing request
    if (this.cache.get(id) === RelationshipTypes.OUTGOING_REQUEST) return false;
    await this.client.api.users['@me'].relationships[id].put({
      data: {
        type: RelationshipTypes.FRIEND,
      },
    });
    return true;
  }

  async addBlocked(user) {
    const id = this.resolveId(user);
    // Check
    if (this.cache.get(id) === RelationshipTypes.BLOCKED) return false;
    await this.client.api.users['@me'].relationships[id].put({
      data: {
        type: RelationshipTypes.BLOCKED,
      },
    });
    return true;
  }
}

module.exports = RelationshipsManager;
