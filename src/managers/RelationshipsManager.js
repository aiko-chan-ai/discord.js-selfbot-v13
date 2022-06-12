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
    /**
     * The client that instantiated this manager.
     * @type {Client}
     */
    this.client = client;
    /**
     * A collection of users this manager is caching. (Type: Number)
     * @type {Collection<Snowflake, RelationshipTypes>}
     * @readonly
     */
    this.cache = new Collection();
    this._setup(users);
  }

  /**
   * Return array of cache
   * @returns {Array<{id: Snowflake, type: RelationshipTypes}>}
   */
  toArray() {
    return this.cache.map((value, key) => ({ id: key, type: RelationshipTypes[value] }));
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

  /**
   * Deletes a friend relationship with a client user.
   * @param {User} user Target
   * @returns {Promise<boolean>}
   */
  async deleteFriend(user) {
    const id = this.resolveId(user);
    // Check if already friends
    if (this.cache.get(id) !== RelationshipTypes.FRIEND) return false;
    await this.client.api.users['@me'].relationships[id].delete(); // 204 status and no data
    return true;
  }

  /**
   * Deletes a blocked relationship with a client user.
   * @param {User} user Target
   * @returns {Promise<boolean>}
   */
  async deleteBlocked(user) {
    const id = this.resolveId(user);
    // Check if already blocked
    if (this.cache.get(id) !== RelationshipTypes.BLOCKED) return false;
    await this.client.api.users['@me'].relationships[id].delete(); // 204 status and no data
    return true;
  }

  /**
   * Sends a friend request.
   * @param {string} username Username of the user to send the request to
   * @param {number} discriminator Discriminator of the user to send the request to
   * @returns {Promise<boolean>}
   */
  async sendFriendRequest(username, discriminator) {
    await this.client.api.users('@me').relationships.post({
      data: {
        username,
        discriminator: parseInt(discriminator),
      },
    });
    return true;
  }

  /**
   * Accepts a friend request.
   * @param {UserResolvable} user The user to add as a friend
   * @returns {Promise<boolean>}
   */
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

  /**
   * Blocks a user.
   * @param {UserResolvable} user User to block
   * @returns {Promise<boolean>}
   */
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
