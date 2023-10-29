'use strict';

const { Collection } = require('@discordjs/collection');
const Base = require('./Base');
const ClientApplication = require('./ClientApplication');
const VoiceState = require('./VoiceState');
const TextBasedChannel = require('./interfaces/TextBasedChannel');
const { Error } = require('../errors');
const { RelationshipTypes, NitroType } = require('../util/Constants');
const SnowflakeUtil = require('../util/SnowflakeUtil');
const UserFlags = require('../util/UserFlags');
const Util = require('../util/Util');

/**
 * Represents a user on Discord.
 * @implements {TextBasedChannel}
 * @extends {Base}
 */
class User extends Base {
  constructor(client, data, application) {
    super(client);
    /**
     * The user's id
     * @type {Snowflake}
     */
    this.id = data.id;

    this.bot = null;

    this.system = null;

    this.flags = null;

    /**
     * An array of object (connected accounts), containing the following properties:
     * @property {string} type The account type (twitch, youtube, etc)
     * @property {string} name The account name
     * @property {string} id The account id
     * @property {boolean} verified Whether the account is verified
     * @see {@link https://discord.com/developers/docs/resources/user#connection-object}
     * @typedef {Object} ConnectionAccount
     */

    /**
     * Accounts connected to this user
     * <info>The user must be force fetched for this property to be present or be updated</info>
     * @type {?ConnectionAccount[]}
     */
    this.connectedAccounts = [];
    /**
     * Time that User has nitro (Unix Timestamp)
     * <info>The user must be force fetched for this property to be present or be updated</info>
     * @type {?number}
     */
    this.premiumSince = null;
    /**
     * Time that User has nitro and boost server (Unix Timestamp)
     * @type {?number}
     */
    this.premiumGuildSince = null;
    /**
     * About me (User)
     * <info>The user must be force fetched for this property to be present or be updated</info>
     * @type {?string}
     */
    this.bio = null;
    /**
     * Pronouns (User)
     * <info>The user must be force fetched for this property to be present or be updated</info>
     * @type {?string}
     */
    this.pronouns = null;
    this._mutualGuilds = [];
    /**
     * [Bot] Application
     * @type {?ClientApplication}
     */
    this.application = application ? new ClientApplication(this.client, application, this) : null;
    this._partial = true;
    this._patch(data);
  }

  _patch(data) {
    if ('username' in data) {
      /**
       * The username of the user
       * @type {?string}
       */
      this.username = data.username;
    } else {
      this.username ??= null;
    }

    if ('global_name' in data) {
      /**
       * The global name of this user
       * @type {?string}
       */
      this.globalName = data.global_name;
    } else {
      this.globalName ??= null;
    }

    if ('bot' in data) {
      /**
       * Whether or not the user is a bot
       * @type {?boolean}
       */
      this.bot = Boolean(data.bot);
      if (this.bot === true && !this.application) {
        this.application = new ClientApplication(this.client, { id: this.id }, this);
        this.botInGuildsCount = null;
      }
    } else if (!this.partial && typeof this.bot !== 'boolean') {
      this.bot = false;
    }

    if ('discriminator' in data) {
      /**
       * The discriminator of this user
       * <info>`'0'`, or a 4-digit stringified number if they're using the legacy username system</info>
       * @type {?string}
       */
      this.discriminator = data.discriminator;
    } else {
      this.discriminator ??= null;
    }

    if ('avatar' in data) {
      /**
       * The user avatar's hash
       * @type {?string}
       */
      this.avatar = data.avatar;
    } else {
      this.avatar ??= null;
    }

    if ('banner' in data) {
      /**
       * The user banner's hash
       * <info>The user must be force fetched for this property to be present or be updated</info>
       * @type {?string}
       */
      this.banner = data.banner;
    } else if (this.banner !== null) {
      this.banner ??= undefined;
    }

    if ('accent_color' in data) {
      /**
       * The base 10 accent color of the user's banner
       * <info>The user must be force fetched for this property to be present or be updated</info>
       * @type {?number}
       */
      this.accentColor = data.accent_color;
    } else if (this.accentColor !== null) {
      this.accentColor ??= undefined;
    }

    if ('system' in data) {
      /**
       * Whether the user is an Official Discord System user (part of the urgent message system)
       * @type {?boolean}
       */
      this.system = Boolean(data.system);
    } else if (!this.partial && typeof this.system !== 'boolean') {
      this.system = false;
    }

    if ('public_flags' in data) {
      /**
       * The flags for this user
       * @type {?UserFlags}
       */
      this.flags = new UserFlags(data.public_flags);
    }

    if ('approximate_guild_count' in data) {
      /**
       * Check how many guilds the bot is in (Probably only approximate) (application.fetch() first)
       * @type {?number}
       */
      this.botInGuildsCount = data.approximate_guild_count;
    }

    if ('avatar_decoration' in data) {
      /**
       * The user avatar decoration's hash
       * @type {?string}
       */
      this.avatarDecoration = data.avatar_decoration;
    } else {
      this.avatarDecoration ??= null;
    }
  }

