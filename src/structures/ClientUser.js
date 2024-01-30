'use strict';

const { setInterval } = require('node:timers');
const { Collection } = require('@discordjs/collection');
const Invite = require('./Invite');
const User = require('./User');
const DataResolver = require('../util/DataResolver');
const PremiumUsageFlags = require('../util/PremiumUsageFlags');
const PurchasedFlags = require('../util/PurchasedFlags');
const Util = require('../util/Util');

/**
 * Represents the logged in client's Discord user.
 * @extends {User}
 */
class ClientUser extends User {
  #packageName = null;
  #intervalSamsungPresence = setInterval(() => {
    this.client.emit('debug', `[UPDATE] Samsung Presence: ${this.#packageName}`);
    if (!this.#packageName) return;
    this.setSamsungActivity(this.#packageName, 'UPDATE');
  }, 1000 * 60 * 10).unref();

  _patch(data) {
    super._patch(data);

    if ('verified' in data) {
      /**
       * Whether or not this account has been verified
       * @type {boolean}
       */
      this.verified = data.verified;
    }

    if ('mfa_enabled' in data) {
      /**
       * If the bot's {@link Application#owner Owner} has MFA enabled on their account
       * @type {?boolean}
       */
      this.mfaEnabled = typeof data.mfa_enabled === 'boolean' ? data.mfa_enabled : null;
    } else {
      this.mfaEnabled ??= null;
    }

    if ('token' in data) this.client.token = data.token;

    if ('purchased_flags' in data) {
      /**
       * Purchased state of the client user.
       * @type {Readonly<PurchasedFlags>}
       */
      this.purchasedFlags = new PurchasedFlags(data.purchased_flags || 0).freeze();
    } else {
      this.purchasedFlags = new PurchasedFlags().freeze();
    }

    if ('premium_usage_flags' in data) {
      /**
       * Premium usage state of the client user.
       * @type {Readonly<PremiumUsageFlags>}
       */
      this.premiumUsageFlags = new PremiumUsageFlags(data.premium_usage_flags || 0);
    } else {
      this.premiumUsageFlags = new PremiumUsageFlags().freeze();
    }

    if ('phone' in data) {
      /**
       * Phone number of the client user.
       * @type {?string}
       */
      this.phone = data.phone;
    }

    if ('nsfw_allowed' in data) {
      /**
       * Whether or not the client user is allowed to send NSFW messages [iOS device].
       * @type {?boolean}
       */
      this.nsfwAllowed = data.nsfw_allowed;
    }

    if ('email' in data) {
      /**
       * Email address of the client user.
       * @type {?string}
       */
      this.email = data.email;
    }

    if ('bio' in data) {
      /**
       * About me (User)
       * <info>The user must be force fetched for this property to be present or be updated</info>
       * @type {?string}
       */
      this.bio = data.bio;
    }

    if ('pronouns' in data) {
      /**
       * Pronouns (User)
       * <info>The user must be force fetched for this property to be present or be updated</info>
       * @type {?string}
       */
      this.pronouns = data.pronouns;
    }

    if ('premium_type' in data) {
      /**
       * Premium types denote the level of premium a user has.
       * @type {number}
       * @see {@link https://discord-userdoccers.vercel.app/resources/user#premium-type}
       */
      this.premiumType = data.premium_type;
    }
  }

  /**
   * Represents the client user's presence
   * @type {ClientPresence}
   * @readonly
   */
  get presence() {
    return this.client.presence;
  }

  /**
   * Data used to edit the logged in client
   * @typedef {Object} ClientUserEditData
   * @property {string} [username] The new username
   * @property {?(BufferResolvable|Base64Resolvable)} [avatar] The new avatar
   * @property {?(BufferResolvable|Base64Resolvable)} [banner] The new banner
   * @property {?string} [bio] The new bio
   */

  /**
   * Edits the logged in client.
   * @param {ClientUserEditData} options The new data
   * @returns {Promise<ClientUser>}
   */
  async edit(options = {}) {
    const data = await this.client.api.users('@me').patch({ data: options });
    this.client.token = data.token;
    const { updated } = this.client.actions.UserUpdate.handle(data);
    return updated ?? this;
  }

  /**
   * Sets the username of the logged in client.
   * <info>Changing usernames in Discord is heavily rate limited, with only 2 requests
   * every hour. Use this sparingly!</info>
   * @param {string} username The new username
   * @param {string} password Current Password
   * @returns {Promise<ClientUser>}
   * @example
   * // Set username
   * client.user.setUsername('discordjs', 'passw@rd')
   *   .then(user => console.log(`My new username is ${user.username}`))
   *   .catch(console.error);
   */
  setUsername(username, password) {
    return this.edit({ username, password });
  }

