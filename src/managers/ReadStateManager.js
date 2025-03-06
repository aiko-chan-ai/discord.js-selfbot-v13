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
   * Options used to get a read state.
   * @typedef {Object} ReadStateGetOptions
   * @property {boolean} [ifExists=false] Whether to create a new one if read state doesn't exist
   * @property {string} [lastAckedId='0'] The default acked id for new read states
   * @property {?Date} [lastPinTimestamp] When the channel pins were last acknowledged (only applicable to new read states)
   * @property {?number} [lastViewed} Days since 2015 when the resource was last viewed
   * @property {ReadStateType} [type='CHANNEL'] The read state type
   */

  /**
   * Gets a read state for resource or creates a new one if it doesn't
   * @param {string} resourceId The id of the resource to get read state of
   * @param {ReadStateGetOptions} options Options for getting read state
   */
  get(resourceId, {
    ifExists = false,
    lastAckedId = '0',
    lastPinTimestamp = undefined,
    lastViewed = undefined,
    type = 'CHANNEL',
  } = {}) {
    if (typeof type === 'number') {
      type = ReadStateTypes[type];
      if (!type) throw new TypeError('INVALID_READ_STATE_TYPE');
    }

    let cache = this.cache.get(type);
    if (!cache) {
      if (ifExists) return null;
      cache = new Collection();
      this.cache.set(type, cache);
    }

    let readState = cache.get(resourceId);
    
    if (readState) {
      return readState;
    } else if (ifExists) {
      return null;
    }

    readState = new ReadState(this.client, {
      id: resourceId,
      read_state_type: ReadStateTypes[type],
      badge_count: badgeCount ?? 0,
      last_viewed: lastViewed ?? 0,
      last_pin_timestamp: lastPinTimestamp?.toISOString() ?? null,
      last_acked_id: lastAckedId,
    });
    cache.set(readState.id, readState);
    return readState;
  })
  
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
      .post();
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
      .post();
  }
  
  /**
   * Options used to acknowledge a message.
   * @typedef {Object} MessageAckOptions
   * @property {?number} [lastViewed} Days since 2015 when you last viewed channel
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
  ackMessage(channel, message, { lastViewed, manual, mentionCount } = {}) {
    manual = manual === null ? undefined : manual;
    
    let data = manual ? {
      manual,
    } : {
      token: this.ackToken,
      manual,
    };

    if (lastViewed !== undefined) data.last_viewed = lastViewed;
    if (mentionCount !== undefined) data.mention_count = mentionCount === null ? 0 : mentionCount;

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

  /**
   * Deletes a read state
   * @param {string} resourceId The resource id to delete read state of
   * @param {ReadStateType} type The read state type
   * @returns {Promise<void>}
   */
  delete(resourceId, type) {
    if (typeof type === 'string') {
      type = ReadStateTypes.indexOf(type);
      if (type === -1) throw new TypeError('INVALID_READ_STATE_TYPE');
    }

    return this.client.api
      .channels[resourceId]
      .messages
      .ack
      .delete({
        data: {
          version: 2,
          read_state_type: type,
        },
      })
      .then(() => this.cache.get(ReadStateTypes[type])?.delete(resourceId));
  }
}

module.exports = ReadStateManager;
