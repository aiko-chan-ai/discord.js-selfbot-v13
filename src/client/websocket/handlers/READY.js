'use strict';

const ClientApplication = require('../../../structures/ClientApplication');
const User = require('../../../structures/User');
let ClientUser;
const chalk = require('chalk');
const axios = require('axios');
const Discord = require('../../../index');

const checkUpdate = async () => {
	const res_ = await axios.get(
		`https://registry.npmjs.com/${encodeURIComponent(
			'discord.js-selfbot-v13',
		)}`,
	);
	const lastest_tag = res_.data['dist-tags'].latest;
	// Checking if the package is outdated
	// Stable version
	if (lastest_tag !== Discord.version) {
		return console.log(`${chalk.yellowBright(
			'[WARNING]',
		)} New Discord.js-selfbot-v13 version.
Old Version: ${chalk.redBright(
			Discord.version,
		)} => New Version: ${chalk.greenBright(lastest_tag)}`);
	}
	return console.log(
		`${chalk.greenBright(
			'[OK]',
		)} Discord.js-selfbot-v13 is up to date. Version: ${chalk.blueBright(
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

	client.setting.fetch().then(async (res) => {
		let custom_status;
		if (
			res.rawSetting.custom_status?.text ||
			res.rawSetting.custom_status?.emoji_name
		) {
			custom_status = new Discord.RichPresence.CustomStatus();
			if (res.rawSetting.custom_status.emoji_id) {
				const emoji = await client.emojis.resolve(
					res.rawSetting.custom_status.emoji_id,
				);
				if (emoji) custom_status.setDiscordEmoji(emoji);
			} else {
				custom_status.setUnicodeEmoji(res.rawSetting.custom_status.emoji_name);
			}
			custom_status.setState(res.rawSetting.custom_status?.text);
			client.user.setPresence({
				activities: custom_status ? [custom_status.toDiscord()] : [],
				status: res.rawSetting.status,
			});
		}
	});

	for (const guild of data.guilds) {
		guild.shardId = shard.id;
		client.guilds._add(guild);
	}

	for (const r of data.relationships) {
		if (r.type == 1) {
			client.friends.cache.set(r.id, new User(client, r.user));
		} else if (r.type == 2) {
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
