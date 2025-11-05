'use strict';

const Base = require('./Base');

/**
 * Represents a user's profile.
 * @extends {Base}
 */
class UserProfile extends Base {
  constructor(client, data) {
    super(client);
    this._patch(data);
  }

  _patch(data) {
    /**
     * The user object
     * @type {User}
     */
    if ('user' in data) {
      this.user = this.client.users.cache.get(data.user.id) ?? this.client.users._add(data.user);
    }

    /**
     * The user's connected accounts
     * @type {Object[]}
     */
    if ('connected_accounts' in data) {
      this.connectedAccounts = data.connected_accounts;
    } else {
      this.connectedAccounts ??= [];
    }

    /**
     * The type of Nitro subscription on a user's account
     * @type {?PremiumType}
     */
    if ('premium_type' in data) {
      this.premiumType = data.premium_type;
    } else {
      this.premiumType ??= null;
    }

    if ('premium_since' in data) {
      /**
       * The time the user subscribed to Nitro
       * @type {?Date}
       */
      this.premiumSince = data.premium_since ? new Date(data.premium_since) : null;
    } else {
      this.premiumSince ??= null;
    }

    if ('premium_guild_since' in data) {
      /**
       * The time the user first boosted a guild
       * @type {?Date}
       */
      this.premiumGuildSince = data.premium_guild_since ? new Date(data.premium_guild_since) : null;
    } else {
      this.premiumGuildSince ??= null;
    }

    if ('user_profile' in data) {
      /**
       * The user's bio
       * @type {?string}
       */
      this.bio = data.user_profile.bio;
      /**
       * The user's accent color
       * @type {?number}
       */
      this.accentColor = data.user_profile.accent_color;
      /**
       * The user's pronouns
       * @type {?string}
       */
      this.pronouns = data.user_profile.pronouns;
    } else {
      this.bio ??= null;
      this.accentColor ??= null;
      this.pronouns ??= null;
    }

    /**
     * The user's badges
     * @type {Object[]}
     */
    if ('badges' in data) {
      this.badges = data.badges;
    } else {
      this.badges ??= [];
    }

    /**
     * The user's guild-specific badges
     * @type {Object[]}
     */
    if ('guild_badges' in data) {
      this.guildBadges = data.guild_badges;
    } else {
      this.guildBadges ??= [];
    }

    /**
     * The mutual guilds between the client and the user
     * @type {Object[]}
     */
    if ('mutual_guilds' in data) {
      this.mutualGuilds = data.mutual_guilds;
    } else {
      this.mutualGuilds ??= [];
    }

    /**
     * The mutual friends between the client and the user
     * @type {User[]}
     */
    if ('mutual_friends' in data) {
      this.mutualFriends = data.mutual_friends.map(f => this.client.users.cache.get(f.id) ?? this.client.users._add(f));
    } else {
      this.mutualFriends ??= [];
    }
  }

  /**
   * The timestamp the user subscribed to Nitro
   * @type {?number}
   * @readonly
   */
  get premiumSinceTimestamp() {
    return this.premiumSince?.getTime() ?? null;
  }

  /**
   * The timestamp the user first boosted a guild
   * @type {?number}
   * @readonly
   */
  get premiumGuildSinceTimestamp() {
    return this.premiumGuildSince?.getTime() ?? null;
  }

  /**
   * The timestamp the user was created at
   * @type {number}
   * @readonly
   */
  get createdTimestamp() {
    return this.user.createdTimestamp;
  }

  /**
   * The time the user was created at
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return this.user.createdAt;
  }

  /**
   * When concatenated with a string, this automatically returns the user's mention instead of the UserProfile object.
   * @returns {string}
   */
  toString() {
    return this.user.toString();
  }
}

module.exports = UserProfile;
