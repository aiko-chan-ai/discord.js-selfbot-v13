'use strict';

const BitField = require('./BitField');

/**
 * Data structure that makes it easy to interact with a {@link Message#flags} bitfield.
 * @extends {BitField}
 */
class MessageFlags extends BitField {}

/**
 * @name MessageFlags
 * @kind constructor
 * @memberof MessageFlags
 * @param {BitFieldResolvable} [bits=0] Bit(s) to read from
 */

/**
 * Bitfield of the packed bits
 * @type {number}
 * @name MessageFlags#bitfield
 */

/**
 * Numeric message flags. All available properties:
 * * `CROSSPOSTED`
 * * `IS_CROSSPOST`
 * * `SUPPRESS_EMBEDS`
 * * `SOURCE_MESSAGE_DELETED`
 * * `URGENT`
 * * `HAS_THREAD`
 * * `EPHEMERAL`
 * * `LOADING`
 * * `FAILED_TO_MENTION_SOME_ROLES_IN_THREAD`
 * * `GUILD_FEED_HIDDEN`
 * * `SHOULD_SHOW_LINK_NOT_DISCORD_WARNING`
 * * `SUPPRESS_NOTIFICATIONS`
 * * `IS_VOICE_MESSAGE`
 * * `HAS_SNAPSHOT`
 * * `IS_COMPONENTS_V2`
 * @type {Object}
 * @see {@link https://discord.com/developers/docs/resources/channel#message-object-message-flags}
 * @see {@link https://docs.discord.food/resources/message#message-flags}
 */
MessageFlags.FLAGS = {
  CROSSPOSTED: 1 << 0,
  IS_CROSSPOST: 1 << 1,
  SUPPRESS_EMBEDS: 1 << 2,
  SOURCE_MESSAGE_DELETED: 1 << 3,
  URGENT: 1 << 4,
  HAS_THREAD: 1 << 5,
  EPHEMERAL: 1 << 6,
  LOADING: 1 << 7,
  FAILED_TO_MENTION_SOME_ROLES_IN_THREAD: 1 << 8,
  GUILD_FEED_HIDDEN: 1 << 9,
  SHOULD_SHOW_LINK_NOT_DISCORD_WARNING: 1 << 10,
  SUPPRESS_NOTIFICATIONS: 1 << 12,
  IS_VOICE_MESSAGE: 1 << 13,
  HAS_SNAPSHOT: 1 << 14,
  IS_COMPONENTS_V2: 1 << 15,
};

module.exports = MessageFlags;
