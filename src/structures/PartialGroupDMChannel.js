'use strict';

const { Collection } = require('@discordjs/collection');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { Channel } = require('./Channel');
const Invite = require('./Invite');
const TextBasedChannel = require('./interfaces/TextBasedChannel');
const { Error } = require('../errors');
const MessageManager = require('../managers/MessageManager');
const { Status } = require('../util/Constants');
const DataResolver = require('../util/DataResolver');

/**
 * Represents a Partial Group DM Channel on Discord.
 * @extends {Channel}
 */
class PartialGroupDMChannel extends Channel {
  constructor(client, data) {
    super(client, data);
    /**
     * The name of this Group DM Channel
     * @type {?string}
     */
    this.name = data.name;

    /**
     * The hash of the channel icon
     * @type {?string}
     */
    this.icon = data.icon;

    /**
     * Recipient data received in a {@link PartialGroupDMChannel}.
     * @typedef {Object} PartialRecipient
     * @property {string} username The username of the recipient
     */

    /**
     * The recipients of this Group DM Channel.
     * @type {PartialRecipient[]}
     */
    this.recipients = new Collection();

    /**
     * Messages data
     * @type {Collection}
     */
    this.messages = new MessageManager(this);

    /**
     * Last Message ID
     * @type {?snowflake<Message.id>}
     */
    this.lastMessageId = null;

    /**
     * Last Pin Timestamp
     * @type {UnixTimestamp}
     */
    this.lastPinTimestamp = null;

    /**
     * The owner of this Group DM Channel
     * @type {?User}
     * @readonly
     */
    this.owner = client.users.cache.get(data.owner_id);
    this.ownerId = data.owner_id;

    /**
     * Invites fetch
     * @type {Collection<string, Invite>}
     */
    this.invites = new Collection();

    this._setup(client, data);
  }

  /**
   *
   * @param {Discord.Client} client Discord Bot Client
   * @param {Object} data Channel Data
   * @private
   */
  _setup(client, data) {
    if ('recipients' in data) {
      Promise.all(
        data.recipients.map(recipient =>
          this.recipients.set(recipient.id, client.users.cache.get(data.owner_id) || recipient),
        ),
      );
    }
    if ('last_pin_timestamp' in data) {
      const date = new Date(data.last_pin_timestamp);
      this.lastPinTimestamp = date.getTime();
    }
    if ('last_message_id' in data) {
      this.lastMessageId = data.last_message_id;
    }
  }

  /**
   *
   * @param {Object} data name, icon
   * @returns {any} any data .-.
   * @private
   */
  async edit(data) {
    const _data = {};
    if ('name' in data) _data.name = data.name?.trim() ?? null;
    if (typeof data.icon !== 'undefined') {
      _data.icon = await DataResolver.resolveImage(data.icon);
    }
    const newData = await this.client.api.channels(this.id).patch({
      data: _data,
    });

    return this.client.actions.ChannelUpdate.handle(newData).updated;
  }

  /**
   * The URL to this channel's icon.
   * @param {StaticImageURLOptions} [options={}] Options for the Image URL
   * @returns {?string}
   */
  iconURL({ format, size } = {}) {
    return this.icon && this.client.rest.cdn.GDMIcon(this.id, this.icon, format, size);
  }

  /**
   * Adds a user to this Group DM Channel.
   * @param {UserResolvable} user User to add to the group
   * @returns {Promise<PartialGroupDMChannel>}
   */
  async addMember(user) {
    if (this.ownerId !== this.client.user.id) {
      return Promise.reject(new Error('NOT_OWNER_GROUP_DM_CHANNEL'));
    }
    user = this.client.users.resolveId(user);
    if (!user) {
      return Promise.reject(new TypeError('User is not a User or User ID'));
    }
    if (this.recipients.get(user)) return Promise.reject(new Error('USER_ALREADY_IN_GROUP_DM_CHANNEL'));
    //
    await this.client.api.channels[this.id].recipients[user].put();
    this.recipients.set(user, this.client.users.cache.get(user));
    return this;
  }

  /**
   * Removes a user from this Group DM Channel.
   * @param {UserResolvable} user User to remove from the group
   * @returns {Promise<PartialGroupDMChannel>}
   */
  async removeMember(user) {
    if (this.ownerId !== this.client.user.id) {
      return Promise.reject(new Error('NOT_OWNER_GROUP_DM_CHANNEL'));
    }
    user = this.client.users.resolveId(user);
    if (!user) {
      return Promise.reject(new TypeError('User is not a User or User ID'));
    }
    if (!this.recipients.get(user)) return Promise.reject(new Error('USER_NOT_IN_GROUP_DM_CHANNEL'));
    await this.client.api.channels[this.id].recipients[user].delete();
    this.recipients.delete(user);
    return this;
  }