  /**
   * This user is on the same servers as Client User
   * <info>The user must be force fetched for this property to be present or be updated</info>
   * @type {Collection<Snowflake, Guild>}
   * @readonly
   */
  get mutualGuilds() {
    return new Collection(this._mutualGuilds.map(obj => [obj.id, obj]));
  }

  /**
   * Get all mutual friends (Client -> User)
   * @type {Promise<Collection<Snowflake, User>>}
   * @readonly
   */
  get mutualFriends() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async resolve => {
      const all = new Collection();
      if (this.bot || this.client.user.id === this.id) return resolve(all);
      const data = await this.client.api.users(this.id).relationships.get();
      for (const u of data) {
        all.set(u.id, this.client.users._add(u));
      }
      return resolve(all);
    });
  }

  /**
   * Check relationship status (Client -> User)
   * @type {RelationshipTypes}
   * @readonly
   */
  get relationships() {
    const i = this.client.relationships.cache.get(this.id) ?? 0;
    return RelationshipTypes[parseInt(i)];
  }

  /**
   * Check note
   * @type {?string}
   * @readonly
   */
  get note() {
    return this.client.user.notes.get(this.id);
  }

  /**
   * Get friend nickname
   * @type {?string}
   * @readonly
   */
  get nickname() {
    return this.client.user.friendNicknames.get(this.id);
  }

  /**
   * The voice state of this member
   * @type {VoiceState}
   * @readonly
   */
  get voice() {
    return (
      this.client.voiceStates.cache.get(this.id) ??
      this.client.guilds.cache.find(g => g?.voiceStates?.cache?.get(this.id))?.voiceStates?.cache?.get(this.id) ??
      new VoiceState({ client: this.client }, { user_id: this.id })
    );
  }

  _ProfilePatch(data) {
    if (!data) return;

    this._partial = false;

    if (data.connected_accounts.length > 0) {
      this.connectedAccounts = data.connected_accounts;
    }

    if ('premium_since' in data) {
      const date = new Date(data.premium_since);
      this.premiumSince = date.getTime();
    }

    if ('premium_guild_since' in data) {
      const date = new Date(data.premium_guild_since);
      this.premiumGuildSince = date.getTime();
    }

    if ('premium_type' in data) {
      const nitro = NitroType[data.premium_type ?? 0];
      /**
       * Nitro type of the user.
       * @type {NitroType}
       */
      this.nitroType = nitro ?? `UNKNOWN_TYPE_${data.premium_type}`;
    }

    if ('user_profile' in data) {
      this.bio = data.user_profile.bio;
      /**
       * The user's theme colors (Profile theme) [Primary, Accent]
       * <info>The user must be force fetched for this property to be present or be updated</info>
       * @type {?Array<number>}
       */
      this.themeColors = data.user_profile.theme_colors;

      this.pronouns = data.user_profile.pronouns;
    }

    if ('guild_member_profile' in data && 'guild_member' in data) {
      const guild = this.client.guilds.cache.get(data.guild_member_profile.guild_id);
      const member = guild?.members._add(data.guild_member);
      member._ProfilePatch(data.guild_member_profile);
    }

    if ('application' in data) {
      this.application = new ClientApplication(this.client, data.application, this);
    }

    if ('badges' in data) {
      /**
       * @callback BadgeIcon
       * @returns {string}
       */

      /**
       * @typedef {Object} UserBadge
       * @property {string} id The id of the badge
       * @property {string} description The description of the badge
       * @property {string} icon The icon hash of the badge
       * @property {?string} link The link of the badge
       * @property {BadgeIcon} iconURL The iconURL of the badge
       */

      /**
       * User badges (Boost, Slash, AutoMod, etc.)
       * @type {?Array<UserBadge>}
       */
      this.badges = data.badges.map(o => ({ ...o, iconURL: () => this.client.rest.cdn.BadgeIcon(o.icon) }));
    }

    if ('guild_badges' in data) {
      // Unknown
    }

    if ('mutual_guilds' in data) {
      this._mutualGuilds = data.mutual_guilds;
    }
  }

  /**
   * Get profile from Discord, if client is in a server with the target.
   * @type {User}
   * @param {Snowflake | null} guildId The guild id to get the profile from
   * @returns {Promise<User>}
   */
  async getProfile(guildId) {
    if (this.client.bot) throw new Error('INVALID_BOT_METHOD');
    const query = guildId
      ? {
          with_mutual_guilds: true,
          guild_id: guildId,
        }
      : {
          with_mutual_guilds: true,
        };
    const data = await this.client.api.users(this.id).profile.get({
      query,
    });
    this._ProfilePatch(data);
    return this;
  }

  /**
   * Friends the user [If incoming request]
   * @type {boolean}
   * @returns {Promise<boolean>}
   */
  setFriend() {
    return this.client.relationships.addFriend(this);
  }

  /**
   * Changes the nickname of the friend
   * @param {?string} nickname The nickname to change
   * @type {boolean}
   * @returns {Promise<boolean>}
   */
  setNickname(nickname) {
    return this.client.relationships.setNickname(this.id, nickname);
  }

  /**
   * Send Friend Request to the user
   * @type {boolean}
   * @returns {Promise<boolean>}
   */
  sendFriendRequest() {
    return this.client.relationships.sendFriendRequest(this.username, this.discriminator);
  }
  /**
   * Blocks the user
   * @type {boolean}
   * @returns {Promise<boolean>}
   */
  setBlock() {
    return this.client.relationships.addBlocked(this);
  }

  /**
   * Removes the user from your blocks list
   * @type {boolean}
   * @returns {Promise<boolean>}
   */
  unBlock() {
    return this.client.relationships.deleteBlocked(this);
  }

  /**
   * Removes the user from your friends list
   * @type {boolean}
   * @returns {Promise<boolean>}
   */
  unFriend() {
    return this.client.relationships.deleteFriend(this);
  }

  /**
   * Whether this User is a partial
   * @type {boolean}
   * @readonly
   */
  get partial() {
    return typeof this.username !== 'string';
  }

  /**
   * The timestamp the user was created at
   * @type {number}
   * @readonly
   */
  get createdTimestamp() {
    return SnowflakeUtil.timestampFrom(this.id);
  }

  /**
   * The time the user was created at
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return new Date(this.createdTimestamp);
  }

  /**
   * A link to the user's avatar.
   * @param {ImageURLOptions} [options={}] Options for the Image URL
   * @returns {?string}
   */
  avatarURL({ format, size, dynamic } = {}) {
    if (!this.avatar) return null;
    return this.client.rest.cdn.Avatar(this.id, this.avatar, format, size, dynamic);
  }

  /**
   * A link to the user's avatar decoration.
   * @param {StaticImageURLOptions} [options={}] Options for the image URL
   * @returns {?string}
   */
  avatarDecorationURL({ format, size } = {}) {
    if (!this.avatarDecoration) return null;
    return this.client.rest.cdn.AvatarDecoration(this.id, this.avatarDecoration, format, size);
  }

  /**
   * A link to the user's default avatar
   * @type {string}
   * @readonly
   */
  get defaultAvatarURL() {
    const index = this.discriminator === '0' ? Util.calculateUserDefaultAvatarIndex(this.id) : this.discriminator % 5;
    return this.client.rest.cdn.DefaultAvatar(index);
  }

  /**
   * A link to the user's avatar if they have one.
   * Otherwise a link to their default avatar will be returned.
   * @param {ImageURLOptions} [options={}] Options for the Image URL
   * @returns {string}
   */
  displayAvatarURL(options) {
    return this.avatarURL(options) ?? this.defaultAvatarURL;
  }

  /**
   * The hexadecimal version of the user accent color, with a leading hash
   * <info>The user must be force fetched for this property to be present</info>
   * @type {?string}
   * @readonly
   */
  get hexAccentColor() {
    if (typeof this.accentColor !== 'number') return this.accentColor;
    return `#${this.accentColor.toString(16).padStart(6, '0')}`;
  }

  /**
   * A link to the user's banner.
   * <info>This method will throw an error if called before the user is force fetched.
   * See {@link User#banner} for more info</info>
   * @param {ImageURLOptions} [options={}] Options for the Image URL
   * @returns {?string}
   */
  bannerURL({ format, size, dynamic } = {}) {
    if (typeof this.banner === 'undefined') {
      throw new Error('USER_BANNER_NOT_FETCHED');
    }
    if (!this.banner) return null;
    return this.client.rest.cdn.Banner(this.id, this.banner, format, size, dynamic);
  }

  /**
   * Ring the user's phone / PC (call)
   * @returns {Promise<any>}
   * @deprecated
   */
  ring() {
    if (this.relationships !== 'FRIEND') return Promise.reject(new Error('USER_NOT_FRIEND'));
    if (!this.client.user.voice?.channelId || !this.client.callVoice) {
      return Promise.reject(new Error('CLIENT_NO_CALL'));
    }
    return this.client.api.channels(this.dmChannel.id).call.ring.post({
      data: {
        recipients: [this.id],
      },
    });
  }

  /**
   * The hexadecimal version of the user theme color, with a leading hash [Primary, Accent]
   * <info>The user must be force fetched for this property to be present or be updated</info>
   * @type {?Array<string>}
   * @readonly
   */
  get hexThemeColor() {
    return this.themeColors?.map(c => `#${c.toString(16).padStart(6, '0')}`) || null;
  }

  /**
   * The tag of this user
   * <info>This user's username, or their legacy tag (e.g. `hydrabolt#0001`)
   * if they're using the legacy username system</info>
   * @type {?string}
   * @readonly
   */
  get tag() {
    return typeof this.username === 'string'
      ? this.discriminator === '0'
        ? this.username
        : `${this.username}#${this.discriminator}`
      : null;
  }

  /**
   * The global name of this user, or their username if they don't have one
   * @type {?string}
   * @readonly
   */
  get displayName() {
    return this.globalName ?? this.username;
  }

  /**
   * The DM between the client's user and this user
   * @type {?DMChannel}
   * @readonly
   */
  get dmChannel() {
    return this.client.users.dmChannel(this.id);
  }

  /**
   * Creates a DM channel between the client and the user.
   * @param {boolean} [force=false] Whether to skip the cache check and request the API
   * @returns {Promise<DMChannel>}
   */
  createDM(force = false) {
    return this.client.users.createDM(this.id, force);
  }

  /**
   * Deletes a DM channel (if one exists) between the client and the user. Resolves with the channel if successful.
   * @returns {Promise<DMChannel>}
   */
  deleteDM() {
    return this.client.users.deleteDM(this.id);
  }

  /**
   * Checks if the user is equal to another.
   * It compares id, username, discriminator, avatar, banner, accent color, and bot flags.
   * It is recommended to compare equality by using `user.id === user2.id` unless you want to compare all properties.
   * @param {User} user User to compare with
   * @returns {boolean}
   */
  equals(user) {
    return (
      user &&
      this.id === user.id &&
      this.username === user.username &&
      this.discriminator === user.discriminator &&
      this.globalName === user.globalName &&
      this.avatar === user.avatar &&
      this.flags?.bitfield === user.flags?.bitfield &&
      this.banner === user.banner &&
      this.accentColor === user.accentColor &&
      this.bio === user.bio
    );
  }

  /**
   * Compares the user with an API user object
   * @param {APIUser} user The API user object to compare
   * @returns {boolean}
   * @private
   */
  _equals(user) {
    return (
      user &&
      this.id === user.id &&
      this.username === user.username &&
      this.discriminator === user.discriminator &&
      this.globalName === user.global_name &&
      this.avatar === user.avatar &&
      this.flags?.bitfield === user.public_flags &&
      ('banner' in user ? this.banner === user.banner : true) &&
      ('accent_color' in user ? this.accentColor === user.accent_color : true)
    );
  }

  /**
   * Fetches this user's flags.
   * @param {boolean} [force=false] Whether to skip the cache check and request the API
   * @returns {Promise<UserFlags>}
   */
  fetchFlags(force = false) {
    return this.client.users.fetchFlags(this.id, { force });
  }

  /**
   * Fetches this user.
   * @param {boolean} [force=true] Whether to skip the cache check and request the API
   * @returns {Promise<User>}
   */
  fetch(force = true) {
    return this.client.users.fetch(this.id, { force });
  }

  /**
   * When concatenated with a string, this automatically returns the user's mention instead of the User object.
   * @returns {string}
   * @example
   * // Logs: Hello from <@123456789012345678>!
   * console.log(`Hello from ${user}!`);
   */
  toString() {
    return `<@${this.id}>`;
  }

  toJSON(...props) {
    const json = super.toJSON(
      {
        createdTimestamp: true,
        defaultAvatarURL: true,
        hexAccentColor: true,
        tag: true,
      },
      ...props,
    );
    json.avatarURL = this.avatarURL();
    json.displayAvatarURL = this.displayAvatarURL();
    json.bannerURL = this.banner ? this.bannerURL() : this.banner;
    return json;
  }

  /**
   * Set note to user
   * @param {string} note Note to set
   * @returns {Promise<User>}
   */
  async setNote(note = null) {
    await this.client.api.users['@me'].notes(this.id).put({ data: { note } });
    return this;
  }

  /**
   * Get presence (~ v12)
   * @returns {Promise<Presence | null>}
   */
  async presenceFetch() {
    let data = null;
    await Promise.all(
      this.client.guilds.cache.map(async guild => {
        const res_ = await guild.presences.resolve(this.id);
        if (res_) return (data = res_);
        return true;
      }),
    );
    return data;
  }
}

/**
 * Sends a message to this user.
 * @method send
 * @memberof User
 * @instance
 * @param {string|MessagePayload|MessageOptions} options The options to provide
 * @returns {Promise<Message>}
 * @example
 * // Send a direct message
 * user.send('Hello!')
 *   .then(message => console.log(`Sent message: ${message.content} to ${user.tag}`))
 *   .catch(console.error);
 */

TextBasedChannel.applyToClass(User);

module.exports = User;

/**
 * @external APIUser
 * @see {@link https://discord.com/developers/docs/resources/user#user-object}
 */
