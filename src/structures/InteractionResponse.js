'use strict';

const { setTimeout } = require('node:timers');
const Base = require('./Base');
const { Events } = require('../util/Constants');
const SnowflakeUtil = require('../util/SnowflakeUtil');

/**
 * Represents a interaction on Discord.
 * @extends {Base}
 */
class InteractionResponse extends Base {
  constructor(client, data) {
    super(client);
    /**
     * The id of the channel the interaction was sent in
     * @type {Snowflake}
     */
    this.channelId = data.channelId;

    /**
     * The id of the guild the interaction was sent in, if any
     * @type {?Snowflake}
     */
    this.guildId = data.guildId ?? this.channel?.guild?.id ?? null;

    /**
     * The interaction data was sent in
     * @type {Object}
     */
    this.sendData = data.metadata;
    this._patch(data);
  }

  _patch(data) {
    if ('id' in data) {
      /**
       * The interaction response's ID
       * @type {Snowflake}
       */
      this.id = data.id;
    }
    if ('nonce' in data) {
      /**
       * The interaction response's nonce
       * @type {Snowflake}
       */
      this.nonce = data.nonce;
    }
  }
  /**
   * The timestamp the interaction response was created at
   * @type {number}
   * @readonly
   */
  get createdTimestamp() {
    return SnowflakeUtil.timestampFrom(this.id);
  }

  /**
   * The time the interaction response was created at
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return new Date(this.createdTimestamp);
  }

  /**
   * The channel that the interaction was sent in
   * @type {TextBasedChannels}
   * @readonly
   */
  get channel() {
    return this.client.channels.resolve(this.channelId);
  }

  /**
   * The guild the inteaaction was sent in (if in a guild channel)
   * @type {?Guild}
   * @readonly
   */
  get guild() {
    return this.client.guilds.resolve(this.guildId) ?? this.channel?.guild ?? null;
  }

  /**
   * Get Modal send from interaction
   * @param {number} time Time to wait for modal
   * @returns {Modal}
   */
  awaitModal(time) {
    if (!time || typeof time !== 'number' || time < 0) throw new Error('INVALID_TIME');
    return new Promise((resolve, reject) => {
      const handler = modal => {
        timeout.refresh();
        if (modal.nonce != this.nonce || modal.id != this.id) return;
        clearTimeout(timeout);
        this.client.removeListener(Events.INTERACTION_MODAL_CREATE, handler);
        this.client.decrementMaxListeners();
        resolve(modal);
      };
      const timeout = setTimeout(() => {
        this.client.removeListener(Events.INTERACTION_MODAL_CREATE, handler);
        this.client.decrementMaxListeners();
        reject(new Error('MODAL_TIMEOUT'));
      }, time).unref();
      this.client.incrementMaxListeners();
      this.client.on(Events.INTERACTION_MODAL_CREATE, handler);
    });
  }
}

module.exports = InteractionResponse;
