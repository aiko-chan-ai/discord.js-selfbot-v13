'use strict';

const { Collection } = require('@discordjs/collection');
const { Channel } = require('./Channel');
const Invite = require('./Invite');
const TextBasedChannel = require('./interfaces/TextBasedChannel');
const MessageManager = require('../managers/MessageManager');
const { Status, Opcodes } = require('../util/Constants');
const DataResolver = require('../util/DataResolver');

/**
 * Represents a Group DM Channel on Discord.
 * @extends {Channel}
 * @implements {TextBasedChannel}
 */
class GroupDMChannel extends Channel {
  constructor(client, data) {
    super(client, data);
    // Override the channel type so partials have a known type
    this.type = 'GROUP_DM';

    /**
     * A manager of the messages belonging to this channel
     * @type {MessageManager}
     */
    this.messages = new MessageManager(this);
  }

  _patch(data) {
    super._patch(data);

    if ('recipients' in data && Array.isArray(data.recipients)) {
      this._recipients = data.recipients;
      data.recipients.forEach(u => this.client.users._add(u));
    } else {
      this._recipients = [];
    }

    if ('last_message_id' in data) {
      /**
       * The channel's last message id, if one was sent
       * @type {?Snowflake}
       */
      this.lastMessageId = data.last_message_id;
    }

    if ('last_pin_timestamp' in data) {
      /**
       * The timestamp when the last pinned message was pinned, if there was one
       * @type {?number}
       */
      this.lastPinTimestamp = new Date(data.last_pin_timestamp).getTime();
    } else {
      this.lastPinTimestamp ??= null;
    }

    if ('owner_id' in data) {
      /**
       * Owner ID
       * @type {Snowflake}
       */
      this.ownerId = data.owner_id;
    }

    if ('name' in data) {
      /**
       * The name of this Group DM Channel
       * @type {?string}
       */
      this.name = data.name;
    }

    if ('icon' in data) {
      /**
       * The hash of the channel icon
       * @type {?string}
       */
      this.icon = data.icon;
    }
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
   * The recipients of this Group DM Channel.
   * @type {Collection<Snowflake, User>}
   * @readonly
   */
  get recipients() {
    const collect = new Collection();
    this._recipients.map(recipient => collect.set(recipient.id, this.client.users.cache.get(recipient.id)));
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
   * Whether this DMChannel is a partial
   * @type {boolean}
   * @readonly
   */
  get partial() {
    return typeof this.lastMessageId === 'undefined';
  }

  /**
   * Leave this Group DM Channel.
   * @param {?boolean} slient Leave without notifying other members
   * @returns {Promise<GroupDMChannel>}
   * @example
   * // Delete the channel
   * channel.delete()
   *   .then(console.log)
   *   .catch(console.error);
   */
  async delete(slient = false) {
    if (typeof slient === 'boolean' && slient) {
      await this.client.api.channels[this.id].delete({
        query: {
          silent: true,
        },
      });
    } else {
      await this.client.api.channels[this.id].delete();
    }
    return this;
  }

  /**
   * When concatenated with a string, this automatically returns the recipient's mention instead of the
   * GroupDMChannel object.
   * @returns {string}
   * @example
   * // Logs: Hello from Group Test!
   * console.log(`Hello from ${channel}!`);
   */
  toString() {
    return (
      this.name ??
      this._recipients
        .filter(user => user.id !== this.client.user.id)
        .map(user => user.username)
        .join(', ')
    );
  }

  toJSON() {
    const json = super.toJSON({
      createdTimestamp: true,
    });
    json.iconURL = this.iconURL();
    return json;
  }

  /**
   * The data for editing a channe;.
   * @typedef {Object} GroupDMChannelEditData
   * @property {string} [name] The name of the channel
   * @property {?(BufferResolvable|Base64Resolvable)} [icon] The icon of the channel
   * @property {GuildMemberResolvable} [owner] The owner of the channel
   */

  /**
   * Edit channel data
   * @param {GroupDMChannelEditData} data Data
   * @returns {Promise<GroupDMChannel>}
   * @example
   * // Set the channel name
   * channel.edit({
   *   name: 'Group Test',
   * })
   *   .then(updated => console.log(`New channel name ${updated}`))
   *   .catch(console.error);
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
    const newData = await this.client.api.channels[this.id].patch({
      data: _data,
    });

    return this.client.actions.ChannelUpdate.handle(newData).updated;
  }

  /**
   * Renames this Group DM Channel.
   * @param {?string} name Name of the channel
   * @returns {Promise<GroupDMChannel>}
   */
  setName(name) {
    return this.edit({ name });
  }

  /**
   * Sets the icon of this Group DM Channel.
   * @param {?(Base64Resolvable|BufferResolvable)} icon Icon of the channel
   * @returns {Promise<GroupDMChannel>}
   */
  setIcon(icon) {
    return this.edit({ icon });
  }

  /**
   * Changes the owner of this Group DM Channel.
   * @param {UserResolvable} user User to transfer ownership to
   * @returns {Promise<GroupDMChannel>}
   */
  setOwner(user) {
    const id = this.client.users.resolveId(user);
    if (this.ownerId === id) {
      return Promise.resolve(this);
    }
    return this.edit({ owner: id });
  }

  /**
   * Adds a user to this Group DM Channel.
   * @param {UserResolvable} user User to add to the group
   * @returns {Promise<GroupDMChannel>}
   */
  async addUser(user) {
    user = this.client.users.resolveId(user);
    await this.client.api.channels[this.id].recipients[user].put();
    return this;
  }

  /**
   * Removes a user from this Group DM Channel.
   * @param {UserResolvable} user User to remove from the group
   * @returns {Promise<GroupDMChannel>}
   */
  async removeUser(user) {
    user = this.client.users.resolveId(user);
    await this.client.api.channels[this.id].recipients[user].delete();
    return this;
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
    return new Invite(this.client, inviteCode);
  }

  /**
   * Get all the invites for this Group DM Channel.
   * @returns {Promise<Collection<string, Invite>>}
   */
  async fetchAllInvite() {
    const invites = await this.client.api.channels(this.id).invites.get();
    return new Collection(invites.map(invite => [invite.code, new Invite(this.client, invite)]));
  }

  /**
   * Delete invites from this Group DM Channel.
   * @param {InviteResolvable} invite Invite to add to the channel
   * @returns {Promise<GroupDMChannel>}
   */
  async removeInvite(invite) {
    // Resolve
    let code = invite?.code;
    if (!code && URL.canParse(invite)) code = new URL(invite).pathname.slice(1);
    else code = invite;
    await this.client.api.channels(this.id).invites[invite].delete();
    return this;
  }

  /**
   * Ring the user's phone / PC (call)
   * @param {UserResolvable[]} [recipients] Array of recipients
   * @returns {Promise<any>}
   */
  ring(recipients) {
    if (!recipients || !Array.isArray(recipients) || recipients.length == 0) recipients = null;
    recipients = recipients.map(r => this.client.users.resolveId(r)).filter(r => r && this.recipients.get(r));
    return this.client.api.channels(this.id).call.ring.post({
      data: {
        recipients,
      },
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

  // These are here only for documentation purposes - they are implemented by TextBasedChannel
  /* eslint-disable no-empty-function */
  get lastMessage() {}
  get lastPinAt() {}
  send() {}
  sendTyping() {}
  createMessageCollector() {}
  awaitMessages() {}
  // Doesn't work on DM channels; setRateLimitPerUser() {}
  // Doesn't work on DM channels; setNSFW() {}
}

TextBasedChannel.applyToClass(GroupDMChannel, true, [
  'fetchWebhooks',
  'createWebhook',
  'setRateLimitPerUser',
  'setNSFW',
]);

module.exports = GroupDMChannel;
