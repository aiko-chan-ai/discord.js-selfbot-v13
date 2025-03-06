'use strict';

const CachedManager = require('./CachedManager');
const { TypeError } = require('../errors');
const ReadState = require('../structures/ReadState');
const {
  ReadStateTypes,
} = require('../util/Constants');

/**
 * Manages API methods for read states and stores their cache.
 * @extends {CachedManager}
 */
class ReadStateManager extends CachedManager {
  constructor(client) {
    super(client, ReadState);
    this.ackToken = null;
  }
  /**
   * The cache of Read States
   * @type {Collection<ReadStateType, Collection<Snowflake, ReadState>>}
   * @name ReadStateManager#cache
   */

  _setup(readStates) {
    if (!Array.isArray(readStates)) return;
    for (const d of readStates) {
      let type = ReadStateTypes[d.read_state_type ?? 0];
      if (!type) continue;
      
      let cache = this.cache.get(type);
      if (cache) {
        let readState = new ReadState(this.client, d);
        cache.set(readState.id, readState);
      } else {
        cache = new Collection();
        cache.set(readState.id, readState);
        this.cache.set(type, cache);
      }
    }
  }
  
  /**
   * Ack read states in bulk.
   * @returns {Promise<Void>}
   */
  ackBulk(readStates) {
    return this.client.api['read-states']['ack-bulk'].post({
      data: {
        read_states: readStates.map(readState => ({
          channel_id: readState.resourceId,
          message_id: readState.entityId,
          read_state_type: readState.type,
        })),
      },
    });
  }

  /**
   * Acknowledges pins in a channel.
   * @param {ChannelResolvable} channel The channel to ack pins in
   * @returns {Promise<void>}
   */
  ackPins(channel) {
    return this.client.api
      .channels[this.client.channels.resolveId(channel)]
      .pins
      .ack
      .post({ });
  }

  /**
   * Acknowledges a guild.
   * @param {GuildResolvable} guild The guild
   * @returns {Promise<void>}
   */
  ackGuild(guild) {
    return this.client.api
      .guilds[this.client.guilds.resolveId(guild)]
      .ack
      .post({ });
  }
  
  /**
   * Options used to acknowledge a message.
   * @typedef {Object} MessageAckOptions
   * @property {?boolean} [manual] Whether the message is read manually
   * @property {?number} [mentionCount] The new mention count
   */
   
  /**
   * Acknowledges a message.
   * @param {ChannelResolvable} channel The channel
   * @param {string} message The message
   * @param {MessageAckOptions} options The options to ack message
   * @returns {Promise<?string>} The ack token
   */
  ackMessage(channel, message, { manual, mentionCount } = {}) {
    manual = manual === null ? undefined : manual;
    
    let data = {
      token: this.ackToken,
      manual,
    };

    if (mentionCount !== undefined) {
      data.mention_count = mentionCount === null ? 0;
    }

    return this.client.api
      .channels[this.client.channels.resolveId(channel)]
      .messages[message.id ? message.id : message]
      .ack
      .post({ data })
      .then((body) => this.ackToken = body.token);
  }
  
  /**
   * Acknowledges a guild feature.
   * @param {GuildResolvable} guild The guild
   * @param {ReadStateType} type The read state type
   * @param {string} entityId The entity id to ack
   * @returns {Promise<void>}
   */
  ackGuildFeature(guild, type, entityId) {
    if (typeof type === 'string') {
      type = ReadStateTypes.indexOf(type);
      if (type === -1) throw new TypeError('INVALID_READ_STATE_TYPE');
    }
    return this.client.api
      .guilds[this.client.guilds.resolveId(guild)]
      .ack[type][entityId]
      .post({ data: {} });
  }

  /**
   * Acknowledges an user feature.
   * @param {ReadStateType} type The read state type
   * @param {string} entityId The entity id to ack
   * @returns {Promise<void>}
   */
  ackUserFeature(type, entityId) {
    if (typeof type === 'string') {
      type = ReadStateTypes.indexOf(type);
      if (type === -1) throw new TypeError('INVALID_READ_STATE_TYPE');
    }
    return this.client.api
      .users['@me'][type][entity]
      .ack
      .post({ data: {} });
  }
}

module.exports = ReadStateManager;
