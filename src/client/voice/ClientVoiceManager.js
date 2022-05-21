'use strict';

const { Events } = require('../../util/Constants');

/**
 * Manages voice connections for the client
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
    if (payload.guild_id) {
      this.adapters.get(payload.guild_id)?.onVoiceServerUpdate(payload);
    } else {
      this.adapters.get(payload.channel_id)?.onVoiceServerUpdate(payload);
    }
  }

  onVoiceStateUpdate(payload) {
    if (payload.guild_id && payload.session_id && payload.user_id === this.client.user?.id) {
      this.adapters.get(payload.guild_id)?.onVoiceStateUpdate(payload);
    } else if (payload.channel_id && payload.session_id && payload.user_id === this.client.user?.id) {
      this.adapters.get(payload.channel_id)?.onVoiceStateUpdate(payload);
    }
  }
}

module.exports = ClientVoiceManager;
