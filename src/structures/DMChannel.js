'use strict';

const { Collection } = require('@discordjs/collection');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { Channel } = require('./Channel');
const TextBasedChannel = require('./interfaces/TextBasedChannel');
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
  // Doesn't work on DM channels; bulkDelete() {}
  // Doesn't work on DM channels; setRateLimitPerUser() {}
  // Doesn't work on DM channels; setNSFW() {}
  // Testing feature: Call
  // URL: https://discord.com/api/v9/channels/DMchannelId/call/ring
  /**
   * Call this DMChannel. Return discordjs/voice VoiceConnection
   * @param {CallOptions} options Options for the call
   * @returns {Promise<VoiceConnection>}
   */
  call(options = {}) {
    return new Promise((resolve, reject) => {
      this.client.api
        .channels(this.id)
        .call.ring.post({
          data: {
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

TextBasedChannel.applyToClass(DMChannel, true, [
  'bulkDelete',
  'fetchWebhooks',
  'createWebhook',
  'setRateLimitPerUser',
  'setNSFW',
]);

module.exports = DMChannel;
