'use strict';

const USER_REQUIRED_ACTION = require('./USER_REQUIRED_ACTION_UPDATE');
const { Opcodes } = require('../../../util/Constants');

let ClientUser;

module.exports = (client, { d: data }, shard) => {
  // Check
  USER_REQUIRED_ACTION(client, { d: data });

  if (client.user) {
    client.user._patch(data.user);
  } else {
    ClientUser ??= require('../../../structures/ClientUser');
    client.user = new ClientUser(client, data.user);
    client.users.cache.set(client.user.id, client.user);
  }

  for (const private_channel of data.private_channels) {
    client.channels._add(private_channel);
  }

  for (const guild of data.guilds) {
    guild.shardId = shard.id;
    client.guilds._add(guild);
  }

  const largeGuilds = data.guilds.filter(g => g.large);
  client.emit('debug', `[READY] Received ${data.guilds.length} guilds, ${largeGuilds.length} large guilds`);

  // User Notes
  client.notes._reload(data.notes);

  // Relationship
  client.relationships._setup(data.relationships);

  // ClientSetting
  client.settings._patch(data.user_settings);

  Promise.all(
    largeGuilds.map(async (guild, index) => {
      client.ws.broadcast({
        op: Opcodes.GUILD_SUBSCRIPTIONS,
        d: {
          guild_id: guild.id,
          typing: true,
          threads: true,
          activities: true,
          thread_member_lists: [],
          members: [],
          channels: {},
        },
      });
      client.emit('debug', `[READY] Register guild ${guild.id}`);
      await client.sleep(client.options.messageCreateEventGuildTimeout * index);
    }),
    data.private_channels.map(async (c, index) => {
      if (client.options.DMChannelVoiceStatusSync < 1) return;
      client.ws.broadcast({
        op: Opcodes.DM_UPDATE,
        d: {
          channel_id: c.id,
        },
      });
      await client.sleep(client.options.DMChannelVoiceStatusSync * index);
    }),
  ).then(() => shard.checkReady());
};
