'use strict';

const Base = require('./Base');
const { ReadStateTypes } = require('../util/Constants');
const ReadStateFlags = require('../util/ReadStateFlags');

/**
 * Represents a read state for a resource on Discord.
 * @extends {Base}
 */
class ReadState extends Base {
  constructor(client, data) {
    super(client);
    this._patch(data);
  }

  _patch(data) {
    /**
     * The resource id of the read state
     * @type {Snowflake}
     */
    this.id = data.id;
    /**
     * The type of the read state
     * @type {?ReadStateType}
     */
    this.type = ReadStateTypes[data.read_state_type ?? 0];
    /**
     * Flags that are applied to the read state
     * @type {Readonly<ReadStateFlags>}
     */
    this.flags = new ReadStateFlags(data.flags ?? 0).freeze();
    /**
     * The number of badges in the resource (e.g. mentions)
     * @type {number}
     */
    this.badgeCount = data.mention_count ?? data.badge_count ?? 0;
    /**
     * Days since 2015 when the resource was last viewed
     * @type {?number}
     */
    this.lastViewed = data.last_viewed ?? null;
    if (data.last_pin_timestamp) {
      const lastPinTimestamp = new Date(Date.parse(data.last_pin_timestamp));
      /**
       * When the channel pins were last acknowledged
       * @type {?Date}
       */
      this.lastPinTimestamp = lastPinTimestamp.getTime() ? lastPinTimestamp : null;
    } else {
      this.lastPinTimestamp = null;
    }
    /**
     * The id of last acknowledged resource in the read state
     * @type {Snowflake}
     */
    this.lastAckedId = (data.last_acked_id ?? data.last_message_id).toString() ?? '0';
  }

  _copy() {
    return new ReadState(this.client, {
      id: this.id,
      read_state_type: ReadStateTypes[this.type],
      flags: this.flags.bitfield,
      badge_count: this.badgeCount,
      last_viewed: this.lastViewed,
      last_pin_timestamp: this.lastPinTimestamp?.toISOString(),
      last_acked_id: this.lastAckedId,
    });
  }

  /**
   * The resource of the read state
   * @type {TextBasedChannel | Guild | ClientUser}
   * @readonly
   */
  get resource() {
    if (this.type === 'CHANNEL') return this.client.channels.get(this.id);
    if (['GUILD_SCHEDULED_EVENT', 'GUILD_HOME', 'GUILD_ONBOARDING_QUESTION'].includes(this.type)) return this.client.guilds.get(this.id);
    return this.client.user;
  }

  /**
   * Deletes the read state
   * @returns {Promise<void>}
   */
  delete() {
    return this.client.readStates.delete(this.id, this.type);
  }
}

module.exports = ReadState;
