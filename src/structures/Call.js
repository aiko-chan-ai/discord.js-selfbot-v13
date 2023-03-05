'use strict';

const { Collection } = require('@discordjs/collection');
const Base = require('./Base');

/**
 * Represents a call
 * @extends {Base}
 */
class Call extends Base {
  constructor(client, data) {
    super(client);
    /**
     * The channel ID of the call
     * @type {Snowflake}
     */
    this.channelId = data.channel_id;

    /**
     * The list of user ID who is ringing
     * @type {Collection<Snowflake, User>}
     */
    this.ringing = new Collection();

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
      for (const userId of data.ringing) {
        this.ringing.set(userId, this.client.users.cache.get(userId));
      }
    }
  }
  /**
   * The channel of the call
   * @type {?DMChannel|PartialGroupDMChannel}
   */
  get channel() {
    return this.client.channels.cache.get(this.channelId);
  }
  /**
   * Sets the voice region of the call
   * @param {string} region Region of the call
   * @returns {Promise<void>}
   */
  setVoiceRegion(region) {
    return this.client.api.channels(this.channelId).call.patch({ data: { region } });
  }
}

module.exports = Call;
