'use strict';

const VoiceConnection = require('./VoiceConnection');
const { Error } = require('../../errors');
const { Events } = require('../../util/Constants');

/**
 * Manages voice connections for the client
 * Feat: Support both lib & djs/voice
 */
class ClientVoiceManager {
  constructor(client) {
    /**
     * The client that instantiated this voice manager
     * @type {Client}
     * @readonly
     * @name ClientVoiceManager#client
     */
    Object.defineProperty(this, 'client', { value: client });

    /**
     * A current connection objects
     * @type {?VoiceConnection}
     */
    this.connection = null;

    /**
     * Maps guild ids to voice adapters created for use with @discordjs/voice.
     * @type {Map<Snowflake, Object>}
     */
    this.adapters = new Map();

    client.on(Events.SHARD_DISCONNECT, (_, shardId) => {
      for (const [guildId, adapter] of this.adapters.entries()) {
        if (client.guilds.cache.get(guildId)?.shardId === shardId) {
          // Because it has 1 shard => adapter.destroy();
        }
        adapter.destroy();
      }
    });
  }

  onVoiceServer(payload) {
    const { guild_id, channel_id, token, endpoint } = payload;
    this.client.emit(
      'debug',
      `[VOICE] voiceServer ${channel_id ? 'channel' : 'guild'}: ${
        channel_id || guild_id
      } token: ${token} endpoint: ${endpoint}`,
    );
    const connection = this.connection;
    if (connection) connection.setTokenAndEndpoint(token, endpoint);
    // Djs / voice
    if (payload.guild_id) {
      this.adapters.get(payload.guild_id)?.onVoiceServerUpdate(payload);
    } else {
      this.adapters.get(payload.channel_id)?.onVoiceServerUpdate(payload);
    }
  }

  onVoiceStateUpdate(payload) {
    const { guild_id, session_id, channel_id } = payload;
    // @discordjs/voice
    if (payload.guild_id && payload.session_id && payload.user_id === this.client.user?.id) {
      this.adapters.get(payload.guild_id)?.onVoiceStateUpdate(payload);
    } else if (payload.channel_id && payload.session_id && payload.user_id === this.client.user?.id) {
      this.adapters.get(payload.channel_id)?.onVoiceStateUpdate(payload);
    }
    // Main lib
    const connection = this.connection;
    this.client.emit('debug', `[VOICE] connection? ${!!connection}, ${guild_id} ${session_id} ${channel_id}`);
    if (!connection) return;
    if (!channel_id) {
      connection._disconnect();
      this.connection = null;
      return;
    }
    const channel = this.client.channels.cache.get(channel_id);
    if (channel) {
      connection.channel = channel;
      connection.setSessionId(session_id);
    } else {
      this.client.emit('debug', `[VOICE] disconnecting from guild ${guild_id} as channel ${channel_id} is uncached`);
      connection.disconnect();
    }
  }

  /**
   * @property {boolean} [selfMute=false]
   * @property {boolean} [selfDeaf=false]
   * @property {boolean} [selfVideo=false]
   * @property {VideoCodec} [videoCodec='H264']
   * @typedef {Object} JoinChannelConfig
   */

  /**
   * Sets up a request to join a voice channel.
   * @param {VoiceChannel | StageChannel | DMChannel | GroupDMChannel | Snowflake} channel The voice channel to join
   * @param {JoinChannelConfig} config Config to join voice channel
   * @returns {Promise<VoiceConnection>}
   */
  joinChannel(channel, config = {}) {
    return new Promise((resolve, reject) => {
      channel = this.client.channels.resolve(channel);
      if (!['DM', 'GROUP_DM'].includes(channel?.type) && !channel.joinable) {
        throw new Error('VOICE_JOIN_CHANNEL', channel.full);
      }

      let connection = this.connection;

      if (connection) {
        if (connection.channel.id !== channel.id) {
          this.connection.updateChannel(channel);
        }
        resolve(connection);
        return;
      } else {
        connection = new VoiceConnection(this, channel);
        if (config?.videoCodec) connection.setVideoCodec(config.videoCodec);
        connection.on('debug', msg =>
          this.client.emit('debug', `[VOICE (${channel.guild?.id || channel.id}:${connection.status})]: ${msg}`),
        );
        connection.authenticate({
          self_mute: Boolean(config.selfMute),
          self_deaf: Boolean(config.selfDeaf),
          self_video: Boolean(config.selfVideo),
        });
        this.connection = connection;
      }

      connection.once('failed', reason => {
        this.connection = null;
        reject(reason);
      });

      connection.on('error', reject);

      connection.once('authenticated', () => {
        connection.once('ready', () => {
          resolve(connection);
          connection.removeListener('error', reject);
        });
        connection.once('disconnect', () => {
          this.connection = null;
        });
      });
    });
  }
}

module.exports = ClientVoiceManager;
