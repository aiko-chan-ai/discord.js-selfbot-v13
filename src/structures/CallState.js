'use strict';

const { Collection } = require('@discordjs/collection');
const Base = require('./Base');

/**
 * Represents a call
 * @extends {Base}
 */
class CallState extends Base {
  constructor(client, data) {
    super(client);
    /**
     * The channel ID of the call
     * @type {Snowflake}
     */
    this.channelId = data.channel_id;

    this._ringing = [];

    this._patch(data);
  }

  _patch(data) {
    if ('region' in data) {
      /**
       * The region of the call
       * @type {string}
       */
      this.region = data.region;
    }
    if ('ringing' in data) {
      this._ringing = data.ringing;
    }
  }

  /**
   * The channel of the call
   * @type {?DMChannel|GroupDMChannel}
   */
  get channel() {
    return this.client.channels.cache.get(this.channelId);
  }

  /**
   * Sets the voice region of the call
   * @param {string} region Region of the call
   * @returns {Promise<void>}
   */
  setRTCRegion(region) {
    return this.client.api.channels(this.channelId).call.patch({ data: { region } });
  }

  /**
   * The list of user ID who is ringing
   * @type {Collection<Snowflake, User>}
   */
  get ringing() {
    return new Collection(this._ringing.map(id => [id, this.client.users.cache.get(id)]));
  }
}

module.exports = CallState;
