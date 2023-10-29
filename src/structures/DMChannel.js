'use strict';

const { Collection } = require('@discordjs/collection');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { Channel } = require('./Channel');
const TextBasedChannel = require('./interfaces/TextBasedChannel');
const InteractionManager = require('../managers/InteractionManager');
const MessageManager = require('../managers/MessageManager');
const { Status, Opcodes } = require('../util/Constants');

/**
 * Represents a direct message channel between two users.
 * @extends {Channel}
 * @implements {TextBasedChannel}
 */
class DMChannel extends Channel {
  constructor(client, data) {
    super(client, data);

    // Override the channel type so partials have a known type
    this.type = 'DM';

    /**
     * A manager of the messages belonging to this channel
     * @type {MessageManager}
     */
    this.messages = new MessageManager(this);

    /**
     * A manager of the interactions sent to this channel
     * @type {InteractionManager}
     */
    this.interactions = new InteractionManager(this);
  }

  _patch(data) {
    super._patch(data);

    if (data.recipients) {
      /**
       * The recipient on the other end of the DM
       * @type {User}
       */
      this.recipient = this.client.users._add(data.recipients[0]);
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

    if ('is_message_request' in data) {
      /**
       * Whether the channel is a message request
       * @type {boolean}
       */
      this.messageRequest = data.is_message_request;
    }

    if ('is_message_request_timestamp' in data) {
      /**
       * The timestamp when the message request was created
       * @type {?number}
       */
      this.messageRequestTimestamp = new Date(data.is_message_request_timestamp).getTime();
    }
  }

  /**
   * Accept this DMChannel.
   * @returns {Promise<DMChannel>}
   */
  async acceptMessageRequest() {
    if (!this.messageRequest) {
      throw new Error('NOT_MESSAGE_REQUEST', 'This channel is not a message request');
    }
    const c = await this.client.api.channels[this.id].recipients['@me'].put({
      data: {
        consent_status: 2,
      },
    });
    this.messageRequest = false;
    return this.client.channels._add(c);
  }

  /**
   * Cancel this DMChannel.
   * @returns {Promise<DMChannel>}
   */
  async cancelMessageRequest() {
    if (!this.messageRequest) {
      throw new Error('NOT_MESSAGE_REQUEST', 'This channel is not a message request');
    }
    await this.client.api.channels[this.id].recipients['@me'].delete();
    return this;
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
   * Fetch this DMChannel.
   * @param {boolean} [force=true] Whether to skip the cache check and request the API
   * @returns {Promise<DMChannel>}
   */
  fetch(force = true) {
    return this.recipient.createDM(force);
  }

  /**
   * When concatenated with a string, this automatically returns the recipient's mention instead of the
   * DMChannel object.
   * @returns {string}
   * @example
   * // Logs: Hello from <@123456789012345678>!
   * console.log(`Hello from ${channel}!`);
   */
  toString() {
    return this.recipient.toString();
  }

  // These are here only for documentation purposes - they are implemented by TextBasedChannel
  /* eslint-disable no-empty-function */
  get lastMessage() {}
  get lastPinAt() {}
  send() {}
  sendTyping() {}
  createMessageCollector() {}
  awaitMessages() {}
  createMessageComponentCollector() {}
  awaitMessageComponent() {}
  sendSlash() {}
  searchInteraction() {}
  // Doesn't work on DM channels; bulkDelete() {}
  // Doesn't work on DM channels; setRateLimitPerUser() {}
  // Doesn't work on DM channels; setNSFW() {}
  // Testing feature: Call
  // URL: https://discord.com/api/v9/channels/:DMchannelId/call/ring
  /**
   * Call this DMChannel. Return discordjs/voice VoiceConnection
   * @param {CallOptions} options Options for the call
   * @returns {Promise<VoiceConnection>}
   */
  call(options = {}) {
    options = Object.assign(
      {
        ring: true,
      },
      options || {},
    );
    return new Promise((resolve, reject) => {
      if (!this.client.options.patchVoice) {
        reject(
          new Error(
            'VOICE_NOT_PATCHED',
            'Enable voice patching in client options\nhttps://discordjs-self-v13.netlify.app/#/docs/docs/main/typedef/ClientOptions',
          ),
        );
      } else {
        if (options.ring) {
          this.ring();
        }
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
      }
    });
  }

  /**
   * Ring the user's phone / PC (call)
   * @returns {Promise<any>}
   */
  ring() {
    return this.client.api.channels(this.id).call.ring.post({
      data: {
        recipients: null,
      },
    });
  }

  /**
   * Sync VoiceState of this DMChannel.
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

TextBasedChannel.applyToClass(DMChannel, true, [
  'bulkDelete',
  'fetchWebhooks',
  'createWebhook',
  'setRateLimitPerUser',
  'setNSFW',
]);

module.exports = DMChannel;
