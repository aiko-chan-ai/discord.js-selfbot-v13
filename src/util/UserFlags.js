'use strict';
const BitField = require('./BitField');

/**
 * Data structure that makes it easy to interact with a {@link User#flags} bitfield.
 * @extends {BitField}
 */
class UserFlags extends BitField {}

/**
 * @name UserFlags
 * @kind constructor
 * @memberof UserFlags
 * @param {BitFieldResolvable} [bits=0] Bit(s) to read from
 */

/**
 * Bitfield of the packed bits
 * @type {number}
 * @name UserFlags#bitfield
 */

/**
 * Numeric user flags. All available properties:
 * * `DISCORD_EMPLOYEE`
 * * `PARTNERED_SERVER_OWNER`
 * * `HYPESQUAD_EVENTS`
 * * `BUGHUNTER_LEVEL_1`
 * * `MFA_SMS`
 * * `PREMIUM_PROMO_DISMISSED`
 * * `HOUSE_BRAVERY`
 * * `HOUSE_BRILLIANCE`
 * * `HOUSE_BALANCE`
 * * `EARLY_SUPPORTER`
 * * `TEAM_USER`
 * * `INTERNAL_APPLICATION`
 * * `SYSTEM`
 * * `HAS_UNREAD_URGENT_MESSAGES`
 * * `BUGHUNTER_LEVEL_2`
 * * `UNDERAGE_DELETED`
 * * `VERIFIED_BOT`
 * * `EARLY_VERIFIED_BOT_DEVELOPER`
 * * `DISCORD_CERTIFIED_MODERATOR`
 * * `BOT_HTTP_INTERACTIONS`
 * * `SPAMMER`
 * * `DISABLE_PREMIUM`
 * * `ACTIVE_DEVELOPER`
 * * `HIGH_GLOBAL_RATE_LIMIT`
 * * `DELETED`
 * * `DISABLED_SUSPICIOUS_ACTIVITY`
 * * `SELF_DELETED`
 * * `PREMIUM_DISCRIMINATOR`
 * * `USED_DESKTOP_CLIENT`
 * * `USED_WEB_CLIENT`
 * * `USED_MOBILE_CLIENT`
 * * `DISABLED`
 * * `VERIFIED_EMAIL`
 * * `QUARANTINED`
 * * `COLLABORATOR`
 * * `RESTRICTED_COLLABORATOR`
 * @type {Object}
 * @see {@link https://discord.com/developers/docs/resources/user#user-object-user-flags}
 * @see {@link https://github.com/LewisTehMinerz/discord-flags}
 */
UserFlags.FLAGS = {
  DISCORD_EMPLOYEE: 1 << 0,
  PARTNERED_SERVER_OWNER: 1 << 1,
  HYPESQUAD_EVENTS: 1 << 2,
  BUGHUNTER_LEVEL_1: 1 << 3,
  MFA_SMS: 1 << 4, // [Undocumented] User has SMS 2FA enabled.
  PREMIUM_PROMO_DISMISSED: 1 << 5, // [Undocumented] Presumably some sort of Discord Nitro promotion that the user dismissed.
  HOUSE_BRAVERY: 1 << 6,
  HOUSE_BRILLIANCE: 1 << 7,
  HOUSE_BALANCE: 1 << 8,
  EARLY_SUPPORTER: 1 << 9,
  TEAM_USER: 1 << 10,
  INTERNAL_APPLICATION: 1 << 11, // [Undocumented] An internal flag accidentally leaked to the client's private flags. Relates to partner/verification applications but nothing else is known.
  SYSTEM: 1 << 12, // [Undocumented] Account is a Discord system account.
  HAS_UNREAD_URGENT_MESSAGES: 1 << 13, // [Undocumented] User has unread messages from Discord.
  BUGHUNTER_LEVEL_2: 1 << 14,
  UNDERAGE_DELETED: 1 << 15, // [Undocumented] Unused. User was deleted for being underage.
  VERIFIED_BOT: 1 << 16,
  EARLY_VERIFIED_BOT_DEVELOPER: 1 << 17,
  DISCORD_CERTIFIED_MODERATOR: 1 << 18,
  BOT_HTTP_INTERACTIONS: 1 << 19,
  SPAMMER: 1 << 20, // [Undocumented] User is marked as a spammer.
  DISABLE_PREMIUM: 1 << 21, // [Undocumented] Forcefully disables Nitro features.
  ACTIVE_DEVELOPER: 1 << 22, // User is an active developer.
  HIGH_GLOBAL_RATE_LIMIT: Math.pow(2, 33), // [Undocumented] User is a high global rate limit.
  DELETED: Math.pow(2, 34), // [Undocumented] Account has been deleted.
  DISABLED_SUSPICIOUS_ACTIVITY: Math.pow(2, 35), // [Undocumented] Account has been disabled for suspicious activity.
  SELF_DELETED: Math.pow(2, 36), // [Undocumented] Account was deleted by the user.
  PREMIUM_DISCRIMINATOR: Math.pow(2, 37), // [Undocumented] User has a premium discriminator.
  USED_DESKTOP_CLIENT: Math.pow(2, 38), // [Undocumented] User has used the desktop client.
  USED_WEB_CLIENT: Math.pow(2, 39), // [Undocumented] User has used the web client.
  USED_MOBILE_CLIENT: Math.pow(2, 40), // [Undocumented] User has used the mobile client.
  DISABLED: Math.pow(2, 41), // [Undocumented] User is currently temporarily or permanently disabled.
  VERIFIED_EMAIL: Math.pow(2, 43), // [Undocumented] User has a verified email on their account.
  QUARANTINED: Math.pow(2, 44), // [Undocumented] User is quarantined.
  COLLABORATOR: Math.pow(2, 50), // [Undocumented] User is a collaborator and has staff permissions.
  RESTRICTED_COLLABORATOR: Math.pow(2, 51), // [Undocumented] User is a restricted collaborator and has staff permissions.
};

module.exports = UserFlags;
