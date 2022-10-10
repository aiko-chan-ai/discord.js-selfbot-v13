'use strict';

const { Collection } = require('@discordjs/collection');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { Channel } = require('./Channel');
const Invite = require('./Invite');
const TextBasedChannel = require('./interfaces/TextBasedChannel');
const { Error } = require('../errors');
const MessageManager = require('../managers/MessageManager');
const { Status, Opcodes } = require('../util/Constants');
const DataResolver = require('../util/DataResolver');

/**
 * Represents a Partial Group DM Channel on Discord.
 * @extends {Channel}
 */
class PartialGroupDMChannel extends Channel {
  constructor(client, data) {
    super(client, data);

    // No flags are present when fetching partial group DM channels.
    this.flags = null;

    /**
     * The name of this Group DM Channel
     * @type {?string}
     */
    this.name = null;

    /**
     * The hash of the channel icon
     * @type {?string}
     */
    this.icon = null;

    /**
     * Messages data
     * @type {Collection}
     */
    this.messages = new MessageManager(this);

    /**
     * Last Message ID
     * @type {?Snowflake}
     */
    this.lastMessageId = null;

    /**
     * Last Pin Timestamp
     * @type {UnixTimestamp}
     */
    this.lastPinTimestamp = null;

    /**
     * Owner ID
     * @type {?Snowflake}
     */
    this.ownerId = null;

    /**
     * Invites fetch
     * @type {Collection<string, Invite>}
     */
    this.invites = new Collection();

    this._recipients = [];

    this._patch(data);
  }

  /**
   * The recipients of this Group DM Channel.
   * @type {Collection<Snowflake, User>}
   * @readonly
   */
  get recipients() {
    const collect = new Collection();
    this._recipients.map(recipient => collect.set(recipient.id, this.client.users._add(recipient)));
    collect.set(this.client.user.id, this.client.user);
    return collect;
  }

  /**
   * The owner of this Group DM Channel
   * @type {?User}
   * @readonly
   */
  get owner() {
    return this.client.users.cache.get(this.ownerId);
  }

  /**
   *
   * @param {Object} data Channel Data
   * @private
   */
  _patch(data) {
    super._patch(data);
    if ('recipients' in data) {
      this._recipients = data.recipients;
    }
    if ('last_pin_timestamp' in data) {
      const date = new Date(data.last_pin_timestamp);
      this.lastPinTimestamp = date.getTime();
    }
    if ('last_message_id' in data) {
      this.lastMessageId = data.last_message_id;
    }
    if ('owner_id' in data) {
      this.ownerId = data.owner_id;
    }
    if ('name' in data) {
      this.name = data.name;
    }
    if ('icon' in data) {
      this.icon = data.icon;
    }
  }

  /**
   * Edit channel data
   * @param {Object} data name, icon owner
   * @returns {Promise<undefined>}
   * @private
   */
  async edit(data) {
    const _data = {};
    if ('name' in data) _data.name = data.name?.trim() ?? null;
    if (typeof data.icon !== 'undefined') {
      _data.icon = await DataResolver.resolveImage(data.icon);
    }
    if ('owner' in data) {
      _data.owner = data.owner;
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
    user = this.client.users.resolveId(user);
    if (!user) {
      return Promise.reject(new TypeError('User is not a User or User ID'));
    }
    if (this.recipients.get(user)) return Promise.reject(new Error('USER_ALREADY_IN_GROUP_DM_CHANNEL')); // Fails sometimes if member leaves recently (ex. user leave msg's channel used for adding)
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
   * Changes the owner of this Group DM Channel.
   * @param {UserResolvable} user User to transfer ownership to
   * @returns {Promise<PartialGroupDMChannel>}
   */
  setOwner(user) {
    const id = this.client.users.resolveId(user);
    if (!id) {
      throw new TypeError('User is not a User or User ID');
    }
    if (this.ownerId !== this.client.user.id) {
      throw new Error('NOT_OWNER_GROUP_DM_CHANNEL');
    }
    if (this.ownerId === id) {
      return this;
    }
    return this.edit({ owner: id });
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

  /**
   * Leave this Group DM Channel.
   * @param {?boolean} slient Leave without notifying other members
   * @returns {Promise<Channel>}
   * @example
   * // Delete the channel
   * channel.delete()
   *   .then(console.log)
   *   .catch(console.error);
   */
  async delete(slient = false) {
    if (typeof slient === 'boolean' && slient) {
      await this.client.api.channels(this.id).delete({
        query: {
          silent: true,
        },
      });
    } else {
      await this.client.api.channels(this.id).delete();
    }
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
  /**
   * Sync VoiceState of this Group DMChannel.
   * @returns {undefined}
   */
  sync() {
    this.client.ws.broadcast({
      op: Opcodes.DM_UPDATE,
      d: {
        channel_id: this.id,
      },
    });
  }
  /**
   * The user in this voice-based channel
   * @type {Collection<Snowflake, User>}
   * @readonly
   */
  get voiceUsers() {
    const coll = new Collection();
    for (const state of this.client.voiceStates.cache.values()) {
      if (state.channelId === this.id && state.user) {
        coll.set(state.id, state.user);
      }
    }
    return coll;
  }
  /**
   * Get connection to current call
   * @type {?VoiceConnection}
   * @readonly
   */
  get voiceConnection() {
    const check = this.client.callVoice?.joinConfig?.channelId == this.id;
    if (check) {
      return this.client.callVoice;
    }
    return null;
  }
  /**
   * Get current shard
   * @type {WebSocketShard}
   * @readonly
   */
  get shard() {
    return this.client.ws.shards.first();
  }
  /**
   * The voice state adapter for this client that can be used with @discordjs/voice to play audio in DM / Group DM channels.
   * @type {?Function}
   * @readonly
   */
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