  /**
   * Sets the avatar of the logged in client.
   * @param {?(BufferResolvable|Base64Resolvable)} avatar The new avatar
   * @returns {Promise<ClientUser>}
   * @example
   * // Set avatar
   * client.user.setAvatar('./avatar.png')
   *   .then(user => console.log(`New avatar set!`))
   *   .catch(console.error);
   */
  async setAvatar(avatar) {
    avatar = avatar && (await DataResolver.resolveImage(avatar));
    return this.edit({ avatar });
  }

  /**
   * Options for setting activities
   * @typedef {Object} ActivitiesOptions
   * @property {string} name Name of the activity
   * @property {string} [state] State of the activity
   * @property {ActivityType|number} [type] Type of the activity
   * @property {string} [url] Twitch / YouTube stream URL
   */

  /**
   * Data resembling a raw Discord presence.
   * @typedef {Object} PresenceData
   * @property {PresenceStatusData} [status] Status of the user
   * @property {boolean} [afk] Whether the user is AFK
   * @property {ActivitiesOptions[]|CustomStatus[]|RichPresence[]|SpotifyRPC[]} [activities] Activity the user is playing
   * @property {number|number[]} [shardId] Shard id(s) to have the activity set on
   */

  /**
   * Sets the full presence of the client user.
   * @param {PresenceData} data Data for the presence
   * @returns {ClientPresence}
   * @example
   * // Set the client user's presence
   * client.user.setPresence({ activities: [{ name: 'with discord.js' }], status: 'idle' });
   * @see {@link https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/RichPresence.md}
   */
  setPresence(data) {
    return this.client.presence.set(data);
  }

  /**
   * A user's status. Must be one of:
   * * `online`
   * * `idle`
   * * `invisible`
   * * `dnd` (do not disturb)
   * @typedef {string} PresenceStatusData
   */

  /**
   * Sets the status of the client user.
   * @param {PresenceStatusData} status Status to change to
   * @param {number|number[]} [shardId] Shard id(s) to have the activity set on
   * @returns {ClientPresence}
   * @example
   * // Set the client user's status
   * client.user.setStatus('idle');
   */
  setStatus(status, shardId) {
    return this.setPresence({ status, shardId });
  }

  /**
   * Options for setting an activity.
   * @typedef {Object} ActivityOptions
   * @property {string} name Name of the activity
   * @property {string} [url] Twitch / YouTube stream URL
   * @property {ActivityType|number} [type] Type of the activity
   * @property {number|number[]} [shardId] Shard Id(s) to have the activity set on
   */

  /**
   * Sets the activity the client user is playing.
   * @param {string|ActivityOptions} name Activity being played, or options for setting the activity
   * @param {ActivityOptions} [options] Options for setting the activity
   * @returns {ClientPresence}
   * @example
   * // Set the client user's activity
   * client.user.setActivity('discord.js', { type: 'WATCHING' });
   * @see {@link https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/RichPresence.md}
   */
  setActivity(name, options = {}) {
    if (!name) return this.setPresence({ activities: [], shardId: options.shardId });

    const activity = Object.assign({}, options, typeof name === 'object' ? name : { name });
    return this.setPresence({ activities: [activity], shardId: activity.shardId });
  }

  /**
   * Sets/removes the AFK flag for the client user.
   * @param {boolean} [afk=true] Whether or not the user is AFK
   * @param {number|number[]} [shardId] Shard Id(s) to have the AFK flag set on
   * @returns {ClientPresence}
   */
  setAFK(afk = true, shardId) {
    return this.setPresence({ afk, shardId });
  }

  /**
   * Sets the banner of the logged in client.
   * @param {?(BufferResolvable|Base64Resolvable)} banner The new banner
   * @returns {Promise<ClientUser>}
   * @example
   * // Set banner
   * client.user.setBanner('./banner.png')
   *   .then(user => console.log(`New banner set!`))
   *   .catch(console.error);
   */
  async setBanner(banner) {
    banner = banner && (await DataResolver.resolveImage(banner));
    return this.edit({ banner });
  }