  /**
   * Renames this Group DM Channel.
   * @param {?string} name Name of the channel
   * @returns {Promise<PartialGroupDMChannel>}
   */
  setName(name) {
    return this.edit({ name });
  }

  /**
   * Sets the icon of this Group DM Channel.
   * @param {?(Base64Resolvable|BufferResolvable)} icon Icon of the channel
   * @returns {Promise<PartialGroupDMChannel>}
   */
  setIcon(icon) {
    return this.edit({ icon });
  }

  /**
   * Gets the invite for this Group DM Channel.
   * @returns {Promise<Invite>}
   */
  async getInvite() {
    const inviteCode = await this.client.api.channels(this.id).invites.post({
      data: {
        max_age: 86400,
      },
    });
    const invite = new Invite(this.client, inviteCode);
    this.invites.set(invite.code, invite);
    return invite;
  }

  /**
   * Get all the invites for this Group DM Channel.
   * @param {boolean} force Using API to fetch invites or cache
   * @returns {Promise<Collection<string, Invite>>}
   */
  async fetchInvite(force = false) {
    if (this.ownerId !== this.client.user.id) {
      return Promise.reject(new Error('NOT_OWNER_GROUP_DM_CHANNEL'));
    }
    if (!force && this.invites.size) return this.invites;
    const invites = await this.client.api.channels(this.id).invites.get();
    await Promise.all(invites.map(invite => this.invites.set(invite.code, new Invite(this.client, invite))));
    return this.invites;
  }

  /**
   * Delete invites from this Group DM Channel.
   * @param {Invite} invite Invite to add to the channel
   * @returns {Promise<PartialGroupDMChannel>}
   */
  async removeInvite(invite) {
    if (this.ownerId !== this.client.user.id) {
      return Promise.reject(new Error('NOT_OWNER_GROUP_DM_CHANNEL'));
    }
    if (!(invite instanceof Invite)) {
      return Promise.reject(new TypeError('Invite is not an instance of Discord.Invite'));
    }
    await this.client.api.channels(this.id).invites[invite.code].delete();
    this.invites.delete(invite.code);
    return this;
  }

  // These are here only for documentation purposes - they are implemented by TextBasedChannel
  /* eslint-disable no-empty-function */
  get lastMessage() {}
  get lastPinAt() {}
  send() {}
  sendTyping() {}

  /**
   * @typedef {Object} CallOptions
   * @property {boolean} [selfDeaf] Whether to deafen yourself
   * @property {boolean} [selfMute] Whether to mute yourself
   */
  // Testing feature: Call
  // URL: https://discord.com/api/v9/channels/DMchannelId/call/ring
  /**
   * Call this Group DMChannel. Return discordjs/voice VoiceConnection
   * @param {CallOptions} options Options for the call
   * @returns {Promise<VoiceConnection>}
   */
  call(options = {}) {
    return new Promise((resolve, reject) => {
      this.client.api
        .channels(this.id)
        .call.ring.post({
          body: {
            recipients: null,
          },
        })
        .catch(e => {
          console.error('Emit ring error:', e.message);
        });
      const connection = joinVoiceChannel({
        channelId: this.id,
        guildId: null,
        adapterCreator: this.voiceAdapterCreator,
        selfDeaf: options.selfDeaf ?? false,
        selfMute: options.selfMute ?? false,
      });
      entersState(connection, VoiceConnectionStatus.Ready, 30000)
        .then(connection => {
          resolve(connection);
        })
        .catch(err => {
          connection.destroy();
          reject(err);
        });
    });
  }
  get shard() {
    return this.client.ws.shards.first();
  }
  get voiceAdapterCreator() {
    return methods => {
      this.client.voice.adapters.set(this.id, methods);
      return {
        sendPayload: data => {
          data.d = {
            ...data.d,
            self_video: false,
          };
          if (this.shard.status !== Status.READY) return false;
          this.shard.send(data);
          return true;
        },
        destroy: () => {
          this.client.voice.adapters.delete(this.id);
        },
      };
    };
  }
}

TextBasedChannel.applyToClass(PartialGroupDMChannel, true, [
  'bulkDelete',
  'fetchWebhooks',
  'createWebhook',
  'setRateLimitPerUser',
  'setNSFW',
]);

module.exports = PartialGroupDMChannel;
