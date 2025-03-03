'use strict';

const Base = require('./Base');

/**
 * Represents a read state for a resource on Discord.
 * @extends {Base}
 */
class ReadState extends Base {
  constructor(client, data) {
    super(client);
    /**
     * The channel id of the read state
     * @type {Snowflake}
     */
    this.id = data.id;
    /**
     * The mention count of the resource
     * @type {number}
     */
    this.mentionCount = data.mention_count;
    /**
     * Day when the resource was last viewed
     * @type {number}
     */
    this.lastViewed = data.last_viewed + 16436000;
    if (data.last_pin_timestamp) {
      let lastPinTimestamp = Date.parse(data.last_pin_timestamp);
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
     * @type {?Snowflake}
     */
    this.lastMessageId = data.last_acked_id ?? data.last_message_id ?? null;
    // TODO Readstateflags
  }
}

module.exports = ReadState;
