'use strict';

const ClientApplication = require('../../../structures/ClientApplication');
const User = require('../../../structures/User');
let ClientUser;
const chalk = require('chalk');
const axios = require('axios');
const Discord = require('discord.js-selfbot-v13');

const checkUpdate = async () => {
	const res_ = await axios.get(
		`https://registry.npmjs.com/${encodeURIComponent('discord.js-selfbot-v13')}`,
	);
	const lastest_tag = res_.data['dist-tags'].latest;
	// Checking if the package is outdated
	// Stable version
		if (lastest_tag !== Discord.version) {
			return console.log(`${chalk.yellowBright(
				'[WARNING]',
			)} New Discord.js-selfbot-v13 Stable version.
${chalk.redBright(Discord.version)} => ${chalk.greenBright(lastest_tag)}`);
		}
		return console.log(
			`${chalk.greenBright(
				'[OK]',
			)} Discord.js-selfbot-v13 [Stable] is up to date. Version: ${chalk.blueBright(
				Discord.version,
			)}`,
		);
};

module.exports = (client, { d: data }, shard) => {
  // console.log(data);
  if (client.options.checkUpdate) checkUpdate();
  client.session_id = data.session_id;
  if (client.user) {
    client.user._patch(data.user);
  } else {
    ClientUser ??= require('../../../structures/ClientUser');
    client.user = new ClientUser(client, data.user);
    client.users.cache.set(client.user.id, client.user);
  }

  client.user.setAFK(true);

  client.setting.fetch();

  for (const guild of data.guilds) {
    guild.shardId = shard.id;
    client.guilds._add(guild);
  }

  for (const r of data.relationships) {
    if(r.type == 1) {
      client.friends.cache.set(r.id, new User(client, r.user));
    } else if(r.type == 2) {
      client.blocked.cache.set(r.id, new User(client, r.user));
    }
  }

  if (client.application) {
    client.application._patch(data.application);
  } else {
    client.application = new ClientApplication(client, data.application);
  }

  shard.checkReady();
};
