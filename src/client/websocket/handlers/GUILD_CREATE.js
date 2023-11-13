'use strict';

const { Events, Opcodes, Status } = require('../../../util/Constants');

// Receive messages in large guilds
const run = (client, guild) => {
  if (!guild.large) return;
  client.ws.broadcast({
    op: Opcodes.GUILD_SUBSCRIPTIONS,
    d: {
      guild_id: guild.id,
      typing: true,
      threads: false,
      activities: true,
      thread_member_lists: [],
      members: [],
      channels: {
        // [guild.channels.cache.first().id]: [[0, 99]],
      },
    },
  });
};

module.exports = (client, { d: data }, shard) => {
  let guild = client.guilds.cache.get(data.id);
  if (guild) {
    if (!guild.available && !data.unavailable) {
      // A newly available guild
      guild._patch(data);
      run(client, guild);

      /**
       * Emitted whenever a guild becomes available.
       * @event Client#guildAvailable
       * @param {Guild} guild The guild that became available
       */
      client.emit(Events.GUILD_AVAILABLE, guild);
    }
  } else {
    // A new guild
    data.shardId = shard.id;
    guild = client.guilds._add(data);
    if (client.ws.status === Status.READY) {
      /**
       * Emitted whenever the client joins a guild.
       * @event Client#guildCreate
       * @param {Guild} guild The created guild
       */
      client.emit(Events.GUILD_CREATE, guild);
      run(client, guild);
    }
  }
};
