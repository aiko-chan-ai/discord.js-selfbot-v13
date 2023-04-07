'use strict';

const { setInterval } = require('node:timers');
const { Collection } = require('@discordjs/collection');
const Invite = require('./Invite');
const { Message } = require('./Message');
const User = require('./User');
const { Util } = require('..');
const { Error: Error_ } = require('../errors');
const { Opcodes, NitroType, HypeSquadType } = require('../util/Constants');
const DataResolver = require('../util/DataResolver');
const PremiumUsageFlags = require('../util/PremiumUsageFlags');
const PurchasedFlags = require('../util/PurchasedFlags');
/**
 * Represents the logged in client's Discord user.
 * @extends {User}
 */
class ClientUser extends User {
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
       * If the bot's {@link ClientApplication#owner Owner} has MFA enabled on their account
       * @type {?boolean}
       */
      this.mfaEnabled = typeof data.mfa_enabled === 'boolean' ? data.mfa_enabled : null;
    } else {
      this.mfaEnabled ??= null;
    }

    if ('token' in data) this.client.token = data.token;

    // Todo: Add (Selfbot)
    if ('premium_type' in data) {
      const nitro = NitroType[data.premium_type ?? 0];
      /**
       * Nitro type of the client user.
       * @type {NitroType}
       */
      this.nitroType = nitro ?? `UNKNOWN_TYPE_${data.premium_type}`;
    }
    if ('purchased_flags' in data) {
      /**
       * Purchased state of the client user.
       * @type {?PurchasedFlags}
       */
      this.purchasedFlags = new PurchasedFlags(data.purchased_flags || 0);
    }
    if ('premium_usage_flags' in data) {
      /**
       * Premium usage state of the client user.
       * @type {?PremiumUsageFlags}
       */
      this.premiumUsageFlags = new PremiumUsageFlags(data.premium_usage_flags || 0);
    }
    // Key: premium = boolean;
    if ('phone' in data) {
      /**
       * Phone number of the client user.
       * @type {?string}
       */
      this.phoneNumber = data.phone;
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
      this.emailAddress = data.email;
    }
    if ('bio' in data) {
      this.bio = data.bio;
    }

    /**
     * The friend nicknames cache of the client user.
     * @type {Collection<Snowflake, string>}
     * @private
     */
    if (!this.friendNicknames?.size) this.friendNicknames = new Collection();

    if (!this._intervalSamsungPresence) {
      this._intervalSamsungPresence = setInterval(() => {
        this.client.emit('debug', `Samsung Presence: ${this._packageName}`);
        if (!this._packageName) return;
        this.setSamsungActivity(this._packageName, 'UPDATE');
      }, 1000 * 60 * 10).unref();
      // 20 minutes max
    }
  }

  /**
   * Patch note
   * @param {Object} data Note data
   * @private
   */
  _patchNote(data) {
    /**
     * The notes cache of the client user.
     * @type {Collection<Snowflake, string>}
     * @private
     */
    this.notes = data ? new Collection(Object.entries(data)) : new Collection();
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
   * @param {ClientUserEditData} data The new data
   * @returns {Promise<ClientUser>}
   */
  async edit({ username, avatar }) {
    const data = await this.client.api
      .users('@me')
      .patch({ data: { username, avatar: avatar && (await DataResolver.resolveImage(avatar)) } });

    this.client.token = data.token;
    const { updated } = this.client.actions.UserUpdate.handle(data);
    return updated ?? this;
  }

  /**
   * Sets the username of the logged in client.
   * <info>Changing usernames in Discord is heavily rate limited, with only 2 requests
   * every hour. Use this sparingly!</info>
   * @param {string} username The new username
   * @param {string} password The password of the account
   * @returns {Promise<ClientUser>}
   * @example
   * // Set username
   * client.user.setUsername('discordjs')
   *   .then(user => console.log(`My new username is ${user.username}`))
   *   .catch(console.error);
   */
  setUsername(username, password) {
    if (!password && !this.client.password) {
      throw new Error('A password is required to change a username.');
    }
    return this.edit({
      username,
      password: this.client.password ? this.client.password : password,
    });
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
  setAvatar(avatar) {
    return this.edit({ avatar });
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
  setBanner(banner) {
    if (this.nitroType !== 'NITRO_BOOST') {
      throw new Error('You must be a Nitro Boosted User to change your banner.');
    }
    return this.edit({ banner });
  }

  /**
   * Set HyperSquad House
   * @param {HypeSquadType} type
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
  async setHypeSquad(type) {
    const id = typeof type === 'string' ? HypeSquadType[type] : type;
    if (!id && id !== 0) throw new Error('Invalid HypeSquad type.');
    if (id !== 0) {
      const data = await this.client.api.hypesquad.online.post({
        data: { house_id: id },
      });
      return data;
    } else {
      const data = await this.client.api.hypesquad.online.delete();
      return data;
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
   * Set discriminator
   * @param {User.discriminator} discriminator It is #1234
   * @param {string} password The password of the account
   * @returns {Promise<ClientUser>}
   */
  setDiscriminator(discriminator, password) {
    if (this.nitroType == 'NONE') throw new Error('You must be a Nitro User to change your discriminator.');
    if (!password && !this.client.password) {
      throw new Error('A password is required to change a discriminator.');
    }
    return this.edit({
      discriminator,
      password: this.client.password ? this.client.password : password,
    });
  }

  /**
   * Set About me
   * @param {string | null} bio Bio to set
   * @returns {Promise<ClientUser>}
   */
  setAboutMe(bio = null) {
    return this.edit({
      bio,
    });
  }

  /**
   * Change the email
   * @param {Email<string>} email Email to change
   * @param {string} password Password of the account
   * @returns {Promise<ClientUser>}
   */
  setEmail(email, password) {
    throw new Error('This method is not available yet. Please use the official Discord client to change your email.');
    // eslint-disable-next-line no-unreachable
    if (!password && !this.client.password) {
      throw new Error('A password is required to change a email.');
    }
    return this.edit({
      email,
      password: this.client.password ? this.client.password : password,
    });
  }

  /**
   * Set new password
   * @param {string} oldPassword Old password
   * @param {string} newPassword New password to set
   * @returns {Promise<ClientUser>}
   */
  setPassword(oldPassword, newPassword) {
    if (!oldPassword && !this.client.password) {
      throw new Error('A password is required to change a password.');
    }
    if (!newPassword) throw new Error('New password is required.');
    return this.edit({
      password: this.client.password ? this.client.password : oldPassword,
      new_password: newPassword,
    });
  }

  /**
   * Disable account
   * @param {string} password Password of the account
   * @returns {Promise<ClientUser>}
   */
  async disableAccount(password) {
    if (!password && !this.client.password) {
      throw new Error('A password is required to disable an account.');
    }
    const data = await this.client.api.users['@me'].disable.post({
      data: {
        password: this.client.password ? this.client.password : password,
      },
    });
    return data;
  }

  /**
   * Set selfdeaf (Global)
   * @param {boolean} status Whether or not the ClientUser is deafened
   * @returns {boolean}
   */
  setDeaf(status) {
    if (typeof status !== 'boolean') throw new Error('Deaf status must be a boolean.');
    this.client.ws.broadcast({
      op: Opcodes.VOICE_STATE_UPDATE,
      d: { self_deaf: status },
    });
    return status;
  }

  /**
   * Set selfmute (Global)
   * @param {boolean} status Whether or not the ClientUser is muted
   * @returns {boolean}
   */
  setMute(status) {
    if (typeof status !== 'boolean') throw new Error('Mute status must be a boolean.');
    this.client.ws.broadcast({
      op: Opcodes.VOICE_STATE_UPDATE,
      d: { self_mute: status },
    });
    return status;
  }

  /**
   * Delete account. Warning: Cannot be changed once used!
   * @param {string} password Password of the account
   * @returns {Promise<ClientUser>}
   */
  async deleteAccount(password) {
    if (!password && !this.client.password) {
      throw new Error('A password is required to delete an account.');
    }
    const data = await this.client.api.users['@me/delete'].post({
      data: {
        password: this.client.password ? this.client.password : password,
      },
    });
    return data;
  }

  /**
   * Options for setting activities
   * @typedef {Object} ActivitiesOptions
   * @property {string} [name] Name of the activity
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
   * @property {string} [name] Name of the activity
   * @property {string} [url] Twitch / YouTube stream URL
   * @property {ActivityType|number} [type] Type of the activity
   * @property {number|number[]} [shardId] Shard Id(s) to have the activity set on
   */

  /**
   * Sets the activity the client user is playing.
   * @param {string|ActivityOptions} [name] Activity being played, or options for setting the activity
   * @param {ActivityOptions} [options] Options for setting the activity
   * @returns {ClientPresence}
   * @example
   * // Set the client user's activity
   * client.user.setActivity('discord.js', { type: 'WATCHING' });
   * @see {@link https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/RichPresence.md}
   */
  setActivity(name, options = {}) {
    if (!name) {
      return this.setPresence({ activities: [], shardId: options.shardId });
    }

    const activity = Object.assign({}, options, typeof name === 'object' ? name : { name });
    return this.setPresence({
      activities: [activity],
      shardId: activity.shardId,
    });
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
   * Create an invite [Friend Invites]
   * maxAge: 86400 | maxUses: 0
   * @returns {Promise<Invite>}
   * @see {@link https://github.com/13-05/hidden-disc-docs#js-snippet-for-creating-friend-invites}
   * @example
   * // Options not working
   * client.user.getInvite();
   *   .then(console.log)
   *   .catch(console.error);
   */
  async getInvite() {
    const data = await this.client.api.users['@me'].invites.post({
      data: {
        validate: null,
        max_age: 86400,
        max_uses: 0,
        target_type: 2,
        temporary: false,
      },
    });
    return new Invite(this.client, data);
  }

  /**
   * Get a collection of messages mentioning clientUser
   * @param {number} [limit=25] Maximum number of messages to get
   * @param {boolean} [mentionRoles=true] Whether or not to mention roles
   * @param {boolean} [mentionEveryone=true] Whether or not to mention `@everyone`
   * @returns {Promise<Collection<Snowflake, Message>>}
   */
  async getMentions(limit = 25, mentionRoles = true, mentionEveryone = true) {
    // https://canary.discord.com/api/v9/users/@me/mentions?limit=25&roles=true&everyone=true
    const data = await this.client.api.users['@me'].mentions.get({
      query: {
        limit,
        roles: mentionRoles,
        everyone: mentionEveryone,
      },
    });
    const collection = new Collection();
    for (const msg of data) {
      collection.set(msg.id, new Message(this.client, msg));
    }
    return collection;
  }

  /**
   * Change Theme color
   * @param {ColorResolvable} primary The primary color of the user's profile
   * @param {ColorResolvable} accent The accent color of the user's profile
   * @returns {Promise<ClientUser>}
   */
  async setThemeColors(primary, accent) {
    if (!primary || !accent) throw new Error('PRIMARY_COLOR or ACCENT_COLOR are required.');
    // Check nitro
    if (this.nitroType !== 'NITRO_BOOST') {
      throw new Error_('NITRO_BOOST_REQUIRED', 'themeColors');
    }
    primary = Util.resolveColor(primary) || this.themeColors[0];
    accent = Util.resolveColor(accent) || this.themeColors[1];
    const data_ = await this.client.api.users['@me'].profile.patch({
      data: {
        theme_colors: [primary, accent],
      },
    });
    this._ProfilePatch({
      user_profile: data_,
    });
    return this;
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
    if (type !== 'STOP') this._packageName = packageName;
    else this._packageName = null;
    return this;
  }

  /**
   * Stop ringing
   * @param {ChannelResolvable} channel DMChannel | GroupDMChannel
   * @returns {Promise<void>}
   */
  stopRinging(channel) {
    const id = this.client.channels.resolveId(channel);
    if (!channel) return false;
    return this.client.api.channels(id).call['stop-ringing'].post({
      data: {},
    });
  }
}

module.exports = ClientUser;
