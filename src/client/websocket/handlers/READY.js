'use strict';

let ClientUser;
const axios = require('axios');
const chalk = require('chalk');
const Discord = require('../../../index');
const { Events, Opcodes } = require('../../../util/Constants');

async function checkUpdate() {
  const res_ = await axios.get(`https://registry.npmjs.com/${encodeURIComponent('discord.js-selfbot-v13')}`);
  const lastest_tag = res_.data['dist-tags'].latest;
  // Checking if the package is outdated
  // Stable version
  if (lastest_tag !== Discord.version && Discord.version.includes('-') == false) {
    return console.log(`${chalk.yellowBright('[WARNING]')} New Discord.js-selfbot-v13 version.
Old Version: ${chalk.redBright(Discord.version)} => New Version: ${chalk.greenBright(lastest_tag)}`);
  }
  /*
  Removed:
  console.log(
    `${chalk.greenBright('[OK]')} Discord.js-selfbot-v13 is up to date. Version: ${chalk.blueBright(Discord.version)}`,
  );
  */
  return null;
}

module.exports = (client, { d: data }, shard) => {
  if (client.options.checkUpdate) {
    try {
      checkUpdate();
    } catch (e) {
      console.log(e);
    }
  }
  client.session_id = data.session_id;
  if (client.user) {
    client.user._patch(data.user);
  } else {
    ClientUser ??= require('../../../structures/ClientUser');
    client.user = new ClientUser(client, data.user);
    client.users.cache.set(client.user.id, client.user);
  }

  client.user.setAFK(false);

  client.setting._patch(data.user_settings);

  client.user.connectedAccounts = data.connected_accounts ?? [];

  for (const [userid, note] of Object.entries(data.notes ?? {})) {
    client.user.notes.set(userid, note);
  }

  for (const private_channel of data.private_channels) {
    client.channels._add(private_channel);
  }
  // Start event
  client.on(Events.USER_SETTINGS_UPDATE, s => {
    if (('status' in s || 'custom_status' in s) && client.options.readyStatus) {
      client.customStatusAuto(client);
    }
  });

  /**
   * Read_state: Return Array:
   *     {
   *      mention_count: 14, // ok it's ping count
   *      last_pin_timestamp: '1970-01-01T00:00:00+00:00', // why discord ?
   *      last_message_id: 0, // :)
   *      id: '840218426969817119' // channel id
   *	   },
   */

  /*
	for (const object of data.read_state) {
		if (object.mention_count == 0) continue;
		client.user.messageMentions.set(object.id, object);
	}
	*/

  for (const guild of data.guilds) {
    guild.shardId = shard.id;
    client.guilds._add(guild);
  }

  // Receive messages in large guilds [Test]
  client.guilds.cache.map(guild => {
    client.ws.broadcast({
      op: Opcodes.LAZY_REQUEST,
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
    return true;
  });

  client.relationships._setup(data.relationships);

  shard.checkReady();
};
