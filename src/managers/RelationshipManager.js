'use strict';

const Buffer = require('node:buffer').Buffer;
const { Collection } = require('@discordjs/collection');
const { GuildMember } = require('../structures/GuildMember');
const { Message } = require('../structures/Message');
const ThreadMember = require('../structures/ThreadMember');
const User = require('../structures/User');
const { RelationshipTypes } = require('../util/Constants');

/**
 * Manages API methods for Relationships and stores their cache.
 */
class RelationshipManager {
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
   * Get all friends
   * @type {Collection<Snowflake, User>}
   * @readonly
   */
  get friendCache() {
    const users = this.cache
      .filter(value => value === RelationshipTypes.FRIEND)
      .map((value, key) => [key, this.client.users.cache.get(key)]);
    return new Collection(users);
  }

  /**
   * Get all blocked users
   * @type {Collection<Snowflake, User>}
   * @readonly
   */
  get blockedCache() {
    const users = this.cache
      .filter(value => value === RelationshipTypes.BLOCKED)
      .map((value, key) => [key, this.client.users.cache.get(key)]);
    return new Collection(users);
  }

  /**
   * Get all incoming friend requests
   * @type {Collection<Snowflake, User>}
   * @readonly
   */
  get incomingCache() {
    const users = this.cache
      .filter(value => value === RelationshipTypes.PENDING_INCOMING)
      .map((value, key) => [key, this.client.users.cache.get(key)]);
    return new Collection(users);
  }

  /**
   * Get all outgoing friend requests
   * @type {Collection<Snowflake, User>}
   * @readonly
   */
  get outgoingCache() {
    const users = this.cache
      .filter(value => value === RelationshipTypes.PENDING_OUTGOING)
      .map((value, key) => [key, this.client.users.cache.get(key)]);
    return new Collection(users);
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
      this.client.user.friendNicknames.set(relationShip.id, relationShip.nickname);
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
   * @param {UserResolvable} [user] The user to fetch
   * @param {BaseFetchOptions} [options] Additional options for this fetch
   * @returns {Promise<RelationshipTypes|RelationshipManager>}
   */
  async fetch(user, { force = false } = {}) {
    if (user) {
      const id = this.resolveId(user);
      if (!force) {
        const existing = this.cache.get(id);
        if (existing && !existing.partial) return existing;
      }
      const data = await this.client.api.users['@me'].relationships.get();
      await this._setup(data);
      return this.cache.get(id);
    } else {
      const data = await this.client.api.users['@me'].relationships.get();
      await this._setup(data);
      return this;
    }
  }

  /**
   * Deletes a friend relationship with a client user.
   * @param {UserResolvable} user Target
   * @returns {Promise<boolean>}
   */
  deleteFriend(user) {
    const id = this.resolveId(user);
    // Check if already friends
    if (this.cache.get(id) !== RelationshipTypes.FRIEND) return false;
    return this.__cancel(id);
  }

  /**
   * Deletes a blocked relationship with a client user.
   * @param {UserResolvable} user Target
   * @returns {Promise<boolean>}
   */
  deleteBlocked(user) {
    const id = this.resolveId(user);
    // Check if already blocked
    if (this.cache.get(id) !== RelationshipTypes.BLOCKED) return false;
    return this.__cancel(id);
  }

  /**
   * Sends a friend request.
   * @param {string} username Username of the user to send the request to
   * @param {?number} discriminator Discriminator of the user to send the request to
   * @returns {Promise<boolean>}
   */
  async sendFriendRequest(username, discriminator) {
    await this.client.api.users('@me').relationships.post({
      data: {
        username,
        discriminator: discriminator == 0 ? null : parseInt(discriminator),
      },
      headers: {
        'X-Context-Properties': Buffer.from(JSON.stringify({ location: 'Add Friend' }), 'utf8').toString('base64'),
      },
    });
    return true;
  }

  /**
   * Cancels a friend request.
   * @param {UserResolvable} user  the user you want to delete
   * @returns {Promise<boolean>}
   */
  cancelFriendRequest(user) {
    const id = this.resolveId(user);
    if (this.cache.get(id) !== RelationshipTypes.PENDING_OUTGOING) return false;
    return this.__cancel(id);
  }

  async __cancel(id) {
    await this.client.api.users['@me'].relationships[id].delete({
      headers: {
        'X-Context-Properties': Buffer.from(JSON.stringify({ location: 'Friends' }), 'utf8').toString('base64'),
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
    if (this.cache.get(id) === RelationshipTypes.PENDING_OUTGOING) return false;
    await this.client.api.users['@me'].relationships[id].put({
      data: {
        type: RelationshipTypes.FRIEND,
      },
      headers: {
        'X-Context-Properties': Buffer.from(JSON.stringify({ location: 'Friends' }), 'utf8').toString('base64'),
      },
    });
    return true;
  }

  /**
   * Changes the nickname of a friend.
   * @param {UserResolvable} user The user to change the nickname
   * @param {?string} nickname New nickname
   * @returns {Promise<boolean>}
   */
  async setNickname(user, nickname) {
    const id = this.resolveId(user);
    if (this.cache.get(id) !== RelationshipTypes.FRIEND) return false;
    await this.client.api.users['@me'].relationships[id].patch({
      data: {
        nickname: typeof nickname === 'string' ? nickname : null,
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
      headers: {
        'X-Context-Properties': Buffer.from(JSON.stringify({ location: 'ContextMenu' }), 'utf8').toString('base64'),
      },
    });
    return true;
  }
}

module.exports = RelationshipManager;
