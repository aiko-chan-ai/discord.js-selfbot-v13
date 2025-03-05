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
   * Acknowledges a message.
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
   * @returns {Promise<void>}
   */
  ackGuildFeature(guild, type, entity) {
    if (typeof type === 'string') {
      type = ReadStateTypes.indexOf(type);
      if (type === -1) throw new TypeError('INVALID_READ_STATE_TYPE');
    }
    return this.client.api
      .guilds[this.client.guilds.resolveId(guild)]
      .ack[type][entity.id ? entity.id : entity]
      .post({ data: {} });
  }

  /**
   * Acknowledges an user feature.
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