  /**
   * Set HyperSquad House
   * @param {string|number} type
   * * `LEAVE`: 0
   * * `HOUSE_BRAVERY`: 1
   * * `HOUSE_BRILLIANCE`: 2
   * * `HOUSE_BALANCE`: 3
   * @returns {Promise<void>}
   * @example
   * // Set HyperSquad HOUSE_BRAVERY
   * client.user.setHypeSquad(1); || client.user.setHypeSquad('HOUSE_BRAVERY');
   * // Leave
   * client.user.setHypeSquad(0);
   */
  setHypeSquad(type) {
    switch (type) {
      case 'LEAVE': {
        type = 0;
        break;
      }
      case 'HOUSE_BRAVERY': {
        type = 1;
        break;
      }
      case 'HOUSE_BRILLIANCE': {
        type = 2;
        break;
      }
      case 'HOUSE_BALANCE': {
        type = 3;
        break;
      }
    }
    if (type == 0) {
      return this.client.api.hypesquad.online.delete();
    } else {
      return this.client.api.hypesquad.online.post({
        data: { house_id: type },
      });
    }
  }

  /**
   * Set Accent color
   * @param {ColorResolvable} color Color to set
   * @returns {Promise<ClientUser>}
   */
  setAccentColor(color = null) {
    return this.edit({ accent_color: color ? Util.resolveColor(color) : null });
  }

  /**
   * Set About me
   * @param {string} [bio=null] Bio to set
   * @returns {Promise<ClientUser>}
   */
  setAboutMe(bio = null) {
    return this.edit({ bio });
  }

  /**
   * Create an invite [Friend Invites]
   * maxAge: 604800 | maxUses: 1
   * @returns {Promise<Invite>}
   * @see {@link https://github.com/13-05/hidden-disc-docs#js-snippet-for-creating-friend-invites}
   * @example
   * // Options not working
   * client.user.createFriendInvite();
   *   .then(console.log)
   *   .catch(console.error);
   */
  async createFriendInvite() {
    const data = await this.client.api.users['@me'].invites.post({
      data: {},
    });
    return new Invite(this.client, data);
  }

  /**
   * Get all friend invites
   * @returns {Promise<Collection<string, Invite>>}
   */
  async getAllFriendInvites() {
    const data = await this.client.api.users['@me'].invites.get();
    const collection = new Collection();
    for (const invite of data) {
      collection.set(invite.code, new Invite(this.client, invite));
    }
    return collection;
  }

  /**
   * Revoke all friend invites
   * @returns {Promise<void>}
   */
  revokeAllFriendInvites() {
    return this.client.api.users['@me'].invites.delete();
  }

  /**
   * Sets Discord Playing status to "Playing on Samsung Galaxy". Only selected gamss from discords database works
   * @param {string} packageName Android package name
   * @param {?string} type Must be START, UPDATE, or STOP
   * @returns {Promise<ClientUser>}
   * @example
   * // Set the client user's status
   * client.user.setSamsungActivity('com.YostarJP.BlueArchive', 'START');
   * // Update
   * client.user.setSamsungActivity('com.miHoYo.bh3oversea', 'UPDATE');
   * // Stop
   * client.user.setSamsungActivity('com.miHoYo.GenshinImpact', 'STOP');
   */
  async setSamsungActivity(packageName, type = 'START') {
    type = type.toUpperCase();
    if (!packageName || typeof packageName !== 'string') throw new Error('Package name is required.');
    if (!['START', 'UPDATE', 'STOP'].includes(type)) throw new Error('Invalid type (Must be START, UPDATE, or STOP)');
    await this.client.api.presences.post({
      data: {
        package_name: packageName,
        update: type,
      },
    });
    if (type !== 'STOP') this.#packageName = packageName;
    else this.#packageName = null;
    return this;
  }

  /**
   * Stop ringing
   * @param {ChannelResolvable} channel DMChannel | GroupDMChannel
   * @returns {Promise<void>}
   */
  stopRinging(channel) {
    return this.client.api.channels(this.client.channels.resolveId(channel)).call['stop-ringing'].post({
      data: {},
    });
  }

  /**
   * Super Reactions
   * @returns {Promise<number>}
   */
  fetchBurstCredit() {
    return this.client.api.users['@me']['burst-credits'].get().then(d => d.amount);
  }

  /**
   * Set global display name
   * @param {string} globalName The new display name
   * @returns {Promise<ClientUser>}
   */
  setGlobalName(globalName = '') {
    return this.edit({ global_name: globalName });
  }

  /**
   * Set pronouns
   * @param {?string} pronouns Your pronouns
   * @returns {Promise<ClientUser>}
   */
  setPronouns(pronouns = '') {
    return this.edit({ pronouns });
  }
}

module.exports = ClientUser;
